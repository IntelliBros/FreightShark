import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SaveIcon, GlobeIcon, MailIcon, BellIcon, ServerIcon, CloudIcon, Package } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
export const SystemSettings = () => {
  const [settings, setSettings] = useState({
    companyName: 'DDP Freight',
    companyEmail: 'info@ddpfreight.com',
    supportEmail: 'support@ddpfreight.com',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    quotesExpirationDays: 7,
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false,
    sampleDeliveryAddress: ''
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value,
      type
    } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value
    });
  };
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const systemSettings = await settingsService.getSettings();
    if (systemSettings) {
      setSettings(prev => ({
        ...prev,
        sampleDeliveryAddress: systemSettings.sample_delivery_address || ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save sample delivery address to database
    const success = await settingsService.updateSampleDeliveryAddress(settings.sampleDeliveryAddress);

    if (success) {
      alert('Settings saved successfully!');
    } else {
      alert('Failed to save settings. Please try again.');
    }
  };
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1E293B]">System Settings</h1>
        <p className="text-gray-600 text-sm mt-1">
          Configure global system settings and preferences
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card title="General Settings" color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input type="text" id="companyName" name="companyName" value={settings.companyName} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Email
                </label>
                <input type="email" id="companyEmail" name="companyEmail" value={settings.companyEmail} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Support Email
                </label>
                <input type="email" id="supportEmail" name="supportEmail" value={settings.supportEmail} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Timezone
                </label>
                <select id="timezone" name="timezone" value={settings.timezone} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="Asia/Shanghai">
                    China Standard Time (CST)
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                <select id="dateFormat" name="dateFormat" value={settings.dateFormat} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label htmlFor="quotesExpirationDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Expiration (Days)
                </label>
                <input type="number" id="quotesExpirationDays" name="quotesExpirationDays" value={settings.quotesExpirationDays} onChange={handleInputChange} min="1" max="30" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
          </Card>
          <Card title="Sample Settings" color="green">
            <div className="space-y-4">
              <div>
                <label htmlFor="sampleDeliveryAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Delivery Address
                </label>
                <input
                  type="text"
                  id="sampleDeliveryAddress"
                  name="sampleDeliveryAddress"
                  value={settings.sampleDeliveryAddress}
                  onChange={handleInputChange}
                  placeholder="Enter the complete address where customers should send samples"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This address will be displayed to customers when they need to send product samples for inspection.
                </p>
              </div>
            </div>
          </Card>
          <Card title="Notification Settings" color="orange">
            <div className="space-y-4">
              <div className="flex items-center">
                <input type="checkbox" id="enableEmailNotifications" name="enableEmailNotifications" checked={settings.enableEmailNotifications} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-900">
                  Enable Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="enableSmsNotifications" name="enableSmsNotifications" checked={settings.enableSmsNotifications} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="enableSmsNotifications" className="ml-2 block text-sm text-gray-900">
                  Enable SMS Notifications
                </label>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Configure which events trigger notifications to users and
                  staff
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <input type="checkbox" id="notifyQuoteCreated" checked={true} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="notifyQuoteCreated" className="ml-2 block text-sm text-gray-900">
                      Quote Created
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="notifyQuoteAccepted" checked={true} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="notifyQuoteAccepted" className="ml-2 block text-sm text-gray-900">
                      Quote Accepted
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="notifyShipmentUpdate" checked={true} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="notifyShipmentUpdate" className="ml-2 block text-sm text-gray-900">
                      Shipment Status Updates
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="notifyInvoiceCreated" checked={true} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <label htmlFor="notifyInvoiceCreated" className="ml-2 block text-sm text-gray-900">
                      Invoice Created
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card title="System Maintenance" color="purple">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Automatic Backups
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Enable automatic database backups
                  </p>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="autoBackup" name="autoBackup" checked={settings.autoBackup} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="autoBackup" className="ml-2 block text-sm text-gray-900">
                    Enabled
                  </label>
                </div>
              </div>
              {settings.autoBackup && <div>
                  <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Backup Frequency
                  </label>
                  <select id="backupFrequency" name="backupFrequency" value={settings.backupFrequency} onChange={handleInputChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Maintenance Mode
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, only administrators can access the system
                  </p>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="maintenanceMode" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                    Enabled
                  </label>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button variant="secondary" size="sm">
                  <CloudIcon className="h-4 w-4 mr-1" />
                  Backup Now
                </Button>
                <Button variant="secondary" size="sm">
                  <ServerIcon className="h-4 w-4 mr-1" />
                  System Diagnostics
                </Button>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" type="submit">
            <SaveIcon className="h-4 w-4 mr-1" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};