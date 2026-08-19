import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { useState } from 'react';
import { colors } from './theme';
import { DataProvider } from './data/DataContext';
import { AuthProvider, useAuth } from './data/AuthContext';
import { RangeFilterProvider } from './data/RangeFilterContext';
import { ShopNameProvider } from './data/ShopNameContext';
import AppDrawer from './components/ui/AppDrawer';
import BottomTabBar from './components/ui/BottomTabBar';
import { ToastProvider } from './components/ui/Toast';

import DashboardScreen from './features/dashboard/DashboardScreen';
import SalesScreen from './features/sales/SalesScreen';
import InventoryScreen from './features/inventory/InventoryScreen';
import ReportsScreen from './features/reports/ReportsScreen';
import ProductsScreen from './features/products/ProductsScreen';
import AnalyticsScreen from './features/analytics/AnalyticsScreen';
import ProfitScreen from './features/profit/ProfitScreen';
import ManagementScreen from './features/management/ManagementScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import LoginScreen from './features/login/LoginScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Products: { initial?: string } | undefined;
  Analytics: { initial?: string } | undefined;
  Profit: undefined;
  Management: { initial?: string } | undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function ManagerHome() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ paddingTop: insets.top }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FDF6EC' }}>Inventory</Text>
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={12}>
              <Text style={{ fontSize: 22, color: '#FDF6EC' }}>☰</Text>
            </Pressable>
          </View>
        </View>
        <InventoryScreen />
      </View>
      <AppDrawer open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </>
  );
}

function Tabs() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isManager = user?.role === 'manager';

  if (isManager) {
    return <ManagerHome />;
  }

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontWeight: '700', color: '#FDF6EC' },
          headerTintColor: '#FDF6EC',
          headerRight: () => (
            <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 22, color: '#FDF6EC' }}>☰</Text>
            </Pressable>
          ),
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Sales" component={SalesScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
      <AppDrawer open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </>
  );
}

function Root() {
  const { ready, authed } = useAuth();
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#FAF3EA' }} />;
  }
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={authed ? 'Main' : 'Login'}
        screenOptions={{
          animation: 'fade',
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontWeight: '700', color: '#FDF6EC' },
          headerTintColor: '#FDF6EC',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products & Menu' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="Profit" component={ProfitScreen} options={{ title: 'Profit & Expenses' }} />
        <Stack.Screen name="Management" component={ManagementScreen} options={{ title: 'Management' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <RangeFilterProvider>
            <ShopNameProvider>
              <ToastProvider>
                <Root />
              </ToastProvider>
            </ShopNameProvider>
          </RangeFilterProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}