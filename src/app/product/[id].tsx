import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { API_URL } from '@/services/api';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number;
  image: string;
  category: string;
  description: string;
  sizes: string[];
  stock: number;
  rating: number;
  discount: number;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log('PRODUCT SCREEN ID:', id);

  const router = useRouter();

  const { addToCart } = useCart();

  const {
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
  } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/products/${id}`);
      const data = await response.json();

      console.log('PRODUCT API RESPONSE:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load product.');
      }

      const item = data.product || data;

      setProduct({
        id: item._id || item.id,
        name: item.name,
        brand: item.brand,
        price: Number(item.price),
        oldPrice: Number(item.oldPrice || 0),
        image: item.image,
        category: item.category || '',
        description:
          item.description ||
          'Discover the latest fashion with FashionKart. Enjoy stylish designs, comfortable materials and great prices.',
        sizes: item.sizes || ['S', 'M', 'L', 'XL'],
        stock: Number(item.stock || 0),
        rating: Number(item.rating || 0),
        discount: Number(item.discount || 0),
      });

    } catch (err: any) {
      console.log('Product Fetch Error:', err.message);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const wishlisted = product ? isWishlisted(product.id) : false;

  const handleWishlist = () => {
    if (!product) return;

    if (wishlisted) {
      removeFromWishlist(product.id);

      Alert.alert(
        'Wishlist',
        'Product removed from your wishlist.'
      );
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: `₹${product.price.toLocaleString('en-IN')}`,
        oldPrice: `₹${product.oldPrice.toLocaleString('en-IN')}`,
        image: product.image,
      });

      Alert.alert(
        'Wishlist',
        'Product added to your wishlist!'
      );
    }
  };

  const handleAddToBag = () => {
    if (!product) return;

    if (!selectedSize) {
      Alert.alert('Select Size', 'Please select a size first.');
      return;
    }

    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      size: selectedSize,
    });

    Alert.alert(
      'Added to Bag!',
      `${product.name} has been added to your shopping bag.`,
      [
        {
          text: 'CONTINUE SHOPPING',
          style: 'cancel',
        },
        {
          text: 'VIEW BAG',
          onPress: () => router.push('/cart'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff3f6c" />
        <Text style={styles.statusText}>Loading product...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Product not found!'}
        </Text>

        <TouchableOpacity onPress={fetchProduct}>
          <Text style={styles.backText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Image
          source={{ uri: product.image }}
          style={styles.image}
        />

        <View style={styles.details}>
          <Text style={styles.brand}>{product.brand}</Text>

          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{product.price.toLocaleString('en-IN')}
            </Text>

            {product.oldPrice > 0 && (
              <Text style={styles.oldPrice}>
                ₹{product.oldPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          {product.discount > 0 && (
            <Text style={styles.discount}>
              {product.discount}% OFF
            </Text>
          )}

          {product.rating > 0 && (
            <Text style={styles.rating}>
              ⭐ {product.rating} Rating
            </Text>
          )}

          <Text style={styles.heading}>Select Size</Text>

          <View style={styles.sizes}>
            {product.sizes.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  selectedSize === size && styles.selectedSize,
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === size && styles.selectedSizeText,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.stockText}>
            {product.stock > 0
              ? 'In Stock'
              : 'Currently Out of Stock'}
          </Text>

          <TouchableOpacity
            style={[
              styles.addButton,
              product.stock <= 0 && styles.disabledButton,
            ]}
            onPress={handleAddToBag}
            disabled={product.stock <= 0}
          >
            <Text style={styles.addButtonText}>
              {product.stock > 0 ? 'ADD TO BAG' : 'OUT OF STOCK'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewBagButton}
            onPress={() => router.push('/cart')}
          >
            <Text style={styles.viewBagText}>
              VIEW SHOPPING BAG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wishlistButton,
              wishlisted && styles.activeWishlistButton,
            ]}
            onPress={handleWishlist}
          >
            <Text
              style={[
                styles.wishlistText,
                wishlisted && styles.activeWishlistText,
              ]}
            >
              {wishlisted
                ? '❤️ ADDED TO WISHLIST'
                : '♡ ADD TO WISHLIST'}
            </Text>
          </TouchableOpacity>

          {/* WRITE A REVIEW BUTTON */}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push(`/reviews/${product.id}`)}
          >
            <Text style={styles.reviewButtonText}>
              ⭐ WRITE A REVIEW
            </Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Product Details</Text>

          <Text style={styles.description}>
            {product.description}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  statusText: {
    marginTop: 12,
    color: '#555',
    fontSize: 15,
  },

  errorText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    textAlign: 'center',
  },

  backButton: {
    padding: 16,
  },

  backText: {
    fontSize: 17,
    color: '#ff3f6c',
    fontWeight: 'bold',
    marginTop: 10,
  },

  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },

  details: {
    padding: 20,
  },

  brand: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  name: {
    fontSize: 17,
    color: '#555',
    marginTop: 5,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  price: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  oldPrice: {
    fontSize: 16,
    color: '#888',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },

  discount: {
    color: '#ff3f6c',
    fontWeight: 'bold',
    marginTop: 5,
  },

  rating: {
    color: '#555',
    marginTop: 8,
  },

  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },

  sizes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  sizeButton: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedSize: {
    backgroundColor: '#ff3f6c',
    borderColor: '#ff3f6c',
  },

  sizeText: {
    fontSize: 15,
  },

  selectedSizeText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  stockText: {
    color: '#16833c',
    marginTop: 15,
    fontWeight: '600',
  },

  addButton: {
    backgroundColor: '#ff3f6c',
    padding: 17,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },

  disabledButton: {
    backgroundColor: '#999',
  },

  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  viewBagButton: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },

  viewBagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  wishlistButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 17,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },

  activeWishlistButton: {
    borderColor: '#ff3f6c',
    backgroundColor: '#FFF0F5',
  },

  wishlistText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  activeWishlistText: {
    color: '#ff3f6c',
  },

  reviewButton: {
    backgroundColor: '#222',
    padding: 17,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  description: {
    color: '#666',
    fontSize: 15,
    lineHeight: 24,
  },
});