import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import { API_URL, getToken } from '../services/api';

export type WishlistProduct = {
  id: string;
  name: string;
  brand: string;
  price: string;
  oldPrice: string;
  image: string;
};

type WishlistContextType = {
  wishlist: WishlistProduct[];
  wishlistCount: number;
  addToWishlist: (product: WishlistProduct) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isWishlisted: (id: string) => boolean;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'fashionkart_wishlist';

// CONVERT BACKEND PRODUCT INTO FRONTEND PRODUCT
const mapProduct = (item: any): WishlistProduct => ({
  id: item._id || item.id,
  name: item.name,
  brand: item.brand,
  price: `₹${Number(item.price).toLocaleString('en-IN')}`,
  oldPrice: `₹${Number(item.oldPrice || 0).toLocaleString('en-IN')}`,
  image: item.image,
});

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // LOAD WISHLIST FROM MONGODB OR LOCAL STORAGE
  const refreshWishlist = async () => {
    try {
      const token = await getToken();

      if (token) {
        const response = await fetch(`${API_URL}/wishlist`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to fetch wishlist.');
        }

        const products = (data.wishlist || []).map(mapProduct);

        setWishlist(products);
      } else {
        const savedWishlist = await AsyncStorage.getItem(STORAGE_KEY);

        setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
      }
    } catch (error) {
      console.log('Error loading wishlist:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, []);

  // SAVE LOCAL WISHLIST FOR GUEST USERS
  useEffect(() => {
    const saveWishlist = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();

        if (!token) {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(wishlist)
          );
        }
      } catch (error) {
        console.log('Error saving wishlist:', error);
      }
    };

    saveWishlist();
  }, [wishlist, isLoaded]);

  // ADD PRODUCT TO WISHLIST
  const addToWishlist = async (product: WishlistProduct) => {
    try {
      const token = await getToken();

      if (token) {
        const response = await fetch(`${API_URL}/wishlist/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to add product.');
        }

        await refreshWishlist();
      } else {
        setWishlist((previous) => {
          if (previous.some((item) => item.id === product.id)) {
            return previous;
          }

          return [...previous, product];
        });
      }
    } catch (error) {
      console.log('Add Wishlist Error:', error);
    }
  };

  // REMOVE PRODUCT FROM WISHLIST
  const removeFromWishlist = async (id: string) => {
    try {
      const token = await getToken();

      if (token) {
        const response = await fetch(`${API_URL}/wishlist/remove`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to remove product.');
        }

        await refreshWishlist();
      } else {
        setWishlist((previous) =>
          previous.filter((item) => item.id !== id)
        );
      }
    } catch (error) {
      console.log('Remove Wishlist Error:', error);
    }
  };

  // CHECK WHETHER PRODUCT IS WISHLISTED
  const isWishlisted = (id: string) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider'
    );
  }

  return context;
}