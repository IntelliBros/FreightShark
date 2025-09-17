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
    console.log('🔔 addNotification called with:', notification, 'for user:', user?.id);

    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: formatTimestamp(now),
      date: now.toISOString(),
      read: false
    };

    console.log('🔔 Created notification:', newNotification);
    setNotifications(prev => {
      console.log('🔔 Previous notifications:', prev.length);
      const updated = [newNotification, ...prev];
      console.log('🔔 Updated notifications:', updated.length);
      return updated;
    });

    // Store in localStorage for persistence
    const storedNotifications = localStorage.getItem(`notifications_${user?.id}`);
    const existing = storedNotifications ? JSON.parse(storedNotifications) : [];
    const updated = [newNotification, ...existing].slice(0, 50); // Keep only last 50
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
    console.log('🔔 Saved to localStorage for user:', user?.id);
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

  // Monitor for new messages from database
  useEffect(() => {
    if (!user?.id) return;

    // Track last checked timestamp for this user
    const lastCheckedKey = `last_checked_messages_${user.id}`;
    const storedValue = localStorage.getItem(lastCheckedKey);
    let lastChecked: Date;

    // Handle invalid or missing dates (could be old timestamp number or date string)
    try {
      if (!storedValue) {
        // No previous value, start from 5 minutes ago
        lastChecked = new Date(Date.now() - 5 * 60 * 1000);
      } else if (/^\d+$/.test(storedValue)) {
        // Old format: timestamp number
        lastChecked = new Date(parseInt(storedValue));
      } else {
        // New format: ISO date string
        lastChecked = new Date(storedValue);
      }

      // Check if date is valid
      if (isNaN(lastChecked.getTime())) {
        lastChecked = new Date(Date.now() - 5 * 60 * 1000);
      }
    } catch (e) {
      console.log('🔔 Error parsing last checked date, using default:', e);
      lastChecked = new Date(Date.now() - 5 * 60 * 1000);
    }

    const checkForNewMessages = async () => {
      try {
        // Import supabaseService
        const { supabaseService } = await import('../services/supabaseService');

        // Get all recent messages for the user's shipments
        // For customers, get messages from staff
        // For staff, get messages from customers
        const roleFilter = user.role === 'user' ? 'staff' : 'customer';

        console.log('🔔 Checking database for new messages:', {
          userRole: user.role,
          lookingFor: roleFilter,
          lastChecked: lastChecked.toISOString()
        });

        // Get messages from the last 24 hours for all shipments
        const recentMessages = await supabaseService.messages.getRecentForUser(
          user.id,
          user.role as any,
          lastChecked.toISOString()
        );

        console.log('🔔 Found messages from database:', recentMessages?.length || 0);

        if (recentMessages && recentMessages.length > 0) {
          // Filter for messages from other users
          const newMessages = recentMessages.filter((msg: any) =>
            msg.sender_id !== user.id &&
            new Date(msg.created_at) > lastChecked
          );

          console.log('🔔 New messages to notify:', newMessages.length);

          newMessages.forEach((msg: any) => {
            // Check if we already have this notification
            const exists = notifications.some(n =>
              n.message.includes(msg.content.substring(0, 20))
            );

            if (!exists) {
              console.log('🔔 Creating notification for message:', msg);
              addNotification({
                type: 'message',
                icon: MessageSquare,
                title: 'New Message',
                message: `${msg.sender_name}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`,
                read: false,
                link: `/shipments/${msg.shipment_id}`
              });
            }
          });
        }

        // Update last checked timestamp
        const now = new Date();
        localStorage.setItem(lastCheckedKey, now.toISOString());
        lastChecked = now;
      } catch (error) {
        console.error('🔔 Error checking for new messages:', error);
      }
    };

    // Check immediately
    checkForNewMessages();

    // Check every 5 seconds for new messages from database
    const interval = setInterval(checkForNewMessages, 5000);

    // Listen for manual notification checks
    const handleManualCheck = () => {
      console.log('🔔 Manual notification check triggered');
      checkForNewMessages();
    };
    window.addEventListener('checkNotifications' as any, handleManualCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('checkNotifications' as any, handleManualCheck);
    };
  }, [user, addNotification, notifications]);

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