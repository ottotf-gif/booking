import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

const DEFAULTS: LandingContent = {
  shop_name: 'The Barbershop',
  tagline: 'Klassiska klippningar. Modern stil.',
  hero_subtitle: 'Boka tid hos våra erfarna barbers – snabbt och enkelt.',
  hero_image_url: '',
  about_title: 'Om oss',
  about_text: 'Vi är ett team passionerade barbers...',
  instagram_url: '',
  facebook_url: '',
  address: '',
  phone: '',
  email: '',
  opening_hours: '',
};

export function LandingEditor() {
  const [content, setContent] = useState<LandingContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('business_settings')
        .select('value')
        .eq('key', 'landing_page')
        .maybeSingle();
      if (data?.value) setContent({ ...DEFAULTS, ...(data.value as any) });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true); setError(''); setSavedMessage('');
    try {
      // Upsert by key
      const { data: existing } = await supabase
        .from('business_settings')
        .select('id')
        .eq('key', 'landing_page')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('business_settings')
          .update({ value: content as any, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_settings')
          .insert({ key: 'landing_page', value: content as any });
        if (error) throw error;
      }
      setSavedMessage('Sparat!');
      setTimeout(() => setSavedMessage(''), 2500);
    } catch (e: any) {
      setError(e.message || 'Kunde inte spara');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof LandingContent) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContent({ ...content, [key]: e.target.value });
  };

  if (loading) return <div className="text-slate-600">Laddar...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Startsida</h1>
          <p className="text-slate-600 text-sm mt-1">Texterna som visas på startsidan innan login.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sparar...' : 'Spara'}
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
      {savedMessage && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">{savedMessage}</div>}

      <div className="space-y-6">
        <Section title="Hero">
          <Field label="Namn på salongen">
            <input className={inputCls} value={content.shop_name} onChange={update('shop_name')} />
          </Field>
          <Field label="Tagline (kort fras ovanför namnet)">
            <input className={inputCls} value={content.tagline} onChange={update('tagline')} />
          </Field>
          <Field label="Underrubrik">
            <input className={inputCls} value={content.hero_subtitle} onChange={update('hero_subtitle')} />
          </Field>
          <Field label="Hero-bild (URL)" hint="Lämna tom för en svart gradient.">
            <input className={inputCls} value={content.hero_image_url} onChange={update('hero_image_url')} placeholder="https://..." />
          </Field>
        </Section>

        <Section title="Om oss">
          <Field label="Rubrik">
            <input className={inputCls} value={content.about_title} onChange={update('about_title')} />
          </Field>
          <Field label="Text">
            <textarea className={inputCls} rows={4} value={content.about_text} onChange={update('about_text')} />
          </Field>
        </Section>

        <Section title="Kontakt">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Adress">
              <input className={inputCls} value={content.address} onChange={update('address')} />
            </Field>
            <Field label="Telefon">
              <input className={inputCls} value={content.phone} onChange={update('phone')} />
            </Field>
            <Field label="E-post">
              <input className={inputCls} value={content.email} onChange={update('email')} />
            </Field>
            <Field label="Öppettider">
              <input className={inputCls} value={content.opening_hours} onChange={update('opening_hours')} />
            </Field>
          </div>
        </Section>

        <Section title="Sociala medier">
          <Field label="Instagram URL">
            <input className={inputCls} value={content.instagram_url} onChange={update('instagram_url')} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="Facebook URL">
            <input className={inputCls} value={content.facebook_url} onChange={update('facebook_url')} placeholder="https://facebook.com/..." />
          </Field>
        </Section>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}