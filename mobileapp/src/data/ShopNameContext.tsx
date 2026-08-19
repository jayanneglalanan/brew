import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  loadShopName, saveShopName, loadBusinessHours, saveBusinessHours,
  loadLogoImage, saveLogoImage, loadLogoText, saveLogoText, loadLogoColor, saveLogoColor,
  DEFAULT_SHOP_NAME, DEFAULT_BUSINESS_HOURS, DEFAULT_LOGO_TEXT, DEFAULT_LOGO_COLOR,
} from './storage';

interface ShopNameCtx {
  shopName: string;
  setShopName: (name: string) => Promise<void>;
  businessHours: string;
  setBusinessHours: (hours: string) => Promise<void>;
  logoImage: string;
  setLogoImage: (image: string) => Promise<void>;
  logoText: string;
  setLogoText: (text: string) => Promise<void>;
  logoColor: string;
  setLogoColor: (color: string) => Promise<void>;
}

const Ctx = createContext<ShopNameCtx>({
  shopName: DEFAULT_SHOP_NAME,
  setShopName: async () => {},
  businessHours: DEFAULT_BUSINESS_HOURS,
  setBusinessHours: async () => {},
  logoImage: '',
  setLogoImage: async () => {},
  logoText: DEFAULT_LOGO_TEXT,
  setLogoText: async () => {},
  logoColor: DEFAULT_LOGO_COLOR,
  setLogoColor: async () => {},
});

export function ShopNameProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopNameState] = useState(DEFAULT_SHOP_NAME);
  const [businessHours, setBusinessHoursState] = useState(DEFAULT_BUSINESS_HOURS);
  const [logoImage, setLogoImageState] = useState('');
  const [logoText, setLogoTextState] = useState(DEFAULT_LOGO_TEXT);
  const [logoColor, setLogoColorState] = useState(DEFAULT_LOGO_COLOR);

  useEffect(() => {
    let on = true;
    Promise.all([loadShopName(), loadBusinessHours(), loadLogoImage(), loadLogoText(), loadLogoColor()]).then(
      ([name, hours, image, text, color]) => {
        if (on) {
          setShopNameState(name);
          setBusinessHoursState(hours);
          setLogoImageState(image ?? '');
          setLogoTextState(text);
          setLogoColorState(color);
        }
      },
    );
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

  const setLogoImage = useCallback(async (image: string) => {
    await saveLogoImage(image);
    setLogoImageState(image);
  }, []);

  const setLogoText = useCallback(async (text: string) => {
    await saveLogoText(text);
    setLogoTextState(text.trim() || DEFAULT_LOGO_TEXT);
  }, []);

  const setLogoColor = useCallback(async (color: string) => {
    await saveLogoColor(color);
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

export function useShopName(): ShopNameCtx {
  return useContext(Ctx);
}