import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleIcon, SendIcon, PaperclipIcon, SmileIcon, UserIcon } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

type ChatPanelProps = {
  shipmentId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'customer' | 'staff' | 'admin';
  };
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'customer' | 'staff' | 'admin' | 'system';
  created_at: string;
  is_read?: boolean;
};

export const ChatPanel = ({ shipmentId, currentUser }: ChatPanelProps) => {
  console.log('🔵 ChatPanel Component Mounted!', { shipmentId, currentUser });
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages and subscribe to real-time updates
  useEffect(() => {
    let subscription: any;
    let isMounted = true;

    const loadMessages = async () => {
      if (!isMounted) return;
      console.log('Loading messages for shipment:', shipmentId);
      try {
        // Load messages from Supabase
        const data = await supabaseService.messages.getByShipment(shipmentId);
        console.log('Loaded messages from database:', data);
        
        // Mark messages as read based on current user role
        if (data && data.length > 0 && isMounted) {
          const role = currentUser.role;
          const unreadField = role === 'staff' ? 'read_by_staff' : 'read_by_customer';
          const senderFilter = role === 'staff' ? 'customer' : 'staff';
          
          // Find messages that need to be marked as read
          const messagesToMarkRead = data.filter((msg: any) => 
            !msg[unreadField] && msg.sender_role === senderFilter
          );
          
          if (messagesToMarkRead.length > 0) {
            const messageIds = messagesToMarkRead.map((msg: any) => msg.id);
            try {
              await supabaseService.messages.markAsRead(messageIds, role);
              console.log(`Marked ${messageIds.length} messages as read for ${role}`);
            } catch (err) {
              console.error('Error marking messages as read:', err);
            }
          }
        }
        
        if (data && data.length > 0) {
          if (isMounted) {
            setMessages(data);
          }
        } else {
          console.log('No messages found, creating welcome message...');
          // Create a welcome message if no messages exist
          const welcomeMessage = {
            shipment_id: shipmentId,
            content: `Welcome to the shipment ${shipmentId} discussion. All parties (customer, staff, and admin) can communicate here.`,
            sender_id: 'system',
            sender_name: 'System',
            sender_role: 'system' as const,
          };
          
          try {
            const created = await supabaseService.messages.create(welcomeMessage);
            console.log('Welcome message created:', created);
            if (isMounted) {
              setMessages([created]);
            }
          } catch (err) {
            console.error('Error creating welcome message:', err);
          }
        }

        // Subscribe to real-time updates
        if (isMounted) {
          subscription = supabaseService.messages.subscribeToShipment(
            shipmentId,
            (newMessage: Message) => {
              console.log('Real-time message received:', newMessage);
              if (isMounted) {
                setMessages(prev => {
                  // Check if message already exists (avoid duplicates)
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (exists) {
                    console.log('Message already exists, skipping duplicate');
                    return prev;
                  }

                  // Dispatch custom event for notifications
                  if (newMessage.sender_id !== currentUser.id) {
                    window.dispatchEvent(new CustomEvent('newChatMessage', {
                      detail: {
                        shipmentId,
                        message: newMessage.content,
                        senderName: newMessage.sender_name,
                        senderId: newMessage.sender_id
                      }
                    }));
                  }

                  return [...prev, newMessage];
                });
              }
            }
          );
          console.log('Subscribed to real-time updates');
        }
      } catch (error) {
        console.error('Error loading messages from database, falling back to localStorage:', error);
        // Fallback to localStorage if Supabase fails
        const storedMessages = localStorage.getItem(`chat_${shipmentId}`);
        if (storedMessages && isMounted) {
          const parsed = JSON.parse(storedMessages);
          setMessages(parsed);
          console.log('Loaded messages from localStorage:', parsed);
        }
      }
    };

    loadMessages();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      if (subscription) {
        supabaseService.messages.unsubscribe(shipmentId);
      }
    };
  }, [shipmentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    console.log('Attempting to send message:', {
      shipment_id: shipmentId,
      content: message,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_role: currentUser.role,
    });

    try {
      // Create message in Supabase
      const savedMessage = await supabaseService.messages.create({
        shipment_id: shipmentId,
        content: message,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
      });
      
      console.log('Message saved to database successfully:', savedMessage);
      
      // Add the message to local state immediately
      if (savedMessage) {
        setMessages(prev => [...prev, savedMessage]);

        // Store message globally for cross-user notifications
        // In a real app, this would be handled by real-time subscriptions
        // For demo purposes, we'll use localStorage to simulate notifications for other users
        const globalMessages = JSON.parse(localStorage.getItem('global_chat_messages') || '[]');
        globalMessages.push({
          ...savedMessage,
          timestamp: Date.now()
        });
        localStorage.setItem('global_chat_messages', JSON.stringify(globalMessages.slice(-100))); // Keep last 100

        console.log('🔔 Saved message globally for notification system:', savedMessage);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message to database:', error);
      console.log('Falling back to localStorage...');
      
      // Fallback to localStorage if Supabase fails
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: message,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role,
        created_at: new Date().toISOString(),
        is_read: false
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`chat_${shipmentId}`, JSON.stringify(updatedMessages));
      console.log('Message saved to localStorage:', newMessage);

      // Store message globally for cross-user notifications (fallback case)
      const globalMessages = JSON.parse(localStorage.getItem('global_chat_messages') || '[]');
      globalMessages.push({
        ...newMessage,
        timestamp: Date.now()
      });
      localStorage.setItem('global_chat_messages', JSON.stringify(globalMessages.slice(-100)));

      setMessage('');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: 'customer' | 'staff' | 'admin') => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-teal-100 text-teal-800';
      case 'customer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mr-3">
            <MessageCircleIcon className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Shipment Discussion</h3>
            <p className="text-xs text-gray-500">
              Shipment {shipmentId} • All parties can participate
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 p-4 overflow-y-auto bg-gray-50"
      >
        <div className="space-y-3">
          {messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const msgDate = new Date(msg.created_at);
            const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
            const showDate = !prevMsg || msgDate.toDateString() !== prevDate!.toDateString();
            
            // Show date separator
            const dateSeparator = showDate && (
              <div className="flex justify-center my-4">
                <span className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-gray-600 shadow-sm">
                  {new Date(msg.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                    ? 'Today' 
                    : new Date(msg.created_at).toLocaleDateString()}
                </span>
              </div>
            );

            // System messages
            if (msg.sender_id === 'system') {
              return (
                <React.Fragment key={msg.id}>
                  {dateSeparator}
                  <div className="flex justify-center">
                    <div className="bg-teal-50/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-teal-700 max-w-sm text-center shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            // Regular messages
            const isOwnMessage = msg.sender_id === currentUser.id;
            const showAvatar = !isOwnMessage && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            
            return (
              <React.Fragment key={msg.id}>
                {dateSeparator}
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${!showAvatar && !isOwnMessage ? 'ml-10' : ''}`}>
                  {!isOwnMessage && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isOwnMessage && showAvatar && (
                      <div className="flex items-center gap-2 mb-1 ml-3">
                        <span className="text-xs font-semibold text-gray-700">
                          {msg.sender_name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          msg.sender_role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          msg.sender_role === 'staff' ? 'bg-teal-100 text-teal-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {msg.sender_role}
                        </span>
                      </div>
                    )}
                    <div className={`
                      relative rounded-2xl px-3 py-2 shadow-sm
                      ${isOwnMessage 
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                      }
                    `}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[10px] ${isOwnMessage ? 'text-teal-100' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isOwnMessage && (
                          <span className="text-teal-100">
                            {msg.is_read ? (
                              <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 11">
                                <path d="M11.0714 0.652832C11.3409 0.41384 11.7556 0.41384 12.025 0.652832L15.9786 4.25712C16.2481 4.49612 16.2481 4.88457 15.9786 5.12357L11.0714 8.72786C10.8019 8.96685 10.3872 8.96685 10.1178 8.72786L8.92857 7.66088C8.65911 7.42189 8.65911 7.03344 8.92857 6.79444C9.19803 6.55545 9.61272 6.55545 9.88218 6.79444L10.5947 7.46752L13.6171 4.69035L10.5947 1.91318L9.88218 2.58626C9.61272 2.82525 9.19803 2.82525 8.92857 2.58626C8.65911 2.34727 8.65911 1.95882 8.92857 1.71982L10.1178 0.652832C10.3872 0.41384 10.8019 0.41384 11.0714 0.652832Z"/>
                                <path d="M1.0714 4.25712C1.34086 4.01813 1.75554 4.01813 2.025 4.25712L5.97857 7.86141C6.24803 8.1004 6.24803 8.48885 5.97857 8.72784L1.0714 12.3321C0.801942 12.5711 0.387252 12.5711 0.117806 12.3321C-0.151652 12.0931 -0.151652 11.7047 0.117806 11.4657L3.6401 8.29485L0.117806 5.12398C-0.151652 4.88499 -0.151652 4.49654 0.117806 4.25755L1.0714 4.25712Z"/>
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 9">
                                <path d="M3.78851 6.57224L1.4227 4.3608C1.18835 4.14288 0.812199 4.14288 0.577849 4.3608C0.343498 4.57873 0.343498 4.93195 0.577849 5.14988L3.36635 7.73916C3.6007 7.95708 3.97685 7.95708 4.2112 7.73916L11.4221 0.960803C11.6565 0.742875 11.6565 0.389657 11.4221 0.17173C11.1878 -0.0461976 10.8116 -0.0461976 10.5773 0.17173L3.78851 6.57224Z"/>
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 focus:outline-none"
          />
          <button className="p-2 text-gray-400 hover:text-gray-600 mr-1">
            <SmileIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700 disabled:bg-teal-600/50"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};