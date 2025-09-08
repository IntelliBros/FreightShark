import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataService } from '../services/DataService';
import type { Announcement } from '../services/DataService';

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await DataService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with the latest news and updates
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
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with the latest news and updates
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
          <p className="text-gray-500">There are no announcements at this time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {announcement.title}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
                {truncateContent(announcement.content)}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {formatDate(announcement.createdAt)}
                </span>
                <Link 
                  to={`/announcements/${announcement.id}`}
                  className="inline-flex items-center px-4 py-2 bg-[#2E3B55] text-white text-sm font-medium rounded-md hover:bg-[#1e2940] transition-colors"
                >
                  Read more
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};