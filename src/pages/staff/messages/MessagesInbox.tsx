import React, { useState, useEffect } from 'react';
import { SearchIcon, FilterIcon, CheckIcon, CheckCheckIcon, MessageCircleIcon, PackageIcon } from 'lucide-react';
import { ChatPanel } from '../../../components/chat/ChatPanel';
import { supabase } from '../../../lib/supabase';
import { supabaseService } from '../../../services/supabaseService';
import { useAuth } from '../../../context/AuthContext';

type ShipmentChat = {
  shipment_id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  sender_role: string;
  status: string;
};

export const MessagesInbox = () => {
  const { user } = useAuth();
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [shipmentChats, setShipmentChats] = useState<ShipmentChat[]>([]);
  const [filteredChats, setFilteredChats] = useState<ShipmentChat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Function to load shipment chats
  const loadShipmentChats = async (skipLoadingState = false) => {
    console.log('=== Loading shipment chats ===');
    if (!skipLoadingState) {
      setIsLoading(true);
    }
      try {
        // Get all shipments from Supabase with customer info
        const { data: shipments, error: shipmentsError } = await supabase
          .from('shipments')
          .select(`
            *,
            users!customer_id (
              id,
              name,
              email,
              company
            )
          `)
          .order('created_at', { ascending: false });

        if (shipmentsError) {
          console.error('Error loading shipments:', shipmentsError);
          return;
        }

        // For each shipment, get the latest message
        const chatsPromises = (shipments || []).map(async (shipment) => {
          // Debug log to see shipment structure
          console.log('Shipment data:', {
            id: shipment.id,
            customer: shipment.customer,
            users: shipment.users,
            customer_name: shipment.customer_name,
            customer_id: shipment.customer_id
          });
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('shipment_id', shipment.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (messagesError) {
            console.error('Error loading messages for shipment:', shipment.id, messagesError);
            return null;
          }

          // Count unread messages from customers that staff hasn't read yet
          const { count: unreadCount, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('shipment_id', shipment.id)
            .eq('read_by_staff', false)
            .eq('sender_role', 'customer');
          
          if (countError) {
            console.error(`Error counting unread for ${shipment.id}:`, countError);
          }
          
          console.log(`Shipment ${shipment.id}: ${unreadCount || 0} unread messages`);

          const lastMessage = messages?.[0];
          
          // Extract customer name from various possible locations
          let customerName = 'Unknown Customer';
          
          // First try to get from joined users table data
          if (shipment.users) {
            const userData = shipment.users;
            customerName = userData.name || userData.company || customerName;
          }
          
          // If still unknown, try to get customer name from shipment.customer object
          if (customerName === 'Unknown Customer' && shipment.customer) {
            const customerData = typeof shipment.customer === 'string' 
              ? JSON.parse(shipment.customer) 
              : shipment.customer;
            customerName = customerData.name || customerData.company_name || customerData.companyName || customerName;
          }
          
          // If still unknown, try customer_name field directly
          if (customerName === 'Unknown Customer' && shipment.customer_name) {
            customerName = shipment.customer_name;
          }
          
          // If still unknown and there's a customer_id, use that as last resort
          if (customerName === 'Unknown Customer' && shipment.customer_id) {
            customerName = `Customer ${shipment.customer_id}`;
          }

          return {
            shipment_id: shipment.id,
            customer_name: customerName,
            last_message: lastMessage?.content || 'No messages yet',
            last_message_time: lastMessage?.created_at || shipment.created_at,
            unread_count: unreadCount || 0,
            sender_role: lastMessage?.sender_role || 'system',
            status: shipment.status || 'Unknown'
          };
        });

        const chats = (await Promise.all(chatsPromises)).filter(chat => chat !== null) as ShipmentChat[];
        
        // Sort by last message time
        chats.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
        
        setShipmentChats(chats);
        setFilteredChats(chats);

        // Select the first shipment by default if none selected
        if (chats.length > 0 && !selectedShipment) {
          setSelectedShipment(chats[0].shipment_id);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        if (!skipLoadingState) {
          setIsLoading(false);
        }
        setIsInitialLoad(false);
      }
    };

  // Load all shipment chats on mount
  useEffect(() => {
    loadShipmentChats();

    // Subscribe to realtime updates with debouncing
    let reloadTimeout: NodeJS.Timeout;
    const subscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          // Clear any pending reload
          if (reloadTimeout) clearTimeout(reloadTimeout);
          
          // If it's an UPDATE event (marking as read), delay reload slightly
          // to ensure database has propagated the change
          const delay = payload.eventType === 'UPDATE' ? 500 : 100;
          
          reloadTimeout = setTimeout(() => {
            loadShipmentChats(true); // Reload without showing loading state
          }, delay);
        }
      )
      .subscribe();

    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Filter chats based on search and unread filter
  useEffect(() => {
    let filtered = [...shipmentChats];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(chat => 
        chat.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.last_message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(chat => chat.unread_count > 0);
    }

    setFilteredChats(filtered);
  }, [searchTerm, showUnreadOnly, shipmentChats]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mark messages as read when selecting a shipment
  useEffect(() => {
    if (selectedShipment) {
      const markAsRead = async () => {
        console.log(`Checking for unread messages in shipment ${selectedShipment}`);
        
        // Get unread messages for this shipment from customers that staff hasn't read
        const { data: unreadMessages, error } = await supabase
          .from('messages')
          .select('id, read_by_staff, sender_role')
          .eq('shipment_id', selectedShipment)
          .eq('read_by_staff', false)
          .eq('sender_role', 'customer');

        if (error) {
          console.error('Error fetching unread messages:', error);
          return;
        }

        console.log(`Found ${unreadMessages?.length || 0} unread messages to mark as read`);

        if (unreadMessages && unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          console.log('Marking messages as read:', messageIds);
          
          try {
            await supabaseService.messages.markAsRead(messageIds, 'staff');
            console.log('Successfully marked messages as read');
            
            // Update local state immediately to reflect read status
            setShipmentChats(prev => prev.map(chat => 
              chat.shipment_id === selectedShipment 
                ? { ...chat, unread_count: 0 }
                : chat
            ));
            
            // Also update filtered chats
            setFilteredChats(prev => prev.map(chat => 
              chat.shipment_id === selectedShipment 
                ? { ...chat, unread_count: 0 }
                : chat
            ));
          } catch (err) {
            console.error('Error marking messages as read:', err);
          }
        }
      };
      markAsRead();
    }
  }, [selectedShipment]);

  if (isInitialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2A45]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-88px)] bg-white rounded-xl shadow-sm">
      {/* Left Sidebar - Shipments List */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-3">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shipments or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`flex items-center px-3 py-1.5 text-xs rounded-full transition-colors ${
                showUnreadOnly 
                  ? 'bg-[#E6EDF8] text-[#1E2A45]' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FilterIcon className="h-3 w-3 mr-1.5" />
              {showUnreadOnly ? 'Showing Unread' : 'All Messages'}
            </button>
            {filteredChats.filter(c => c.unread_count > 0).length > 0 && (
              <span className="text-xs text-gray-500">
                {filteredChats.filter(c => c.unread_count > 0).length} unread
              </span>
            )}
          </div>
        </div>

        {/* Shipments List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircleIcon className="h-12 w-12 mb-3" />
              <p className="text-sm">No messages found</p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.shipment_id}
                onClick={() => setSelectedShipment(chat.shipment_id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedShipment === chat.shipment_id ? 'bg-[#E6EDF8] border-l-4 border-l-[#1E2A45]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center">
                    <PackageIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="font-medium text-sm text-gray-900">{chat.shipment_id}</h3>
                    {chat.unread_count > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-[#1E2A45] text-white rounded-full">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(chat.last_message_time)}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-600">{chat.customer_name}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(chat.status)}`}>
                    {chat.status}
                  </span>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 truncate flex-1">
                    {chat.sender_role === 'staff' && (
                      <span className="text-gray-500">You: </span>
                    )}
                    {chat.last_message}
                  </p>
                  {chat.sender_role === 'staff' && (
                    <CheckCheckIcon className="h-3 w-3 text-[#1E2A45] ml-2" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      {selectedShipment ? (
        <div className="flex-1 flex flex-col" key={selectedShipment}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">
                  Shipment {selectedShipment}
                </h2>
                <p className="text-sm text-gray-500">
                  {shipmentChats.find(c => c.shipment_id === selectedShipment)?.customer_name}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                getStatusColor(shipmentChats.find(c => c.shipment_id === selectedShipment)?.status || '')
              }`}>
                {shipmentChats.find(c => c.shipment_id === selectedShipment)?.status}
              </span>
            </div>
          </div>

          {/* Chat Component */}
          <div className="flex-1 overflow-hidden animate-fadeIn">
            <ChatPanel
              key={`chat-${selectedShipment}`}
              shipmentId={selectedShipment}
              currentUser={{
                id: user?.id || 'staff-user',
                name: user?.name || 'Staff Member',
                role: 'staff'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircleIcon className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg font-medium">Select a shipment to view messages</p>
            <p className="text-sm mt-1">Choose from the list on the left to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
};