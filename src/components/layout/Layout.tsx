import { useState } from 'react';
import { Calendar, Users, LogOut, Scissors, Menu, X, User, ClipboardList, Phone, LayoutDashboard, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const getNavigationItems = () => {
    if (!profile) return [];

    switch (profile.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'manual-booking', label: 'New Booking', icon: Phone },
          { id: 'appointments', label: 'Appointments', icon: ClipboardList },
          { id: 'staff', label: 'Staff', icon: Users },
          { id: 'services', label: 'Services', icon: Wrench },
          { id: 'profile', label: 'Profile', icon: User },
        ];
      case 'stylist':
        return [
          { id: 'appointments', label: 'My Schedule', icon: ClipboardList },
          { id: 'profile', label: 'Profile', icon: User },
        ];
      case 'customer':
        return [
          { id: 'book', label: 'Book', icon: Calendar },
          { id: 'appointments', label: 'My Appointments', icon: ClipboardList },
          { id: 'profile', label: 'Profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const visibleItems = getNavigationItems();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const roleLabel = () => {
    switch (profile?.role) {
      case 'admin': return 'Admin';
      case 'stylist': return 'Barber';
      case 'customer': return 'Customer';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button
              onClick={() => {
                const home = profile?.role === 'admin' ? 'dashboard'
                  : profile?.role === 'stylist' ? 'appointments'
                  : 'book';
                onNavigate(home);
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="bg-slate-900 p-2 rounded-lg">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-base font-bold text-slate-900 leading-tight">Barbershop</p>
                {profile && (
                  <p className="text-xs text-slate-500 leading-tight">{roleLabel()} Portal</p>
                )}
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Divider */}
              <div className="w-px h-6 bg-slate-200 mx-1" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </nav>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}

              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
