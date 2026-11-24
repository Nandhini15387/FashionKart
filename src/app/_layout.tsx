import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';

import { useColorScheme } from 'react-native';

import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CartProvider>
      <WishlistProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="wishlist" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="account" />
            <Stack.Screen name="addresses" />
          </Stack>
        </ThemeProvider>
      </WishlistProvider>
    </CartProvider>
  );
}