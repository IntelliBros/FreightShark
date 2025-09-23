import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UsersIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, EditIcon, Trash2Icon, KeyIcon, UserCheckIcon, UserXIcon, XIcon, MailIcon } from 'lucide-react';
import { DataService, User } from '../../services/DataService';
import { useToast } from '../../context/ToastContext';
export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'staff' | 'user'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'staff' as 'staff' | 'admin',
    staffPosition: ''
  });
  const [isInviting, setIsInviting] = useState(false);
  const { addToast } = useToast();
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await DataService.getUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()) || (user.company || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && user.role === filter;
  });
  const toggleActions = (userId: string) => {
    if (showActions === userId) {
      setShowActions(null);
    } else {
      setShowActions(userId);
    }
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'purple';
      case 'staff':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    
    try {
      // Generate a temporary password for invited users
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const userData = {
        name: inviteForm.name,
        email: inviteForm.email,
        password: tempPassword,
        company: 'FreightShark', // Admin/Staff work for FreightShark
        role: inviteForm.role,
        staff_position: inviteForm.role === 'staff' ? inviteForm.staffPosition : undefined
      };
      
      // Use DataService.createUser which now handles password hashing
      const createdUser = await DataService.createUser(userData);
      setUsers(prevUsers => [...prevUsers, createdUser]);
      
      addToast(`User ${inviteForm.name} has been invited successfully. Temporary password: ${tempPassword}`, 'success');
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'staff', staffPosition: '' });
    } catch (error: any) {
      addToast(error.message || 'Failed to invite user', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteFormChange = (field: string, value: string) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#1E293B] rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">User Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            View and manage all users in the system
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <MailIcon className="h-4 w-4 mr-1" />
          Invite User
        </Button>
      </div>
      <Card>
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="relative mb-4 md:mb-0 md:w-80">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full" />
          </div>
          <div className="flex space-x-2">
            <Button variant={filter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('all')}>
              All
            </Button>
            <Button variant={filter === 'admin' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('admin')}>
              Admins
            </Button>
            <Button variant={filter === 'staff' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('staff')}>
              Staff
            </Button>
            <Button variant={filter === 'user' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('user')}>
              Customers
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.company || 'No Company'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    {user.staff_position && <div className="text-xs text-gray-500 mt-1">
                        {user.staff_position}
                      </div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.amazon_seller_id && <div>Seller ID: {user.amazon_seller_id}</div>}
                    {user.ein_tax_id && <div>Tax ID: {user.ein_tax_id}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button onClick={() => toggleActions(user.id)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                      <MoreHorizontalIcon className="h-5 w-5" />
                    </button>
                    {showActions === user.id && <div className="absolute right-6 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                        <div className="py-1">
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <EditIcon className="h-4 w-4 mr-2 text-gray-500" />
                            Edit User
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <KeyIcon className="h-4 w-4 mr-2 text-gray-500" />
                            Reset Password
                          </button>
                          {user.role !== 'admin' && <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              <UserCheckIcon className="h-4 w-4 mr-2 text-gray-500" />
                              Change Role
                            </button>}
                          <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                            <Trash2Icon className="h-4 w-4 mr-2 text-red-600" />
                            Delete User
                          </button>
                        </div>
                      </div>}
                  </td>
                </tr>)}
              {filteredUsers.length === 0 && <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invite User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="invite-name"
                  value={inviteForm.name}
                  onChange={(e) => handleInviteFormChange('name', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="invite-email"
                  value={inviteForm.email}
                  onChange={(e) => handleInviteFormChange('email', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteForm.role}
                  onChange={(e) => handleInviteFormChange('role', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteForm.role === 'staff' && (
                <div>
                  <label htmlFor="invite-position" className="block text-sm font-medium text-gray-700">
                    Staff Position
                  </label>
                  <input
                    type="text"
                    id="invite-position"
                    value={inviteForm.staffPosition}
                    onChange={(e) => handleInviteFormChange('staffPosition', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Shipping Agent, Operations Manager"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isInviting}
                >
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};