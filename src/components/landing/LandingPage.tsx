import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Facebook, Clock, ArrowRight, LogIn, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface LandingPageProps {
  onBook: () => void;
  onLogin: () => void;
}

// ============================================================================
// SHOP CONFIG — City Barbershop, Kungälv
// ============================================================================
const SHOP = {
  name: 'City Barbershop',
  city: 'Kungälv',
  logo_url: 'https://scontent-arn2-1.xx.fbcdn.net/v/t39.30808-1/294642344_386821990221398_8229610546796604894_n.png?stp=dst-png&cstp=mx500x500&ctp=s480x480&_nc_cat=101&ccb=1-7&_nc_sid=2d3e12&_nc_ohc=FM4UCDRkgS0Q7kNvwHV02qE&_nc_oc=AdpOGJuXI5Gq4vTAOj_EnhHWB3obsibWSNIYHsWPLTje_OQSgh4UHYjssDRgBrAaalgHf65PoRA9JjlW0LEX7vM5&_nc_zt=24&_nc_ht=scontent-arn2-1.xx&_nc_gid=ioVJxcVyb1UMyRWdRvtF4A&_nc_ss=7b2a8&oh=00_Af8-Gubcx10L7kGF2Ct-IamBdb8Cgjva7U_0Tp_6VbzTeQ&oe=6A3A2D7C',
  hero_image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=2000&q=85',
  about_image: 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=1200&q=85',
  about_title: 'Klippning, skägg och rakning – på vårt sätt.',
  about_text:
    'Vi är en barbershop på Västra Gatan i Kungälv. Drop-in eller boka tid – båda funkar.\n\nDu får en ordentlig klippning, lugn stämning och en kopp kaffe om du vill.',
  address: 'Västra Gatan 66, 442 31 Kungälv',
  phone: '+46 303 816 30',
  email: 'city.barbershop7@gmail.com',
  facebook_url: 'https://www.facebook.com/p/City-Barbershop-Fris%C3%B6r-Kung%C3%A4lv-100066808011345/',
  hours: [
    { day: 'Måndag',  time: '10:00 – 19:00' },
    { day: 'Tisdag',  time: '10:00 – 19:00' },
    { day: 'Onsdag',  time: '10:00 – 19:00' },
    { day: 'Torsdag', time: '10:00 – 19:00' },
    { day: 'Fredag',  time: '10:00 – 19:00' },
    { day: 'Lördag',  time: '10:00 – 16:00' },
    { day: 'Söndag',  time: '11:00 – 16:00' },
  ],
};

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
];

const DEFAULT_BARBER_IMAGES = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&q=80',
];

// ============================================================================

