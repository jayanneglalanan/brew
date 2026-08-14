import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text } from 'react-native';
import { useState } from 'react';
import { colors } from './theme';
import { DataProvider } from './data/DataContext';
import AppDrawer from './components/ui/AppDrawer';
import BottomTabBar from './components/ui/BottomTabBar';

import DashboardScreen from './features/dashboard/DashboardScreen';
import SalesScreen from './features/sales/SalesScreen';
import InventoryScreen from './features/inventory/InventoryScreen';
import ReportsScreen from './features/reports/ReportsScreen';
import ProductsScreen from './features/products/ProductsScreen';
import AnalyticsScreen from './features/analytics/AnalyticsScreen';
import ProfitScreen from './features/profit/ProfitScreen';
import ManagementScreen from './features/management/ManagementScreen';
import RegisterScreen from './features/register/RegisterScreen';

export type RootStackParamList = {
  Main: undefined;
  Products: { initial?: string } | undefined;
  Analytics: { initial?: string } | undefined;
  Profit: undefined;
  Management: { initial?: string } | undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const [menuOpen, setMenuOpen] = useState(false);
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
        <Tab.Screen name="Register" component={RegisterScreen} />
        <Tab.Screen name="Sales" component={SalesScreen} />
        <Tab.Screen name="Inventory" component={InventoryScreen} />
        <Tab.Screen name="Reports" component={ReportsScreen} />
      </Tab.Navigator>
      <AppDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTitleStyle: { fontWeight: '700', color: '#FDF6EC' },
              headerTintColor: '#FDF6EC',
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products & Menu' }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
            <Stack.Screen name="Profit" component={ProfitScreen} options={{ title: 'Profit & Expenses' }} />
            <Stack.Screen name="Management" component={ManagementScreen} options={{ title: 'Management' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </DataProvider>
    </SafeAreaProvider>
  );
}
