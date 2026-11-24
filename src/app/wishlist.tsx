import { useRouter } from 'expo-router';
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

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const router = useRouter();

  const {
    wishlist,
    removeFromWishlist,
    refreshWishlist,
  } = useWishlist();

  const { addToCart } = useCart();

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadWishlist = async () => {
      await refreshWishlist();
      setLoading(false);
    };

    loadWishlist();
  }, []);

  const handleAddToBag = (product: (typeof wishlist)[number]) => {
    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: Number(product.price.replace(/[₹,]/g, '')),
      image: product.image,
      size: 'M',
    });

    Alert.alert(
      'Added to Bag',
      `${product.name} added with size M. You can change the size from the product details screen.`
    );
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      'Remove Product',
      'Are you sure you want to remove this product from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWishlist(id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>MY WISHLIST</Text>

        <View style={{ width: 50 }} />
      </View>

      <Text style={styles.count}>
        {wishlist.length} saved products
      </Text>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.emptyText}>Loading wishlist...</Text>
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>♡</Text>

          <Text style={styles.emptyTitle}>
            Your Wishlist is Empty
          </Text>

          <Text style={styles.emptyText}>
            Save your favourite products here and find them whenever you need.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.shopButtonText}>
              EXPLORE PRODUCTS
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {wishlist.map((product) => (
            <View key={product.id} style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/product/[id]',
                    params: { id: product.id },
                  })
                }
              >
                <Image
                  source={{ uri: product.image }}
                  style={styles.image}
                />
              </TouchableOpacity>

              <View style={styles.info}>
                <Text style={styles.brand}>{product.brand}</Text>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.price}>{product.price}</Text>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToBag(product)}
                >
                  <Text style={styles.addButtonText}>
                    ADD TO BAG
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemove(product.id)}
                >
                  <Text style={styles.remove}>
                    REMOVE ♡
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  back: {
    color: '#E91E63',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222222',
  },
  count: {
    color: '#888888',
    paddingHorizontal: 18,
    marginBottom: 15,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 75,
    color: '#E91E63',
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    marginTop: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888888',
    marginTop: 10,
    lineHeight: 22,
  },
  shopButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    borderRadius: 6,
    marginTop: 25,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 10,
    backgroundColor: '#FFF8FA',
    borderRadius: 10,
  },
  image: {
    width: 115,
    height: 145,
    borderRadius: 7,
  },
  info: {
    flex: 1,
    paddingLeft: 13,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },
  name: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#E91E63',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  remove: {
    color: '#E91E63',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 10,
  },
});