import React, { useState } from 'react';
import { MessageCircleIcon, SendIcon, XIcon, PaperclipIcon, SmileIcon } from 'lucide-react';
import { Button } from '../ui/Button';
type ChatPanelProps = {
  contextType: 'quote' | 'shipment';
  contextId: string;
  isOpen?: boolean;
  onClose?: () => void;
};
type Message = {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  isRead?: boolean;
  senderName?: string;
};
export const ChatPanel = ({
  contextType,
  contextId,
  isOpen = false,
  onClose
}: ChatPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: 'date-1',
    content: 'Today, 20 Nov',
    sender: 'system',
    timestamp: new Date()
  }, {
    id: 'agent-1',
    content: `Hello! How can I help you with your ${contextType} ${contextId}?`,
    sender: 'agent',
    timestamp: new Date(Date.now() - 60000),
    senderName: 'Support Agent'
  }, {
    id: 'user-1',
    content: 'Hello, guys',
    sender: 'user',
    timestamp: new Date(Date.now() - 50000),
    isRead: true
  }, {
    id: 'user-2',
    content: 'I want to share a Power Point Presentation',
    sender: 'user',
    timestamp: new Date(Date.now() - 40000),
    isRead: true
  }, {
    id: 'user-3',
    content: 'Please check yours email',
    sender: 'user',
    timestamp: new Date(Date.now() - 30000),
    isRead: true
  }, {
    id: 'agent-2',
    content: 'Amazing',
    sender: 'agent',
    timestamp: new Date(Date.now() - 20000),
    senderName: 'Support Agent'
  }, {
    id: 'agent-3',
    content: 'I like it',
    sender: 'agent',
    timestamp: new Date(Date.now() - 10000),
    senderName: 'Support Agent'
  }]);
  const toggleChat = () => {
    setIsExpanded(!isExpanded);
  };
  const handleSendMessage = () => {
    if (!message.trim()) return;
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
      isRead: false
    };
    setMessages([...messages, userMessage]);
    setMessage('');
    // Simulate agent response after a short delay
    setTimeout(() => {
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        content: `I'm reviewing your ${contextType} ${contextId}. I'll get back to you shortly with more information.`,
        sender: 'agent',
        timestamp: new Date(),
        senderName: 'Support Agent'
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };
  if (!isExpanded) {
    return <Button variant="primary" className="flex items-center shadow-lg" onClick={toggleChat}>
        <MessageCircleIcon className="h-4 w-4 mr-2" />
        Chat with Agent
      </Button>;
  }
  return <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#E6EDF8] flex items-center justify-center mr-3">
            <MessageCircleIcon className="h-5 w-5 text-[#2E3B55]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Support Chat</h3>
            <p className="text-xs text-gray-500">
              {contextType === 'quote' ? 'Quote' : 'Shipment'} {contextId}
            </p>
          </div>
        </div>
        <button onClick={onClose || toggleChat} className="text-gray-400 hover:text-gray-600">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map(msg => {
          if (msg.sender === 'system') {
            return <div key={msg.id} className="flex justify-center">
                  <div className="bg-gray-200 rounded-full px-4 py-1 text-xs text-gray-600">
                    {msg.content}
                  </div>
                </div>;
          }
          return <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'agent' && <div className="w-8 h-8 rounded-full bg-[#E6EDF8] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <MessageCircleIcon className="h-4 w-4 text-[#2E3B55]" />
                  </div>}
                <div className={`max-w-[75%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-[#2E3B55] text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                  {msg.sender === 'agent' && msg.senderName && <div className="text-xs text-gray-500 mb-1">
                      {msg.senderName}
                    </div>}
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex justify-end items-center mt-1 gap-1">
                    <span className={`text-xs ${msg.sender === 'user' ? 'text-gray-200' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.sender === 'user' && <span className="text-xs text-gray-200">
                        {msg.isRead ? '✓✓' : '✓'}
                      </span>}
                  </div>
                </div>
              </div>;
        })}
        </div>
      </div>
      {/* Chat Input */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <PaperclipIcon className="h-5 w-5" />
          </button>
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type your message..." className="flex-1 px-3 py-2 focus:outline-none" />
          <button className="p-2 text-gray-400 hover:text-gray-600 mr-1">
            <SmileIcon className="h-5 w-5" />
          </button>
          <button onClick={handleSendMessage} disabled={!message.trim()} className="bg-[#2E3B55] text-white rounded-full p-2 hover:bg-[#1e2940] disabled:bg-[#2E3B55]/50">
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>;
};