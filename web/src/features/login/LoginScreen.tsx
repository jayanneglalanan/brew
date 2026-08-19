import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/app/AuthContext';
import { useShopName } from '@/app/ShopNameContext';
import { DEMO_ACCOUNTS, resolveUser } from '@/app/auth';
import { homePathForRole } from 'mock-data';

export default function LoginScreen() {
  const { login } = useAuth();
  const { shopName, logoImage } = useShopName();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const timer = useRef<number | undefined>(undefined);

  const finishLogin = (u: { id: string; name: string; role: string }) => {
    setError('');
    setLoading(true);
    timer.current = window.setTimeout(() => {
      setLoading(false);
      login({ id: u.id, name: u.name, role: u.role as 'owner' | 'manager' | 'cashier' });
      navigate(homePathForRole(u.role as 'owner' | 'manager' | 'cashier'), { replace: true });
    }, 1500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    const user = resolveUser(email, password);
    if (!user) {
      setError('Invalid email or password. Use one of the demo accounts below.');
      return;
    }
    finishLogin(user);
  };

  const useDemo = (account: { email: string; password: string; user: { id: string; name: string; role: string } }) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="login-layout">
      <aside className="login-brand">
        <div className="login-brand-inner">
          <div className="login-brand-tile">
            {logoImage ? <img src={logoImage} alt="logo" className="h-12 w-12 rounded-2xl object-cover" /> : '☕'}
          </div>
          <h1 className="login-brand-name">{shopName}</h1>
          <p className="login-brand-tagline">Good Coffee, Good Day</p>
        </div>
      </aside>

      <main className="login-form-col">
        <div className="login-mobile-brand">
          <span className="login-mobile-tile">{logoImage ? <img src={logoImage} alt="logo" className="h-5 w-5 rounded object-cover" /> : '☕'}</span>
          <span>{shopName}</span>
        </div>

        <div className="login-panel w-full max-w-[500px] px-7 pb-8 pt-7 sm:px-9">
          <h1 className="text-center text-[32px] font-bold leading-tight" style={{ color: 'var(--login-text)' }}>
            Welcome back
          </h1>
          <p className="mt-1.5 text-center text-[14px]" style={{ color: 'var(--login-text-sub)' }}>
            Sign in to continue to your dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className={`float-field ${error ? 'float-field-error' : ''}`}>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                autoComplete="username"
                className="float-input"
              />
              <span className="float-lead"><Mail size={18} /></span>
              <label className="float-label">Email / Username</label>
            </div>

            <div className={`float-field ${error ? 'float-field-error' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                className="float-input float-input-toggle"
              />
              <span className="float-lead"><Lock size={18} /></span>
              <label className="float-label">Password</label>
              <button
                type="button"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-1 z-10 flex w-11 items-center justify-center"
                style={{ color: 'var(--login-text-sub)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: 'var(--login-text)' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#6F4E37]"
                />
                Remember Me
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-[13px] font-semibold transition-opacity hover:opacity-75"
                style={{ color: 'var(--login-primary)' }}
              >
                Forgot Password?
              </a>
            </div>

            {error ? (
              <p className="text-[13px] font-medium" style={{ color: 'var(--login-error)' }}>{error}</p>
            ) : null}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Brewing...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--login-text-sub)' }}>
              Demo accounts
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.user.id}
                  type="button"
                  onClick={() => useDemo(a)}
                  className="rounded-xl border p-3 text-left transition-all hover:border-[var(--login-accent)] hover:shadow-sm"
                  style={{ borderColor: 'var(--login-border)', background: 'var(--login-surface)' }}
                >
                  <p className="text-[13px] font-bold" style={{ color: 'var(--login-primary)' }}>
                    {a.user.name}
                  </p>
                  <p className="text-[11px] font-semibold capitalize tracking-wide" style={{ color: 'var(--login-secondary)' }}>
                    {a.user.role}
                  </p>
                  <p className="mt-1.5 truncate text-[11px]" style={{ color: 'var(--login-text-sub)' }}>
                    {a.email}
                  </p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[13px]" style={{ color: 'var(--login-text)' }}>
              Password: <b>{DEMO_ACCOUNTS[0].password}</b> for both accounts
            </p>
            <button
              type="button"
              onClick={() => useDemo(DEMO_ACCOUNTS[0])}
              className="mt-1.5 text-[13px] font-semibold transition-opacity hover:opacity-75"
              style={{ color: 'var(--login-primary)' }}
            >
              Use demo account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}