export function LandingPage({ onBook, onLogin }: LandingPageProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<{ comment: string; rating: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [stylistsRes, servicesRes, ratingsRes] = await Promise.all([
        supabase.from('stylists').select(`*, profile:profiles(*)`).eq('active', true),
        supabase.from('services').select('*').eq('active', true).order('base_price'),
        supabase.from('appointment_ratings')
          .select(`comment, salon_rating, customer:profiles(full_name)`)
          .not('comment', 'is', null)
          .gte('salon_rating', 4)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      setStylists((stylistsRes.data as any) || []);
      setServices(servicesRes.data || []);

      const ts = ((ratingsRes.data as any) || []).map((r: any) => ({
        comment: r.comment,
        rating: r.salon_rating,
        name: r.customer?.full_name || 'Anonym kund',
      }));
      setTestimonials(ts);
    } catch (e) {
      console.error('Landing load error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-barber-stone">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-barber-ink">
      {/* =================== HEADER =================== */}
      <header className="bg-white border-b border-barber-line sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={SHOP.logo_url}
              alt={SHOP.name}
              className="h-12 sm:h-14 w-auto flex-shrink-0"
            />
            <div className="hidden sm:block min-w-0 border-l border-barber-line pl-3">
              <p className="font-display text-base font-bold tracking-wide-2 uppercase leading-none text-barber-black">
                {SHOP.name}
              </p>
              <p className="text-[10px] text-barber-stone tracking-wide-4 uppercase leading-tight mt-0.5">
                {SHOP.city}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-barber-ink hover:text-barber-black transition-colors"
            >
              <LogIn className="w-4 h-4" /> Logga in
            </button>
            <button
              onClick={onBook}
              className="font-display tracking-wide-2 uppercase flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-barber-red text-white rounded-sm hover:bg-barber-red-hov transition-colors text-sm font-semibold"
            >
              Boka tid
            </button>
          </div>
        </div>
      </header>

      {/* =================== HERO =================== */}
      <section className="relative">
        <div className="relative h-[70vh] sm:h-[80vh] min-h-[520px] overflow-hidden">
          <img src={SHOP.hero_image} alt={SHOP.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />

          <div className="absolute inset-0 flex items-end pb-12 sm:items-center sm:pb-0">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
              <div className="max-w-3xl text-white">
                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                  <div className="w-12 h-0.5 bg-barber-red" />
                  <p className="text-xs sm:text-sm tracking-wide-4 uppercase font-medium text-barber-red">
                    Kungälv
                  </p>
                </div>

                <h1 className="font-display tracking-wide-2 uppercase text-5xl sm:text-7xl lg:text-8xl font-bold mb-5 sm:mb-6 leading-[0.95]">
                  City<br className="sm:hidden" />
                  <span className="sm:inline"> </span>
                  Barbershop
                </h1>

                <p className="text-base sm:text-lg mb-7 sm:mb-9 max-w-xl leading-relaxed text-white/85">
                  Klippning, skäggtrim och rakning på Västra Gatan. Boka tid eller titta förbi.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onBook}
                    className="font-display tracking-wide-2 uppercase inline-flex items-center justify-center gap-2 px-7 py-4 bg-barber-red text-white rounded-sm hover:bg-barber-red-hov transition-colors font-semibold text-base shadow-lg shadow-black/30"
                  >
                    Boka tid nu
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <a
                    href="#tjanster"
                    className="font-display tracking-wide-2 uppercase inline-flex items-center justify-center gap-2 px-7 py-4 border border-white/30 text-white rounded-sm hover:bg-white/10 transition-colors font-semibold text-base backdrop-blur-sm"
                  >
                    Se tjänster
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== QUICK INFO BAR =================== */}
      <section className="bg-barber-black text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <InfoBar icon={MapPin} label="Adress" value={SHOP.address} />
            <InfoBar icon={Phone} label="Telefon" value={SHOP.phone} href={`tel:${SHOP.phone.replace(/\s/g,'')}`} />
            <InfoBar icon={Clock} label="Idag" value="10:00 – 19:00" />
          </div>
        </div>
      </section>

      {/* =================== ABOUT =================== */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-barber-red" />
                <p className="text-xs tracking-wide-4 uppercase text-barber-red font-semibold">Om oss</p>
              </div>
              <h2 className="font-display tracking-wide-2 uppercase text-3xl sm:text-4xl lg:text-5xl font-bold text-barber-black mb-6 leading-[1.05]">
                {SHOP.about_title}
              </h2>
              <div className="space-y-4 text-barber-stone text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {SHOP.about_text}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-[4/5] overflow-hidden shadow-2xl">
                <img src={SHOP.about_image} alt="Inne i salongen" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== BARBERS =================== */}
      {stylists.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32 bg-barber-black text-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-barber-red" />
                <p className="text-xs tracking-wide-4 uppercase text-barber-red font-semibold">Teamet</p>
                <div className="w-10 h-0.5 bg-barber-red" />
              </div>
              <h2 className="font-display tracking-wide-2 uppercase text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
                Våra barbers
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {stylists.map((s, idx) => (
                <div key={s.id} className="group">
                  <div className="aspect-[4/5] overflow-hidden bg-barber-ink mb-4">
                    <img
                      src={s.profile.avatar_url || DEFAULT_BARBER_IMAGES[idx % DEFAULT_BARBER_IMAGES.length]}
                      alt={s.profile.full_name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <h3 className="font-display tracking-wide-2 uppercase text-xl font-bold mb-1">
                    {s.profile.full_name}
                  </h3>
                  {s.specializations.length > 0 && (
                    <p className="text-xs text-barber-red uppercase tracking-wider mb-2 font-semibold">
                      {s.specializations.slice(0, 3).join(' · ')}
                    </p>
                  )}
                  {s.bio && (
                    <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">{s.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================== GALLERY STRIP =================== */}
      <section className="grid grid-cols-2 md:grid-cols-4">
        {GALLERY_IMAGES.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden bg-barber-black">
            <img src={img} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 hover:scale-105 transition-all duration-500" />
          </div>
        ))}
      </section>

      {/* =================== SERVICES =================== */}
      {services.length > 0 && (
        <section id="tjanster" className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-barber-red" />
                <p className="text-xs tracking-wide-4 uppercase text-barber-red font-semibold">Priser</p>
                <div className="w-10 h-0.5 bg-barber-red" />
              </div>
              <h2 className="font-display tracking-wide-2 uppercase text-3xl sm:text-4xl lg:text-5xl font-bold text-barber-black mb-3">
                Tjänster
              </h2>
            </div>
            <div className="border-t border-barber-line">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between py-5 border-b border-barber-line gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display tracking-wide-2 uppercase font-semibold text-barber-black text-base sm:text-lg">
                      {s.name}
                    </h3>
                    {s.description && (
                      <p className="text-sm text-barber-stone line-clamp-1 mt-0.5">{s.description}</p>
                    )}
                    <p className="text-xs text-barber-stone mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-bold text-barber-black flex-shrink-0 whitespace-nowrap">
                    {s.base_price} kr
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button
                onClick={onBook}
                className="font-display tracking-wide-2 uppercase inline-flex items-center gap-2 px-7 py-4 bg-barber-red text-white rounded-sm hover:bg-barber-red-hov transition-colors font-semibold"
              >
                Boka tid
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =================== TESTIMONIALS =================== */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32 bg-white border-t border-barber-line">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-barber-red" />
                <p className="text-xs tracking-wide-4 uppercase text-barber-red font-semibold">Kunder</p>
                <div className="w-10 h-0.5 bg-barber-red" />
              </div>
              <h2 className="font-display tracking-wide-2 uppercase text-3xl sm:text-4xl lg:text-5xl font-bold text-barber-black mb-3">
                Vad sägs om oss
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white border border-barber-line p-5 sm:p-6">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= t.rating ? 'fill-barber-red text-barber-red' : 'text-barber-line'}`} />
                    ))}
                  </div>
                  <p className="text-barber-ink leading-relaxed mb-4">"{t.comment}"</p>
                  <p className="text-sm font-semibold text-barber-black">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================== CONTACT =================== */}
      <section className="py-16 sm:py-24 lg:py-32 bg-barber-black text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-0.5 bg-barber-red" />
                <p className="text-xs tracking-wide-4 uppercase text-barber-red font-semibold">Hitta hit</p>
              </div>
              <h2 className="font-display tracking-wide-2 uppercase text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Välkommen in
              </h2>

              <div className="space-y-5">
                <ContactItem icon={MapPin} label="Adress" value={SHOP.address} />
                <ContactItem icon={Phone} label="Telefon" value={SHOP.phone} href={`tel:${SHOP.phone.replace(/\s/g,'')}`} />
                <ContactItem icon={Mail} label="E-post" value={SHOP.email} href={`mailto:${SHOP.email}`} />
              </div>

              <div className="flex items-center gap-3 mt-8">
                <a
                  href={SHOP.facebook_url}
                  target="_blank" rel="noopener noreferrer"
                  className="font-display tracking-wide-2 uppercase flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-barber-red rounded-sm transition-colors text-sm font-semibold"
                >
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <Clock className="w-5 h-5 text-barber-red" />
                <h3 className="font-display tracking-wide-2 uppercase text-xl font-bold">Öppettider</h3>
              </div>
              <div className="divide-y divide-white/10">
                {SHOP.hours.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <span className="text-white/70 font-medium">{h.day}</span>
                    <span className="font-display tracking-wide-2 font-semibold">{h.time}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onBook}
                className="font-display tracking-wide-2 uppercase w-full mt-6 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-barber-red text-white rounded-sm hover:bg-barber-red-hov transition-colors font-semibold"
              >
                Boka tid
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="py-6 sm:py-8 bg-barber-black border-t border-white/10 text-white/40 text-sm text-center space-y-1">
        <p>© {new Date().getFullYear()} {SHOP.name} · {SHOP.city}</p>
        <p>
          Drivs av{' '}
          <a
            href="https://www.ottoniq.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
          >
            Ottoniq
          </a>
          .se
        </p>
      </footer>
    </div>
  );
}

function InfoBar({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-barber-red/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-barber-red" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide-4 text-white/50 font-semibold">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}

function ContactItem({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 group">
      <div className="w-10 h-10 bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-barber-red transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide-3 text-white/50 font-semibold">{label}</p>
        <p className="text-base font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}