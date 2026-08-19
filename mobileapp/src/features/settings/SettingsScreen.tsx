import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../data/AuthContext';
import { useShopName } from '../../data/ShopNameContext';
import { DEMO_ACCOUNTS, loadEmail, saveEmail, savePassword } from '../../data/auth';
import Screen from '../../components/ui/Screen';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import AnimatedModal from '../../components/ui/AnimatedModal';
import { useToast } from '../../components/ui/Toast';
import { colors, gap, radius } from '../../theme';

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
  const [avatarColorDraft] = useState(user?.avatarColor ?? colors.brand);
  const [logoImageDraft, setLogoImageDraft] = useState(logoImage);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    loadEmail(user.id).then((e) => {
      if (e) setEmailDraft(e);
    });
  }, [user]);

  const pickImage = async (onPicked: (dataUrl: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.base64) {
      onPicked(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } else if (asset.uri) {
      onPicked(asset.uri);
    }
  };

  const confirmSave = () => {
    const tasks: Array<Promise<void>> = [];
    const nextName = nameDraft.trim();
    const nextShopName = shopNameDraft.trim();
    const nextBusinessHours = businessHoursDraft.trim();

    tasks.push(updateProfile({ name: nextName, avatar: avatarDraft, avatarColor: avatarColorDraft }));
    if (emailDraft.trim() && emailDraft.trim().toLowerCase() !== demoEmail.toLowerCase() && user) {
      tasks.push(saveEmail(user.id, emailDraft.trim()));
    }
    if (passwordDraft.trim() && user) {
      tasks.push(savePassword(user.id, passwordDraft));
    }
    tasks.push(setShopName(nextShopName));
    tasks.push(setBusinessHours(nextBusinessHours));
    tasks.push(setLogoImage(logoImageDraft));

    Promise.all(tasks).then(() => {
      setConfirmOpen(false);
      setPasswordDraft('');
      toast('Profile saved');
    });
  };

  return (
    <Screen title="Settings" subtitle="Profile, shop details and account">
      <Card title="Profile" style={styles.profileCard}>
        {user ? (
          <>
            <View style={styles.mediaRow}>
              <View style={styles.mediaItem}>
                <View style={styles.avatar}>
                  {avatarDraft ? (
                    <Image source={{ uri: avatarDraft }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{nameDraft.charAt(0) || user.name.charAt(0)}</Text>
                  )}
                </View>
                <Pressable style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]} onPress={() => pickImage(setAvatarDraft)}>
                  <Text style={styles.uploadText}>Upload avatar</Text>
                </Pressable>
              </View>
              {!isManager ? (
                <View style={styles.mediaItem}>
                  <View style={[styles.logoTile, { backgroundColor: colors.brand }]}>
                    {logoImageDraft ? (
                      <Image source={{ uri: logoImageDraft }} style={styles.logoImg} />
                    ) : (
                      <Text style={styles.logoText}>☕</Text>
                    )}
                  </View>
                  <Pressable style={({ pressed }) => [styles.uploadBtn, pressed && styles.uploadBtnPressed]} onPress={() => pickImage(setLogoImageDraft)}>
                    <Text style={styles.uploadText}>Upload logo</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <FormField label="Username" value={emailDraft} onChangeText={setEmailDraft} placeholder="Enter login email" keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Password" value={passwordDraft} onChangeText={setPasswordDraft} placeholder="Leave blank to keep current" secureTextEntry />
            <FormField label="Name" value={nameDraft} onChangeText={setNameDraft} placeholder="Enter your name" autoCapitalize="words" />
            {!isManager ? (
              <>
                <FormField label="Shop Name" value={shopNameDraft} onChangeText={setShopNameDraft} placeholder="Enter shop name" autoCapitalize="words" />
                <FormField label="Business Hours" value={businessHoursDraft} onChangeText={setBusinessHoursDraft} placeholder="e.g. 7:00 AM – 9:00 PM" autoCapitalize="words" />
              </>
            ) : null}

            <Pressable style={styles.saveBtn} onPress={() => setConfirmOpen(true)}>
              <Text style={styles.saveText}>Save Profile</Text>
            </Pressable>
          </>
        ) : null}
      </Card>

      {!isManager ? (
        <Card title="Alert Thresholds">
          <View style={styles.row}>
            <Text style={styles.muted}>Critical stock</Text>
            <Text style={styles.bold}>At or below critical level</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Large discount</Text>
            <Text style={styles.bold}>Over 15%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Sales drop alert</Text>
            <Text style={styles.bold}>Below 50% of 7-day avg</Text>
          </View>
        </Card>
      ) : null}

      <AnimatedModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} panelStyle={{ width: '78%', maxWidth: 300, alignSelf: 'center' }}>
        <Text style={styles.modalTitle}>Save Profile</Text>
        <View style={styles.modalActions}>
          <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setConfirmOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.modalBtn, styles.saveBtn]} onPress={confirmSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </AnimatedModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { width: '92%', alignSelf: 'center' },
  mediaRow: { flexDirection: 'row', gap: gap.md },
  mediaItem: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: gap.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bold: { fontSize: 13, fontWeight: '700', color: colors.onCard },
  muted: { fontSize: 12, color: colors.onCardSub },
  uploadBtn: { borderWidth: 1, borderColor: colors.brand, borderRadius: 10, paddingHorizontal: gap.md, paddingVertical: 8 },
  uploadBtnPressed: { backgroundColor: colors.brandSoft },
  uploadText: { fontSize: 12, fontWeight: '700', color: colors.brand },
  logoTile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg: { width: 44, height: 44, borderRadius: radius.md },
  logoText: { fontSize: 18, fontWeight: '800' },
  saveBtn: { marginTop: gap.sm, backgroundColor: colors.brand, borderRadius: 10, paddingVertical: 12, alignItems: 'center', width: '100%' },
  saveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modalWrap: { flex: 1, backgroundColor: 'rgba(61,48,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: gap.lg },
  modal: { backgroundColor: colors.card, borderRadius: radius.md, padding: gap.md, width: '78%', maxWidth: 300, alignSelf: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.onCard, marginBottom: gap.sm },
  modalActions: { flexDirection: 'row', gap: gap.sm },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
});
