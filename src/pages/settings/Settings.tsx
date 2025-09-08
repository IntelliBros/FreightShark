import React from 'react';
import { useAuth } from '../../context/AuthContext';
export const Settings = () => {
  const {
    user
  } = useAuth();
  return <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Account Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input type="text" defaultValue={user?.name} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input type="email" defaultValue={user?.email} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input type="text" defaultValue={user?.company} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input type="text" defaultValue={user?.role} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Amazon Integration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amazon Seller ID
            </label>
            <input type="text" defaultValue={user?.amazonSellerId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EIN/Tax ID
            </label>
            <input type="text" defaultValue={user?.einTaxId} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="emailNotifications" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
              Email notifications
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="smsNotifications" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-700">
              SMS notifications
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="weeklyReports" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="weeklyReports" className="ml-2 block text-sm text-gray-700">
              Weekly summary reports
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Save Changes
        </button>
      </div>
    </div>;
};