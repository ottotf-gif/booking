import { useEffect, useState } from 'react';
import { Scissors, MapPin, Phone, Mail, Instagram, Facebook, Clock, ArrowRight, LogIn, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface LandingContent {
  shop_name: string;
  tagline: string;
  hero_subtitle: string;
  hero_image_url: string;
  about_title: string;
  about_text: string;
  instagram_url: string;
  facebook_url: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: string;
}

const DEFAULT_CONTENT: LandingContent = {
  shop_name: 'The Barbershop',
  tagline: 'Klassiska klippningar. Modern stil.',
  hero_subtitle: 'Boka tid hos våra erfarna barbers – snabbt och enkelt.',
  hero_image_url: '',
  about_title: 'Om oss',
  about_text: 'Vi är ett team passionerade barbers som värdesätter hantverk, detaljer och att varje kund lämnar stolen nöjd. Välkommen in!',
  instagram_url: 'https://instagram.com/',
  facebook_url: '',
  address: 'Storgatan 1, Göteborg',
  phone: '+46 70 000 00 00',
  email: 'info@barbershop.se',
  opening_hours: 'Mån–Fre 09:00–18:00 · Lör 09:00–16:00 · Sön stängt',
};

interface LandingPageProps {
  onBook: () => void;
  onLogin: () => void;
}

export function LandingPage({ onBook, onLogin }: LandingPageProps) {
  const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [contentRes, stylistsRes, servicesRes] = await Promise.all([
        supabase.from('business_settings').select('value').eq('key', 'landing_page').maybeSingle(),
        supabase.from('stylists').select(`*, profile:profiles(*)`).eq('active', true),
        supabase.from('services').select('*').eq('active', true).order('name'),
      ]);

      if (contentRes.data?.value) {
        setContent({ ...DEFAULT_CONTENT, ...(contentRes.data.value as any) });
      }
      setStylists((stylistsRes.data as any) || []);
      setServices(servicesRes.data || []);
    } catch (e) {
      console.error('Landing load error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-slate-900 p-2 rounded-lg flex-shrink-0">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{content.shop_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Logga in
            </button>
            <button
              onClick={onBook}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Boka tid
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {content.hero_image_url ? (
          <div className="relative h-[60vh] sm:h-[70vh] min-h-[400px] overflow-hidden">
            <img
              src={content.hero_image_url}
              alt={content.shop_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-white">
                  <p className="text-sm sm:text-base uppercase tracking-widest mb-3 opacity-90">{content.tagline}</p>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                    {content.shop_name}
                  </h1>
                  <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-xl">
                    {content.hero_subtitle}
                  </p>
                  <button
                    onClick={onBook}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-semibold shadow-lg"
                  >
                    Boka tid nu
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
              <div className="max-w-2xl">
                <p className="text-sm sm:text-base uppercase tracking-widest mb-3 text-slate-300">{content.tagline}</p>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                  {content.shop_name}
                </h1>
                <p className="text-base sm:text-xl mb-6 sm:mb-8 text-slate-300 max-w-xl">
                  {content.hero_subtitle}
                </p>
                <button
                  onClick={onBook}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors font-semibold shadow-lg"
                >
                  Boka tid nu
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* About */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{content.about_title}</h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line">
            {content.about_text}
          </p>
        </div>
      </section>

      {/* Barbers */}
      {stylists.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Våra barbers</h2>
              <p className="text-slate-600">Träffa teamet som tar hand om dig</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {stylists.map(s => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-slate-100 relative">
                    {s.profile.avatar_url ? (
                      <img
                        src={s.profile.avatar_url}
                        alt={s.profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <User className="w-20 h-20 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{s.profile.full_name}</h3>
                    {s.specializations.length > 0 && (
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                        {s.specializations.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    {s.bio && (
                      <p className="text-sm text-slate-600 line-clamp-3 mb-3">{s.bio}</p>
                    )}
                    {(s as any).instagram_handle && (
                      <a
                        href={`https://instagram.com/${(s as any).instagram_handle}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900"
                      >
                        <Instagram className="w-4 h-4" />
                        @{(s as any).instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">Tjänster</h2>
              <p className="text-slate-600">Pris- och tidsöversikt</p>
            </div>
            <div className="bg-slate-50 rounded-xl divide-y divide-slate-200">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 sm:p-5 gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">{s.name}</h3>
                    {s.description && (
                      <p className="text-sm text-slate-600 line-clamp-1">{s.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 flex-shrink-0">
                    {s.base_price} kr
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={onBook}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
              >
                Se lediga tider
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">Hitta hit</h2>
            <p className="text-slate-300">Vi finns här för dig</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <ContactCard icon={MapPin} label="Adress" value={content.address} />
            <ContactCard icon={Phone} label="Telefon" value={content.phone} href={`tel:${content.phone}`} />
            <ContactCard icon={Mail} label="E-post" value={content.email} href={`mailto:${content.email}`} />
            <ContactCard icon={Clock} label="Öppettider" value={content.opening_hours} />
          </div>

          {(content.instagram_url || content.facebook_url) && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {content.instagram_url && (
                <a
                  href={content.instagram_url}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Instagram className="w-5 h-5" /> Instagram
                </a>
              )}
              {content.facebook_url && (
                <a
                  href={content.facebook_url}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Facebook className="w-5 h-5" /> Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-slate-900 border-t border-slate-800 text-slate-500 text-sm text-center">
        © {new Date().getFullYear()} {content.shop_name}
      </footer>
    </div>
  );
}

function ContactCard({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/10 transition-colors h-full">
      <Icon className="w-6 h-6 mb-3 text-white/80" />
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-sm sm:text-base font-medium leading-tight whitespace-pre-line">{value}</p>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}