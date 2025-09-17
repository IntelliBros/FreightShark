import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { StaffLayout } from './components/layout/StaffLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { NewQuote } from './pages/quotes/NewQuote';
import { AllQuotes } from './pages/quotes/AllQuotes';
import { QuoteDetails } from './pages/quotes/QuoteDetails';
import { ShipmentTracking } from './pages/shipments/ShipmentTracking';
import { ShipmentsList } from './pages/shipments/ShipmentsList';
import { SampleConsolidation } from './pages/samples/SampleConsolidation';
import { DocumentsHub } from './pages/documents/DocumentsHub';
import { Analytics } from './pages/analytics/Analytics';
import { Announcements } from './pages/Announcements';
import { AnnouncementDetail } from './pages/AnnouncementDetail';
import { Settings } from './pages/settings/Settings';
import { Notifications } from './pages/Notifications';
import { UnifiedLogin } from './pages/auth/UnifiedLogin';
import { SignUp } from './pages/auth/SignUp';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { CreateInvoice } from './pages/staff/invoices/CreateInvoice';
import { PendingInvoices } from './pages/staff/invoices/PendingInvoices';
import { PaidInvoices } from './pages/staff/invoices/PaidInvoices';
import { MessagesInbox } from './pages/staff/messages/MessagesInbox';
import { QuoteRequests } from './pages/staff/quotes/QuoteRequests';
import { PendingQuotes } from './pages/staff/quotes/PendingQuotes';
import { ApprovedQuotes } from './pages/staff/quotes/ApprovedQuotes';
import { ProvideQuote } from './pages/staff/quotes/ProvideQuote';
import { CreateQuote } from './pages/staff/quotes/CreateQuote';
import { ActiveShipments } from './pages/staff/shipments/ActiveShipments';
import { UpdateShipment } from './pages/staff/shipments/UpdateShipment';
import { ShipmentDetails } from './pages/staff/shipments/ShipmentDetails';
import { CompletedShipments } from './pages/staff/shipments/CompletedShipments';
import { StaffAnnouncements } from './pages/staff/Announcements';
import { Reports } from './pages/staff/Reports';
import { Settings as StaffSettings } from './pages/staff/Settings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SystemSettings } from './pages/admin/SystemSettings';
import { EmailSettings } from './pages/admin/EmailSettings';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { LandingPage } from './pages/LandingPage';
export function App() {
  return <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <NotificationsProvider>
            <ToastProvider>
              <Routes>
              {/* Landing Page */}
              <Route path="/welcome" element={<LandingPage />} />
              {/* Auth routes */}
              <Route path="/login" element={<UnifiedLogin />} />
              <Route path="/signup" element={<SignUp />} />
              {/* Customer dashboard */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="quotes/new" element={<NewQuote />} />
                <Route path="quotes" element={<AllQuotes />} />
                <Route path="quotes/:id" element={<QuoteDetails />} />
                <Route path="shipments" element={<ShipmentsList />} />
                <Route path="shipments/:id" element={<ShipmentTracking />} />
                <Route path="samples" element={<SampleConsolidation />} />
                <Route path="documents" element={<DocumentsHub />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="announcements/:id" element={<AnnouncementDetail />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* Staff dashboard */}
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<StaffDashboard />} />
                <Route path="invoices/create" element={<CreateInvoice />} />
                <Route path="invoices/pending" element={<PendingInvoices />} />
                <Route path="invoices/paid" element={<PaidInvoices />} />
                <Route path="quotes/requests" element={<QuoteRequests />} />
                <Route path="quotes/provide/:requestId" element={<ProvideQuote />} />
                <Route path="quotes/pending" element={<PendingQuotes />} />
                <Route path="quotes/approved" element={<ApprovedQuotes />} />
                <Route path="quotes/create" element={<CreateQuote />} />
                <Route path="quotes/:id" element={<QuoteDetails />} />
                <Route path="shipments/active" element={<ActiveShipments />} />
                <Route path="shipments/update" element={<UpdateShipment />} />
                <Route path="shipments/:id" element={<ShipmentDetails />} />
                <Route path="shipments/completed" element={<CompletedShipments />} />
                <Route path="customers/list" element={<StaffDashboard />} />
                <Route path="customers/add" element={<StaffDashboard />} />
                <Route path="reports" element={<Reports />} />
                <Route path="announcements" element={<StaffAnnouncements />} />
                <Route path="announcements/:id" element={<AnnouncementDetail />} />
                <Route path="settings" element={<StaffSettings />} />
                <Route path="messages" element={<MessagesInbox />} />
                <Route path="messages/inbox" element={<MessagesInbox />} />
                <Route path="messages/sent" element={<MessagesInbox />} />
              </Route>
              {/* Admin dashboard */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users/customers" element={<UserManagement />} />
                <Route path="users/staff" element={<UserManagement />} />
                <Route path="users/admins" element={<UserManagement />} />
                <Route path="analytics" element={<AdminDashboard />} />
                <Route path="audit-logs" element={<AdminDashboard />} />
                <Route path="system/general" element={<SystemSettings />} />
                <Route path="system/integrations" element={<SystemSettings />} />
                <Route path="system/notifications" element={<SystemSettings />} />
                <Route path="system/email" element={<EmailSettings />} />
                <Route path="security/roles" element={<AdminDashboard />} />
                <Route path="security/api-keys" element={<AdminDashboard />} />
              </Route>
            </Routes>
            </ToastProvider>
          </NotificationsProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>;
}