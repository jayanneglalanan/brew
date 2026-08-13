import { useEffect, useState, type ReactNode } from 'react';

const TABLET_MAX_WIDTH = 1024;
const PHONE_MAX_WIDTH = 520;

function MobileShell() {
  const isPhone = window.innerWidth <= PHONE_MAX_WIDTH;

  return (
    <div className="h-[100dvh] w-full bg-stone-200">
      <div
        className={`mx-auto h-full bg-white ${
          isPhone ? 'max-w-none' : 'max-w-[460px] shadow-[0_0_40px_rgba(0,0,0,0.18)]'
        }`}
      >
        <iframe
          title="KapeFlow Mobile"
          src="/mobile/index.html"
          className="h-full w-full border-0"
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
