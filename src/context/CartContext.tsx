import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL, getToken } from '../services/api';

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  refreshCart: () => Promise<void>;
  cartCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'fashionkart_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Convert MongoDB cart response into the mobile app's cart format.
  const formatCartItems = (items: any[]): CartItem[] => {
    return items
      .filter((item) => item.product)
      .map((item) => ({
        id: item.product._id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        image: item.product.image,
        size: item.size,
        quantity: item.quantity,
      }));
  };

  // Load cart from backend when logged in.
  const refreshCart = async () => {
    try {
      const token = await getToken();

      if (!token) {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }

        return;
      }

      const response = await fetch(`${API_URL}/cart`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load cart.');
      }

      const formattedCart = formatCartItems(data.items || []);

      setCart(formattedCart);

      await AsyncStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(formattedCart)
      );

      console.log('Cart loaded from MongoDB successfully!');
    } catch (error) {
      console.log('Cart loading error:', error);
    }
  };

  // Load cart when the app starts.
  useEffect(() => {
    const initializeCart = async () => {
      try {
        await refreshCart();
      } finally {
        setIsLoaded(true);
      }
    };

    initializeCart();
  }, []);

  // Save cart locally whenever it changes.
  useEffect(() => {
    if (!isLoaded) return;

    AsyncStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    ).catch((error) => {
      console.log('Local cart saving error:', error);
    });
  }, [cart, isLoaded]);

  // Add product to cart.
  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) =>
          item.id === product.id &&
          item.size === product.size
      );

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === product.id && item.size === product.size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previousCart, { ...product, quantity: 1 }];
    });

    // Synchronize with MongoDB.
    const syncAddToBackend = async () => {
      try {
        const token = await getToken();

        if (!token) return;

        const response = await fetch(`${API_URL}/cart/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
            size: product.size,
            quantity: 1,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to add product.');
        }

        console.log('Product added to MongoDB cart!');
      } catch (error) {
        console.log('Cart add error:', error);
      }
    };

    syncAddToBackend();
  };

  // Remove product from cart.
  const removeFromCart = (id: string, size: string) => {
    setCart((previousCart) =>
      previousCart.filter(
        (item) => !(item.id === id && item.size === size)
      )
    );

    const syncRemoveToBackend = async () => {
      try {
        const token = await getToken();

        if (!token) return;

        const response = await fetch(`${API_URL}/cart/remove`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: id,
            size,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to remove product.');
        }

        console.log('Product removed from MongoDB cart!');
      } catch (error) {
        console.log('Cart remove error:', error);
      }
    };

    syncRemoveToBackend();
  };

  // Update product quantity.
  const updateQuantity = (
    id: string,
    size: string,
    quantity: number
  ) => {
    if (quantity < 1) return;

    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity }
          : item
      )
    );

    const syncUpdateToBackend = async () => {
      try {
        const token = await getToken();

        if (!token) return;

        const response = await fetch(`${API_URL}/cart/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: id,
            size,
            quantity,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to update quantity.');
        }

        console.log('Cart quantity updated in MongoDB!');
      } catch (error) {
        console.log('Cart update error:', error);
      }
    };

    syncUpdateToBackend();
  };

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        refreshCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}