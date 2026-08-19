import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
  loadShopName, saveShopName, loadBusinessHours, saveBusinessHours,
  loadLogoImage, saveLogoImage, loadLogoText, saveLogoText, loadLogoColor, saveLogoColor,
  DEFAULT_SHOP_NAME, DEFAULT_BUSINESS_HOURS, DEFAULT_LOGO_TEXT, DEFAULT_LOGO_COLOR,
} from './storage';

interface ShopNameCtx {
  shopName: string;
  setShopName: (name: string) => void;
  businessHours: string;
  setBusinessHours: (hours: string) => void;
  logoImage: string;
  setLogoImage: (image: string) => void;
  logoText: string;
  setLogoText: (text: string) => void;
  logoColor: string;
  setLogoColor: (color: string) => void;
}

const Ctx = createContext<ShopNameCtx>({
  shopName: DEFAULT_SHOP_NAME,
  setShopName: () => {},
  businessHours: DEFAULT_BUSINESS_HOURS,
  setBusinessHours: () => {},
  logoImage: '',
  setLogoImage: () => {},
  logoText: DEFAULT_LOGO_TEXT,
  setLogoText: () => {},
  logoColor: DEFAULT_LOGO_COLOR,
  setLogoColor: () => {},
});

export function ShopNameProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopNameState] = useState<string>(() => loadShopName());
  const [businessHours, setBusinessHoursState] = useState<string>(() => loadBusinessHours());
  const [logoImage, setLogoImageState] = useState<string>(() => loadLogoImage() ?? '');
  const [logoText, setLogoTextState] = useState<string>(() => loadLogoText());
  const [logoColor, setLogoColorState] = useState<string>(() => loadLogoColor());

  const setShopName = useCallback((name: string) => {
    saveShopName(name);
    setShopNameState(name.trim() || DEFAULT_SHOP_NAME);
  }, []);

  const setBusinessHours = useCallback((hours: string) => {
    saveBusinessHours(hours);
    setBusinessHoursState(hours.trim() || DEFAULT_BUSINESS_HOURS);
  }, []);

  const setLogoImage = useCallback((image: string) => {
    saveLogoImage(image);
    setLogoImageState(image);
  }, []);

  const setLogoText = useCallback((text: string) => {
    saveLogoText(text);
    setLogoTextState(text.trim() || DEFAULT_LOGO_TEXT);
  }, []);

  const setLogoColor = useCallback((color: string) => {
    saveLogoColor(color);
    setLogoColorState(color);
  }, []);

  return (
    <Ctx.Provider
      value={{ shopName, setShopName, businessHours, setBusinessHours, logoImage, setLogoImage, logoText, setLogoText, logoColor, setLogoColor }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useShopName = () => useContext(Ctx);