import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadShopName, saveShopName, loadBusinessHours, saveBusinessHours, DEFAULT_SHOP_NAME, DEFAULT_BUSINESS_HOURS } from './storage';

interface ShopNameCtx {
  shopName: string;
  setShopName: (name: string) => Promise<void>;
  businessHours: string;
  setBusinessHours: (hours: string) => Promise<void>;
}

const Ctx = createContext<ShopNameCtx>({
  shopName: DEFAULT_SHOP_NAME,
  setShopName: async () => {},
  businessHours: DEFAULT_BUSINESS_HOURS,
  setBusinessHours: async () => {},
});

export function ShopNameProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopNameState] = useState(DEFAULT_SHOP_NAME);
  const [businessHours, setBusinessHoursState] = useState(DEFAULT_BUSINESS_HOURS);

  useEffect(() => {
    let on = true;
    Promise.all([loadShopName(), loadBusinessHours()]).then(([name, hours]) => {
      if (on) {
        setShopNameState(name);
        setBusinessHoursState(hours);
      }
    });
    return () => {
      on = false;
    };
  }, []);

  const setShopName = useCallback(async (name: string) => {
    await saveShopName(name);
    setShopNameState(name.trim() || DEFAULT_SHOP_NAME);
  }, []);

  const setBusinessHours = useCallback(async (hours: string) => {
    await saveBusinessHours(hours);
    setBusinessHoursState(hours.trim() || DEFAULT_BUSINESS_HOURS);
  }, []);

  return <Ctx.Provider value={{ shopName, setShopName, businessHours, setBusinessHours }}>{children}</Ctx.Provider>;
}

export function useShopName(): ShopNameCtx {
  return useContext(Ctx);
}