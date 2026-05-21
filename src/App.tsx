import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { BookingView } from './components/booking/BookingView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { ServicesView } from './components/services/ServicesView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StaffManagement } from './components/admin/StaffManagement';
import { ManualBooking } from './components/admin/ManualBooking';
import { BarberAppointmentsView } from './components/barber/BarberAppointmentsView';

function AppContent() {
  const { user, loading, profile } = useAuth();
  const [currentView, setCurrentView] = useState('book');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (profile) {
      switch (profile.role) {
        case 'admin':
          setCurrentView('dashboard');
          break;
        case 'stylist':
          setCurrentView('appointments');
          break;
        case 'customer':
          setCurrentView('book');
          break;
      }
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user && showAuth) {
    return <AuthForm onGuestBooking={() => setShowAuth(false)} />;
  }

  if (!user && !showAuth) {
    return <BookingView onShowAuth={() => setShowAuth(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'manual-booking':
        return <ManualBooking />;
      case 'staff':
        return <StaffManagement />;
      case 'book':
        return <BookingView onShowAuth={() => setShowAuth(true)} />;
      case 'appointments':
        // Use BarberAppointmentsView for stylists to allow marking as completed and paid
        return profile?.role === 'stylist' ? <BarberAppointmentsView /> : <AppointmentsView />;
      case 'services':
        return <ServicesView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <BookingView onShowAuth={() => setShowAuth(true)} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
