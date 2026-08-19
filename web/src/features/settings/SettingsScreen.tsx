import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/app/AuthContext';
import { useShopName } from '@/app/ShopNameContext';
import { DEMO_ACCOUNTS, loadEmail, saveEmail, savePassword } from '@/app/auth';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/Page';

function readFileAsDataUrl(file: File, onDone: (dataUrl: string) => void): void {
  const img = new Image();
  const reader = new FileReader();
  reader.onload = () => {
    img.onload = () => {
      const max = 512;
      let { width, height } = img;
      if (width > max || height > max) {
        const scale = max / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onDone(reader.result as string);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      onDone(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

export default function SettingsScreen() {
  const { user, updateProfile } = useAuth();
  const { shopName, setShopName, businessHours, setBusinessHours, logoImage, setLogoImage } = useShopName();
  const { toast } = useToast();

  const demoEmail = useMemo(() => DEMO_ACCOUNTS.find((a) => a.user.id === user?.id)?.email ?? '', [user]);

  const isManager = user?.role === 'manager';

  const [nameDraft, setNameDraft] = useState(user?.name ?? '');
  const [emailDraft, setEmailDraft] = useState(demoEmail);
  const [passwordDraft, setPasswordDraft] = useState('');
  const [shopNameDraft, setShopNameDraft] = useState(shopName);
  const [businessHoursDraft, setBusinessHoursDraft] = useState(businessHours);
  const [avatarDraft, setAvatarDraft] = useState(user?.avatar ?? '');
  const [logoImageDraft, setLogoImageDraft] = useState(logoImage);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const avatarInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameDraft(user?.name ?? '');
    setAvatarDraft(user?.avatar ?? '');
  }, [user]);

  useEffect(() => {
    setShopNameDraft(shopName);
    setLogoImageDraft(logoImage);
  }, [shopName, logoImage]);

  useEffect(() => {
    setBusinessHoursDraft(businessHours);
  }, [businessHours]);

  useEffect(() => {
    if (!user) return;
    const saved = loadEmail(user.id);
    if (saved) setEmailDraft(saved);
  }, [user]);

  const confirmSave = () => {
    const nextName = nameDraft.trim();
    const nextShopName = shopNameDraft.trim();
    const nextBusinessHours = businessHoursDraft.trim();

    updateProfile({ name: nextName, avatar: avatarDraft, avatarColor: '#8B6F5A' });
    if (emailDraft.trim() && emailDraft.trim().toLowerCase() !== demoEmail.toLowerCase() && user) {
      saveEmail(user.id, emailDraft.trim());
    }
    if (passwordDraft.trim() && user) {
      savePassword(user.id, passwordDraft);
    }
    setShopName(nextShopName);
    setBusinessHours(nextBusinessHours);
    setLogoImage(logoImageDraft);

    setConfirmOpen(false);
    setPasswordDraft('');
    toast('Profile saved');
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile, shop details and account" />
      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        {user ? (
          <Card title="Profile">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: '#8B6F5A' }}
                  >
                    {avatarDraft ? (
                      <img src={avatarDraft} alt="avatar" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      (nameDraft || user.name).charAt(0)
                    )}
                  </span>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) readFileAsDataUrl(file, setAvatarDraft);
                      e.target.value = '';
                    }}
                  />
                  <button type="button" className="btn border border-stone-200 bg-white text-sm text-stone-700 hover:bg-stone-50 active:bg-stone-200" onClick={() => avatarInput.current?.click()}>
                    Upload avatar
                  </button>
                </div>
                {!isManager ? (
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-lg font-bold text-white"
                      style={{ backgroundColor: '#8B6F5A' }}
                    >
                      {logoImageDraft ? <img src={logoImageDraft} alt="logo" className="h-11 w-11 rounded-xl object-cover" /> : '☕'}
                    </span>
                    <input
                      ref={logoInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) readFileAsDataUrl(file, setLogoImageDraft);
                        e.target.value = '';
                      }}
                    />
                    <button type="button" className="btn border border-stone-200 bg-white text-sm text-stone-700 hover:bg-stone-50 active:bg-stone-200" onClick={() => logoInput.current?.click()}>
                      Upload logo
                    </button>
                  </div>
                ) : null}
              </div>
              <Field label="Username" value={emailDraft} onChange={setEmailDraft} placeholder="Enter login email" type="email" />
              <Field label="Password" value={passwordDraft} onChange={setPasswordDraft} placeholder="Leave blank to keep current" type="password" />
              <Field label="Name" value={nameDraft} onChange={setNameDraft} placeholder="Enter your name" />
              {!isManager ? (
                <>
                  <Field label="Shop Name" value={shopNameDraft} onChange={setShopNameDraft} placeholder="Enter shop name" />
                  <Field label="Business Hours" value={businessHoursDraft} onChange={setBusinessHoursDraft} placeholder="e.g. 7:00 AM – 9:00 PM" />
                </>
              ) : null}
              <button className="btn btn-primary w-full" onClick={() => setConfirmOpen(true)}>
                Save Profile
              </button>
            </div>
          </Card>
        ) : null}
        {!isManager ? (
          <div className="space-y-4">
            <Card title="Alert Thresholds">
              <div className="space-y-3">
                <InfoRow label="Critical stock threshold" value="At or below critical level" />
                <InfoRow label="Large discount alert" value="Discounts over 15%" />
                <InfoRow label="Unusual sales drop" value="Below 50% of 7-day average" />
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      {confirmOpen &&
        createPortal(
          <div className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40" onClick={() => setConfirmOpen(false)}>
            <div className="animate-panel-in w-full max-w-[280px] rounded-xl border border-stone-200 bg-white p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <p className="mb-3 text-sm font-semibold text-stone-800">Save Profile</p>
              <div className="flex gap-2">
                <button className="btn flex-1 bg-stone-100 text-stone-700 hover:bg-stone-200" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary flex-1" onClick={confirmSave}>
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 pb-2 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-800">{value}</span>
    </div>
  );
}
