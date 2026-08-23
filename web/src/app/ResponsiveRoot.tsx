import { useEffect, useState, type ReactNode } from 'react';

const TABLET_MAX_WIDTH = 1024;
const PHONE_MAX_WIDTH = 520;

function MobileShell() {
  const isPhone = window.innerWidth <= PHONE_MAX_WIDTH;

  return (
    <div style={{ height: '100vh', height: '100dvh', width: '100%', background: '#d6d2ce' }}>
      <div
        style={{
          height: '100%',
          width: '100%',
          maxWidth: isPhone ? 'none' : '460px',
          margin: '0 auto',
          background: '#fff',
          boxShadow: isPhone ? 'none' : '0 0 40px rgba(0,0,0,0.18)',
        }}
      >
        <iframe
          title="KapeFlow Mobile"
          src="/mobile/index.html?v=5"
          style={{ height: '100%', width: '100%', border: '0' }}
        />
      </div>
    </div>
  );
}

function useIsMobile() {
  const query = `(max-width: ${TABLET_MAX_WIDTH}px)`;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}

export default function ResponsiveRoot({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileShell /> : <>{children}</>;
}
