import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { DataService } from '../services/DataService';
import type { Announcement } from '../services/DataService';

export const AnnouncementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const data = await DataService.getAnnouncements();
      const found = data.find(a => a.id === id);
      setAnnouncement(found || null);
    } catch (error) {
      console.error('Failed to fetch announcement:', error);
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

  const getAuthorInfo = (createdBy: string) => {
    // This would normally fetch user info, but for now we'll return a default
    return {
      name: 'Angel Zhuang',
      role: 'Contributing Writer',
      company: 'FBA BOSS',
      avatar: '/avatar-placeholder.png'
    };
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Announcement not found</h3>
            <p className="text-gray-500 mb-4">This announcement may have been removed</p>
            <Link 
              to="/announcements"
              className="inline-flex items-center px-4 py-2 bg-[#2E3B55] text-white text-sm font-medium rounded-md hover:bg-[#1e2940] transition-colors"
            >
              Back to announcements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const author = getAuthorInfo(announcement.createdBy);
  const readTime = Math.ceil(announcement.content.split(' ').length / 200);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/announcements')}
          className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-white bg-[#2E3B55] rounded-md hover:bg-[#1e2940] transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to announcements
        </button>

        {/* Article content */}
        <article className="bg-white rounded-lg shadow-sm">
          <div className="px-8 pt-8 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {announcement.title}
            </h1>
            
            <div className="flex items-center text-sm text-gray-500 mb-8">
              <span>{formatDate(announcement.createdAt)}</span>
              <span className="mx-2">•</span>
              <span>{readTime} min read</span>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700 mb-8">
              {announcement.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Author info */}
          <div className="border-t border-gray-200 px-8 py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-gray-600">
                    {author.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{author.name}</h3>
                <p className="text-sm text-gray-600">
                  {author.role}
                  <span className="ml-1">at {author.company}</span>
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};