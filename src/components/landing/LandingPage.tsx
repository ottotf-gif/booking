import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Clock, ArrowRight, LogIn, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MustacheIcon } from '../common/MustacheIcon';
import type { Database } from '../../lib/database.types';

type Service = Database['public']['Tables']['services']['Row'];
type Stylist = Database['public']['Tables']['stylists']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'];
};

interface LandingPageProps {
  onBook: () => void;
  onLogin: () => void;
}

const SHOP = {
  name: 'Nordic Barber',
  tagline: 'EST. 2018',
  hero_title: 'Hantverk med känsla.',
  hero_subtitle: 'En klassisk barbershop i hjärtat av Göteborg. Skarpa klippningar, varma handdukar, hett stål och hett kaffe.',
  hero_image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=2000&q=80',
  about_image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
  about_title: 'Mer än bara en klippning',
  about_text:
    'Hos Nordic Barber tror vi på att varje besök ska vara en paus från vardagen. Våra barbers är hantverkare med passion för detaljer – från den första klippningen till det sista varma handduksdragget.\n\nVi använder bara förstklassiga produkter och tar oss tid att lyssna på vad just du vill ha.',
  address: 'Storgatan 24, 411 38 Göteborg',
  phone: '+46 31 123 45 67',
  email: 'hej@nordicbarber.se',
  instagram_url: 'https://instagram.com/nordicbarber',
  facebook_url: 'https://facebook.com/nordicbarber',
  hours: [
    { day: 'Måndag – Fredag', time: '09:00 – 18:00' },
    { day: 'Lördag', time: '10:00 – 16:00' },
    { day: 'Söndag', time: 'Stängt' },
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="bg-stone-900 p-2 rounded-md flex-shrink-0">
              <MustacheIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-bold text-stone-900 leading-none tracking-wide uppercase">{SHOP.name}</p>
              <p className="text-[10px] sm:text-xs text-stone-500 tracking-widest leading-tight mt-0.5">{SHOP.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-stone-700 hover:text-stone-900"
            >
              <LogIn className="w-4 h-4" /> Logga in
            </button>
            <button
              onClick={onBook}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors text-sm font-semibold"
            >
              Boka tid
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="relative h-[65vh] sm:h-[75vh] min-h-[480px] overflow-hidden">
          <img src={SHOP.hero_image} alt={SHOP.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
          <div className="absolute inset-0 flex items-end pb-12 sm:items-center sm:pb-0">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
              <div className="max-w-2xl text-white">
                <p className="text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6 opacity-90 font-medium">
                  Klassisk barbering · Göteborg
                </p>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-[1.05] tracking-tight">
                  {SHOP.hero_title}
                </h1>
                <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-xl leading-relaxed">
                  {SHOP.hero_subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onBook}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-stone-900 rounded-md hover:bg-stone-100 transition-colors font-semibold shadow-lg"
                  >
                    Boka tid nu
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <a
                    href="#tjanster"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-white/30 text-white rounded-md hover:bg-white/10 transition-colors font-semibold backdrop-blur-sm"
                  >
                    Se tjänster
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-3 font-medium">Om oss</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-6 leading-tight tracking-tight">
                {SHOP.about_title}
              </h2>
              <div className="space-y-4 text-stone-600 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {SHOP.about_text}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-xl">
                <img src={SHOP.about_image} alt="Inne i salongen" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {stylists.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32 bg-stone-50">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-3 font-medium">Teamet</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-3 tracking-tight">
                Möt våra barbers
              </h2>
              <p className="text-stone-600 max-w-xl mx-auto">Erfarna hantverkare med passion för varje detalj</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
              {stylists.map((s, idx) => (
                <div key={s.id} className="group">
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-stone-200 mb-4 shadow-md">
                    <img
                      src={s.profile.avatar_url || DEFAULT_BARBER_IMAGES[idx % DEFAULT_BARBER_IMAGES.length]}
                      alt={s.profile.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-1">{s.profile.full_name}</h3>
                  {s.specializations.length > 0 && (
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-2 font-medium">
                      {s.specializations.slice(0, 3).join(' · ')}
                    </p>
                  )}
                  {s.bio && (
                    <p className="text-sm text-stone-600 line-clamp-3 mb-3 leading-relaxed">{s.bio}</p>
                  )}
                  {(s as any).instagram_handle && (
                    <a
                      href={`https://instagram.com/${(s as any).instagram_handle}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-stone-700 hover:text-stone-900"
                    >
                      <Instagram className="w-4 h-4" />
                      @{(s as any).instagram_handle}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4">
        {GALLERY_IMAGES.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden">
            <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        ))}
      </section>

      {services.length > 0 && (
        <section id="tjanster" className="py-16 sm:py-24 lg:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-3 font-medium">Pris</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-3 tracking-tight">
                Tjänster
              </h2>
              <p className="text-stone-600 max-w-xl mx-auto">Alla våra behandlingar</p>
            </div>
            <div className="space-y-1">
              {services.map(s => (
                <div key={s.id} className="flex items-center justify-between py-4 sm:py-5 border-b border-stone-200 gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-stone-900 text-base sm:text-lg">{s.name}</h3>
                    {s.description && (
                      <p className="text-sm text-stone-500 line-clamp-1 mt-0.5">{s.description}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-stone-900 flex-shrink-0 whitespace-nowrap">
                    {s.base_price} kr
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button
                onClick={onBook}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-stone-900 text-white rounded-md hover:bg-stone-800 transition-colors font-semibold"
              >
                Se lediga tider
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 lg:py-32 bg-stone-100">
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-3 font-medium">Recensioner</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-3 tracking-tight">
                Vad våra kunder säger
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-white rounded-lg p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                    ))}
                  </div>
                  <p className="text-stone-700 leading-relaxed mb-4">"{t.comment}"</p>
                  <p className="text-sm font-semibold text-stone-900">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-24 lg:py-32 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-stone-400 mb-3 font-medium">Hitta hit</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Välkommen in</h2>
              <p className="text-stone-300 text-base sm:text-lg mb-8 leading-relaxed">
                Kom förbi för en kopp kaffe och se salongen. Vi ses!
              </p>

              <div className="space-y-5">
                <ContactItem icon={MapPin} label="Adress" value={SHOP.address} />
                <ContactItem icon={Phone} label="Telefon" value={SHOP.phone} href={`tel:${SHOP.phone.replace(/\s/g,'')}`} />
                <ContactItem icon={Mail} label="E-post" value={SHOP.email} href={`mailto:${SHOP.email}`} />
              </div>

              <div className="flex items-center gap-3 mt-8">
                {SHOP.instagram_url && (
                  <a
                    href={SHOP.instagram_url}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {SHOP.facebook_url && (
                  <a
                    href={SHOP.facebook_url}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm font-medium"
                  >
                    <Facebook className="w-4 h-4" /> Facebook
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-stone-400" />
                <h3 className="text-xl font-bold">Öppettider</h3>
              </div>
              <div className="divide-y divide-white/10">
                {SHOP.hours.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <span className="text-stone-300">{h.day}</span>
                    <span className="font-medium">{h.time}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onBook}
                className="w-full mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-stone-900 rounded-md hover:bg-stone-100 transition-colors font-semibold"
              >
                Boka tid
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-6 sm:py-8 bg-stone-900 border-t border-stone-800 text-stone-500 text-sm text-center">
        © {new Date().getFullYear()} {SHOP.name}. Alla rättigheter förbehållna.
      </footer>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 group">
      <div className="w-10 h-10 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-stone-400">{label}</p>
        <p className="text-base font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}