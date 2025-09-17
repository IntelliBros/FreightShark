import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import { emailService, SMTPConfig, EmailTemplate } from '../../services/EmailService';
import { Mail, Server, Shield, Send, CheckCircle, Edit2, Save, X } from 'lucide-react';

export const EmailSettings = () => {
  const toastContext = useToast();
  const showToast = toastContext?.showToast || ((message: string, type: string) => {
    console.log(`Toast: ${type} - ${message}`);
  });
  usePageTitle('Email Settings');

  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: ''
    },
    from: {
      name: 'Freight Shark',
      email: ''
    }
  });

  const [testEmail, setTestEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, EmailTemplate>>({});

  useEffect(() => {
    const savedConfig = emailService.getSmtpConfig();
    if (savedConfig) {
      setSmtpConfig(savedConfig);
    }
    setTemplates(emailService.getEmailTemplates());
  }, []);

  const handleSaveConfig = async () => {
    if (!smtpConfig.host || !smtpConfig.port || !smtpConfig.auth.user || !smtpConfig.from.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSaving(true);
    try {
      emailService.saveSmtpConfig(smtpConfig);
      showToast('SMTP configuration saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await emailService.testSmtpConnection(smtpConfig);
      showToast(result.message, result.success ? 'success' : 'error');
    } catch (error) {
      showToast('Connection test failed', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showToast('Please enter a test email address', 'error');
      return;
    }

    setIsTesting(true);
    try {
      if (selectedTemplate === 'generic') {
        // Send generic test email
        const result = await emailService.sendTestEmail(testEmail);
        showToast(result.message, result.success ? 'success' : 'error');
      } else {
        // Send template-specific test email
        const mockVariables = getTemplateTestVariables(selectedTemplate);
        const result = await emailService.sendNotification(testEmail, selectedTemplate, mockVariables);
        showToast(result.message, result.success ? 'success' : 'error');
      }
      
      if (testEmail) {
        setTestEmail('');
      }
    } catch (error) {
      showToast('Failed to send test email', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const getTemplateTestVariables = (templateId: string): Record<string, string> => {
    const mockVariables: Record<string, Record<string, string>> = {
      'welcome': {
        customerName: 'John Doe'
      },
      'quote-requested': {
        customerName: 'John Doe',
        quoteId: 'Q-00123'
      },
      'quote-ready': {
        customerName: 'John Doe',
        quoteId: 'Q-00123',
        amount: '$2,450.00'
      },
      'shipment-update': {
        customerName: 'John Doe',
        shipmentId: 'FS-00456',
        status: 'In Transit',
        trackingInfo: 'Package is on its way to the destination facility'
      },
      'invoice-generated': {
        customerName: 'John Doe',
        shipmentId: 'FS-00456',
        amount: '$2,450.00',
        dueDate: '30 days'
      }
    };
    
    return mockVariables[templateId] || {};
  };

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditedTemplates({ ...editedTemplates, [templateId]: { ...template } });
      setEditingTemplate(templateId);
    }
  };

  const handleSaveTemplate = (templateId: string) => {
    const updatedTemplate = editedTemplates[templateId];
    if (updatedTemplate) {
      const updatedTemplates = templates.map(t => 
        t.id === templateId ? updatedTemplate : t
      );
      setTemplates(updatedTemplates);
      emailService.saveEmailTemplates(updatedTemplates);
      setEditingTemplate(null);
      showToast('Template saved successfully', 'success');
    }
  };

  const handleCancelEdit = (templateId: string) => {
    const newEditedTemplates = { ...editedTemplates };
    delete newEditedTemplates[templateId];
    setEditedTemplates(newEditedTemplates);
    setEditingTemplate(null);
  };

  const updateTemplateField = (templateId: string, field: keyof EmailTemplate, value: string) => {
    setEditedTemplates({
      ...editedTemplates,
      [templateId]: {
        ...editedTemplates[templateId],
        [field]: value
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-600 mt-1">Configure SMTP settings for email notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="SMTP Configuration" subtitle="Configure your email server settings" color="blue">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP Host *
              </label>
              <input
                type="text"
                value={smtpConfig.host}
                onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port *
                </label>
                <input
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secure Connection
                </label>
                <select
                  value={smtpConfig.secure ? 'true' : 'false'}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                >
                  <option value="false">TLS (Port 587)</option>
                  <option value="true">SSL (Port 465)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={smtpConfig.auth.user}
                onChange={(e) => setSmtpConfig({ 
                  ...smtpConfig, 
                  auth: { ...smtpConfig.auth, user: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpConfig.auth.pass}
                  onChange={(e) => setSmtpConfig({ 
                    ...smtpConfig, 
                    auth: { ...smtpConfig.auth, pass: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8] pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg> :
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name *
                </label>
                <input
                  type="text"
                  value={smtpConfig.from.name}
                  onChange={(e) => setSmtpConfig({ 
                    ...smtpConfig, 
                    from: { ...smtpConfig.from, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  placeholder="Freight Shark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email *
                </label>
                <input
                  type="email"
                  value={smtpConfig.from.email}
                  onChange={(e) => setSmtpConfig({ 
                    ...smtpConfig, 
                    from: { ...smtpConfig.from, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  placeholder="noreply@freightshark.com"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent mr-2" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Save className="w-4 h-4 mr-2" />
                    Save Configuration
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-[#00b4d8] rounded-full animate-spin border-t-transparent mr-2" />
                    Testing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Server className="w-4 h-4 mr-2" />
                    Test Connection
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Test Email" subtitle="Send a test email to verify configuration" color="green">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Before sending test emails:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Save your SMTP configuration first</li>
                    <li>Ensure your SMTP server allows connections</li>
                    <li>For Gmail, use an App Password instead of your regular password</li>
                    <li>Check that your firewall allows outgoing SMTP connections</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8] mb-3"
              >
                <option value="generic">Generic Test Email</option>
                <option value="welcome">Welcome Email</option>
                <option value="quote-requested">Quote Request Received</option>
                <option value="quote-ready">Quote Ready for Review</option>
                <option value="shipment-update">Shipment Status Update</option>
                <option value="invoice-generated">Invoice Generated</option>
              </select>
              {selectedTemplate !== 'generic' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-green-800">
                    <strong>Testing {selectedTemplate === 'welcome' ? 'Welcome Email' : 
                      selectedTemplate === 'quote-requested' ? 'Quote Request Received' :
                      selectedTemplate === 'quote-ready' ? 'Quote Ready for Review' :
                      selectedTemplate === 'shipment-update' ? 'Shipment Status Update' :
                      selectedTemplate === 'invoice-generated' ? 'Invoice Generated' : selectedTemplate} template</strong>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Mock data will be used: {Object.keys(getTemplateTestVariables(selectedTemplate)).map(key => key).join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                placeholder="test@example.com"
              />
            </div>

            <Button
              onClick={handleSendTestEmail}
              disabled={isTesting || !testEmail}
              className="w-full"
            >
              {isTesting ? (
                <span className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent mr-2" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Send className="w-4 h-4 mr-2" />
                  {selectedTemplate === 'generic' ? 'Send Test Email' : `Send ${selectedTemplate.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Email`}
                </span>
              )}
            </Button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">SMTP Providers</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Gmail</span>
                  <span className="text-gray-500">smtp.gmail.com:587</span>
                </div>
                <div className="flex justify-between">
                  <span>Outlook</span>
                  <span className="text-gray-500">smtp-mail.outlook.com:587</span>
                </div>
                <div className="flex justify-between">
                  <span>SendGrid</span>
                  <span className="text-gray-500">smtp.sendgrid.net:587</span>
                </div>
                <div className="flex justify-between">
                  <span>Amazon SES</span>
                  <span className="text-gray-500">email-smtp.*.amazonaws.com:587</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Email Notification Types" subtitle="Overview of all automated email notifications" color="indigo">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'welcome',
              name: 'Welcome Email',
              description: 'Sent when a new customer account is created',
              trigger: 'Account Registration',
              variables: ['customerName'],
              status: '✅ Implemented'
            },
            {
              id: 'quote-requested',
              name: 'Quote Request Received',
              description: 'Confirms quote request submission to customer',
              trigger: 'Quote Request Submitted',
              variables: ['customerName', 'quoteId'],
              status: '✅ Implemented'
            },
            {
              id: 'quote-ready',
              name: 'Quote Ready for Review',
              description: 'Notifies customer when quote is ready',
              trigger: 'Quote Status: Ready',
              variables: ['customerName', 'quoteId', 'amount'],
              status: '🚧 Template Only'
            },
            {
              id: 'shipment-update',
              name: 'Shipment Status Update',
              description: 'Updates on shipment tracking status',
              trigger: 'Shipment Status Change',
              variables: ['customerName', 'shipmentId', 'status', 'trackingInfo'],
              status: '🚧 Template Only'
            },
            {
              id: 'shipment-delivered',
              name: 'Shipment Delivered',
              description: 'Confirmation when shipment is delivered',
              trigger: 'Shipment Status: Delivered',
              variables: ['customerName', 'shipmentId', 'deliveryDate'],
              status: '❌ Not Implemented'
            },
            {
              id: 'invoice-generated',
              name: 'Invoice Generated',
              description: 'Notifies customer of new invoice',
              trigger: 'Invoice Creation',
              variables: ['customerName', 'shipmentId', 'amount', 'dueDate'],
              status: '🚧 Template Only'
            },
            {
              id: 'warehouse-id-required',
              name: 'Warehouse ID Required',
              description: 'Requests missing warehouse ID from customer',
              trigger: 'Manual Admin Action',
              variables: ['customerName', 'shipmentId'],
              status: '❌ Not Implemented'
            },
            {
              id: 'chat-message',
              name: 'New Chat Message',
              description: 'Notifies about new staff/admin messages',
              trigger: 'Staff Message Sent',
              variables: ['customerName', 'senderName', 'messagePreview'],
              status: '❌ Not Implemented'
            }
          ].map((notification) => (
            <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 text-sm">{notification.name}</h4>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{notification.status}</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">{notification.description}</p>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500">Trigger: </span>
                  <span className="text-xs text-gray-700">{notification.trigger}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Variables: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {notification.variables.map((variable) => (
                      <span key={variable} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Email Templates" subtitle="Customize notification email templates" color="purple">
        <div className="space-y-4">
          {templates.map((template) => {
            const isEditing = editingTemplate === template.id;
            const currentTemplate = isEditing ? editedTemplates[template.id] : template;
            
            return (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{currentTemplate.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Variables: {currentTemplate.variables.map(v => `{${v}}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveTemplate(template.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelEdit(template.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditTemplate(template.id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Subject</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentTemplate.subject}
                        onChange={(e) => updateTemplateField(template.id, 'subject', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#00b4d8]"
                      />
                    ) : (
                      <p className="text-sm text-gray-800">{currentTemplate.subject}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-gray-600">Body</label>
                    {isEditing ? (
                      <textarea
                        value={currentTemplate.body}
                        onChange={(e) => updateTemplateField(template.id, 'body', e.target.value)}
                        rows={4}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#00b4d8]"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{currentTemplate.body}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};