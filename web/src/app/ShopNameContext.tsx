import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { loadShopName, saveShopName, loadBusinessHours, saveBusinessHours, DEFAULT_SHOP_NAME, DEFAULT_BUSINESS_HOURS } from './storage';

interface ShopNameCtx {
  shopName: string;
  setShopName: (name: string) => void;
  businessHours: string;
  setBusinessHours: (hours: string) => void;
}

const Ctx = createContext<ShopNameCtx>({
  shopName: DEFAULT_SHOP_NAME,
  setShopName: () => {},
  businessHours: DEFAULT_BUSINESS_HOURS,
  setBusinessHours: () => {},
});

export function ShopNameProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopNameState] = useState<string>(() => loadShopName());
  const [businessHours, setBusinessHoursState] = useState<string>(() => loadBusinessHours());

  const setShopName = useCallback((name: string) => {
    saveShopName(name);
    setShopNameState(name.trim() || DEFAULT_SHOP_NAME);
  }, []);

  const setBusinessHours = useCallback((hours: string) => {
    saveBusinessHours(hours);
    setBusinessHoursState(hours.trim() || DEFAULT_BUSINESS_HOURS);
  }, []);

  return <Ctx.Provider value={{ shopName, setShopName, businessHours, setBusinessHours }}>{children}</Ctx.Provider>;
}

export const useShopName = () => useContext(Ctx);