import { useState } from 'react';
import { Calendar, Users, LogOut, Menu, X, User, ClipboardList, Phone, LayoutDashboard, Wrench } from 'lucide-react';
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
          { id: 'dashboard', label: 'Översikt', icon: LayoutDashboard },
          { id: 'manual-booking', label: 'Ny bokning', icon: Phone },
          { id: 'appointments', label: 'Bokningar', icon: ClipboardList },
          { id: 'staff', label: 'Personal', icon: Users },
          { id: 'services', label: 'Tjänster', icon: Wrench },
          { id: 'profile', label: 'Profil', icon: User },
        ];
      case 'stylist':
        return [
          { id: 'appointments', label: 'Mitt schema', icon: ClipboardList },
          { id: 'profile', label: 'Profil', icon: User },
        ];
      case 'customer':
        return [
          { id: 'book', label: 'Boka', icon: Calendar },
          { id: 'appointments', label: 'Mina bokningar', icon: ClipboardList },
          { id: 'profile', label: 'Profil', icon: User },
        ];
      default:
        return [];
    }
  };

  const visibleItems = getNavigationItems();

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  const roleLabel = () => {
    switch (profile?.role) {
      case 'admin': return 'Admin';
      case 'stylist': return 'Barber';
      case 'customer': return 'Kund';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-barber-line sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => {
                const home = profile?.role === 'admin' ? 'dashboard'
                  : profile?.role === 'stylist' ? 'appointments'
                  : 'book';
                onNavigate(home);
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0"
            >
              <div className="bg-barber-red w-1 h-9 rounded-sm flex-shrink-0" />
              <div className="hidden sm:block min-w-0">
                <p className="font-display tracking-wide-2 uppercase text-sm font-bold text-barber-black leading-none truncate">
                  City Barbershop
                </p>
                {profile && (
                  <p className="text-[10px] text-barber-stone tracking-wide-3 uppercase leading-tight mt-0.5">
                    {roleLabel()}
                  </p>
                )}
              </div>
              <div className="sm:hidden">
                <p className="font-display tracking-wide-2 uppercase text-sm font-bold text-barber-black leading-none">
                  CITY
                </p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-barber-black text-white shadow-sm'
                        : 'text-barber-stone hover:text-barber-black hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="w-px h-6 bg-barber-line mx-1" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-barber-stone hover:text-barber-black hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logga ut</span>
              </button>
            </nav>

            <nav className="hidden md:flex lg:hidden items-center gap-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    className={`p-2 rounded-md transition-colors ${
                      isActive ? 'bg-barber-black text-white' : 'text-barber-stone hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
              <button onClick={handleSignOut} title="Logga ut" className="p-2 rounded-md text-barber-stone hover:bg-slate-100">
                <LogOut className="w-5 h-5" />
              </button>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-barber-stone hover:bg-slate-100"
              aria-label="Meny"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-barber-line bg-white">
            <div className="px-3 py-2 space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium ${
                      isActive ? 'bg-barber-black text-white' : 'text-barber-ink hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-2 mt-2 border-t border-barber-line">
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-barber-stone hover:bg-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Logga ut
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {children}
      </main>
    </div>
  );
}