import React, { useState, useEffect } from 'react';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import type { Announcement } from '../../services/DataService';

export const StaffAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    isActive: true
  });
  const { addToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await DataService.getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      addToast('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingId) {
        await DataService.updateAnnouncement(editingId, {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          is_active: formData.isActive
        });
        addToast('Announcement updated successfully', 'success');
      } else {
        await DataService.createAnnouncement({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          created_by: user?.id || '2',  // Default to staff user ID 2
          is_active: formData.isActive
        });
        addToast('Announcement created successfully', 'success');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        type: 'info',
        isActive: true
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      addToast('Failed to save announcement', 'error');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await DataService.deleteAnnouncement(id);
      addToast('Announcement deleted successfully', 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      addToast('Failed to delete announcement', 'error');
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      await DataService.updateAnnouncement(announcement.id, {
        is_active: !announcement.isActive
      });
      addToast(`Announcement ${!announcement.isActive ? 'activated' : 'deactivated'}`, 'success');
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to toggle announcement status:', error);
      addToast('Failed to update announcement status', 'error');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      type: 'info',
      isActive: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const truncateContent = (content: string, maxLength: number = 400) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
          <p className="text-gray-600 mt-1">
            Create and manage system announcements
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Announcements</h1>
            <p className="text-gray-600 mt-1">
              Create and manage system announcements
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-[#2E3B55] text-white text-sm font-medium rounded-md hover:bg-[#1e2940] transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create new announcement
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content"
                />
              </div>

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Announcement['type'] })}
                  >
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={cancelForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingId ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </form>
          </div>
        )}

      {announcements.length === 0 && !showForm ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-500 mb-6">Create your first announcement to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-[#2E3B55] text-white text-sm font-medium rounded-md hover:bg-[#1e2940] transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create new announcement
            </button>
          </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className={`bg-white rounded-lg shadow-sm p-6 ${!announcement.isActive ? 'opacity-60' : ''}`}
            >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {announcement.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(announcement)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title={announcement.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {announcement.isActive ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeOffIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit"
                    >
                      <EditIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
                  {truncateContent(announcement.content)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDate(announcement.createdAt)}</span>
                    {announcement.creator && (
                      <span className="text-gray-600">
                        by {announcement.creator.name}
                      </span>
                    )}
                    {!announcement.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        Inactive
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      announcement.type === 'warning' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : announcement.type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => window.open(`/announcements/${announcement.id}`, '_blank')}
                    className="inline-flex items-center px-4 py-2 bg-[#2E3B55] text-white text-sm font-medium rounded-md hover:bg-[#1e2940] transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};