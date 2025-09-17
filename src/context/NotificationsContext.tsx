import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { FileText, AlertCircle, MessageSquare, Package } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'quote' | 'invoice' | 'alert' | 'message' | 'shipment';
  icon: any;
  title: string;
  message: string;
  timestamp: string;
  date: string;
  read: boolean;
  link: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'date'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  refreshNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { quotes, shipments } = useData();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate notification ID
  const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'date'>) => {
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: formatTimestamp(now),
      date: now.toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Store in localStorage for persistence
    const storedNotifications = localStorage.getItem(`notifications_${user?.id}`);
    const existing = storedNotifications ? JSON.parse(storedNotifications) : [];
    const updated = [newNotification, ...existing].slice(0, 50); // Keep only last 50
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );

    // Update localStorage
    if (user?.id) {
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  }, [notifications, user]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // Update localStorage
    if (user?.id) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
    }
  }, [notifications, user]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (user?.id) {
      localStorage.removeItem(`notifications_${user.id}`);
    }
  }, [user]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const storedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        // Generate some initial notifications based on existing data
        generateInitialNotifications();
      }
    }
  }, [user]);

  // Generate initial notifications from existing data
  const generateInitialNotifications = () => {
    const initialNotifications: Notification[] = [];

    // Check for recent quotes
    if (quotes && quotes.length > 0) {
      const recentQuote = quotes[0];
      if (recentQuote.status === 'Approved') {
        initialNotifications.push({
          id: generateId(),
          type: 'quote',
          icon: FileText,
          title: 'Quote Ready',
          message: `Your quote #${recentQuote.id} is ready for review`,
          timestamp: '2 hours ago',
          date: new Date().toISOString(),
          read: false,
          link: `/quotes/${recentQuote.id}`
        });
      }
    }

    // Check for shipments needing attention
    if (shipments && shipments.length > 0) {
      shipments.forEach(shipment => {
        // Check for missing Amazon IDs
        if (shipment.destinations?.some((d: any) => !d.amazonShipmentId)) {
          initialNotifications.push({
            id: generateId(),
            type: 'alert',
            icon: AlertCircle,
            title: 'Shipment IDs Missing',
            message: `Please provide Amazon shipment IDs for #${shipment.id}`,
            timestamp: '1 day ago',
            date: new Date().toISOString(),
            read: false,
            link: `/shipments/${shipment.id}`
          });
        }
      });
    }

    setNotifications(initialNotifications);
  };

  // Refresh notifications (called when new data arrives)
  const refreshNotifications = useCallback(() => {
    // This can be called by other components when they create new data
    // For now, we'll just re-generate from existing data
    if (user?.id) {
      const storedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
    }
  }, [user]);

  // Monitor for new messages (integrate with chat system)
  useEffect(() => {
    // Listen for custom events that might be dispatched by the chat system
    const handleNewMessage = (event: CustomEvent) => {
      const { shipmentId, message, senderName, senderId } = event.detail;

      // Only create notification if message is from someone else
      // Check both ID and name to handle different scenarios
      if (senderId !== user?.id && senderName !== user?.name) {
        addNotification({
          type: 'message',
          icon: MessageSquare,
          title: 'New Message',
          message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          read: false,
          link: `/shipments/${shipmentId}`
        });
      }
    };

    window.addEventListener('newChatMessage' as any, handleNewMessage as any);

    return () => {
      window.removeEventListener('newChatMessage' as any, handleNewMessage as any);
    };
  }, [user, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};