import React, { useState, useEffect, useRef } from 'react';
import { MessageCircleIcon, SendIcon, PaperclipIcon, SmileIcon, UserIcon } from 'lucide-react';

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
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'staff' | 'admin';
  timestamp: Date;
  isRead?: boolean;
};

export const ChatPanel = ({ shipmentId, currentUser }: ChatPanelProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages for this shipment
  useEffect(() => {
    const loadMessages = () => {
      // Load messages from localStorage for this shipment
      const storedMessages = localStorage.getItem(`chat_${shipmentId}`);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        // Initialize with a welcome message
        const welcomeMessage: Message = {
          id: 'welcome-1',
          content: `Welcome to the shipment ${shipmentId} discussion. All parties (customer, staff, and admin) can communicate here.`,
          senderId: 'system',
          senderName: 'System',
          senderRole: 'staff',
          timestamp: new Date(),
          isRead: true
        };
        setMessages([welcomeMessage]);
        // Save the welcome message
        localStorage.setItem(`chat_${shipmentId}`, JSON.stringify([welcomeMessage]));
      }
    };

    loadMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);

    return () => clearInterval(interval);
  }, [shipmentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Create new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: message,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      timestamp: new Date(),
      isRead: false
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    
    // Save to localStorage
    localStorage.setItem(`chat_${shipmentId}`, JSON.stringify(updatedMessages));
    
    setMessage('');

    // Simulate a response from staff/customer after 2 seconds (for demo purposes)
    if (currentUser.role === 'customer') {
      setTimeout(() => {
        const staffResponse: Message = {
          id: `msg-${Date.now()}-staff`,
          content: "Thank you for your message. A staff member will assist you shortly.",
          senderId: 'staff-demo',
          senderName: 'FreightShark Support',
          senderRole: 'staff',
          timestamp: new Date(),
          isRead: false
        };
        
        const currentMessages = JSON.parse(localStorage.getItem(`chat_${shipmentId}`) || '[]');
        const updatedWithResponse = [...currentMessages, staffResponse];
        localStorage.setItem(`chat_${shipmentId}`, JSON.stringify(updatedWithResponse));
        setMessages(updatedWithResponse.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }, 2000);
    }
  };

  const formatTime = (date: Date) => {
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
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg) => {
            // System messages
            if (msg.senderId === 'system') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600">
                    {msg.content}
                  </div>
                </div>
              );
            }

            // Regular messages
            const isOwnMessage = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                {!isOwnMessage && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <UserIcon className="h-4 w-4 text-gray-600" />
                  </div>
                )}
                <div className={`max-w-[75%]`}>
                  {!isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {msg.senderName}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(msg.senderRole)}`}>
                        {msg.senderRole}
                      </span>
                    </div>
                  )}
                  <div className={`rounded-2xl p-3 ${isOwnMessage ? 'bg-teal-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex justify-end items-center mt-1 gap-1">
                      <span className={`text-xs ${isOwnMessage ? 'text-gray-200' : 'text-gray-500'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <span className="text-xs text-gray-200">
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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