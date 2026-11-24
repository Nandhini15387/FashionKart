
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCart } from '@/context/CartContext';

export default function CartScreen() {
  const router = useRouter();

  const {
    cart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>MY BAG</Text>

        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {cart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛍️</Text>

            <Text style={styles.emptyTitle}>
              Your bag is empty!
            </Text>

            <Text style={styles.emptyText}>
              Looks like you haven't added anything yet.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.shopButtonText}>
                START SHOPPING
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cart.map((item) => (
              <View
                key={`${item.id}-${item.size}`}
                style={styles.cartItem}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                />

                <View style={styles.productDetails}>
                  <Text style={styles.brand}>
                    {item.brand}
                  </Text>

                  <Text style={styles.productName}>
                    {item.name}
                  </Text>

                  <Text style={styles.size}>
                    Size: {item.size}
                  </Text>

                  <Text style={styles.price}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(
                          item.id,
                          item.size,
                          item.quantity - 1
                        )
                      }
                    >
                      <Text style={styles.quantityText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantity}>
                      {item.quantity}
                    </Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateQuantity(
                          item.id,
                          item.size,
                          item.quantity + 1
                        )
                      }
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      removeFromCart(item.id, item.size)
                    }
                  >
                    <Text style={styles.removeButton}>
                      REMOVE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.billContainer}>
              <Text style={styles.billTitle}>
                PRICE DETAILS
              </Text>

              <View style={styles.billRow}>
                <Text style={styles.billText}>
                  Total Amount
                </Text>

                <Text style={styles.billText}>
                  ₹{total.toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billText}>
                  Delivery
                </Text>

                <Text style={styles.freeDelivery}>
                  FREE
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.billRow}>
                <Text style={styles.totalText}>
                  Total
                </Text>

                <Text style={styles.totalText}>
                  ₹{total.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push('/checkout')}
   >
                <Text style={styles.checkoutText}>
                  PLACE ORDER →
                </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  backButton: {
    fontSize: 35,
    color: '#222222',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222222',
  },

  content: {
    padding: 16,
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },

  emptyIcon: {
    fontSize: 65,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: '900',
    marginTop: 20,
    color: '#222222',
  },

  emptyText: {
    color: '#888888',
    marginTop: 10,
    textAlign: 'center',
  },

  shopButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    paddingHorizontal: 30,
    marginTop: 25,
    borderRadius: 6,
  },

  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  cartItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  productImage: {
    width: 115,
    height: 145,
    borderRadius: 6,
    backgroundColor: '#F4F4F4',
  },

  productDetails: {
    flex: 1,
    marginLeft: 13,
  },

  brand: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },

  productName: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
  },

  size: {
    fontSize: 12,
    color: '#555555',
    marginTop: 8,
  },

  price: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
    color: '#222222',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },

  quantityButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },

  quantityText: {
    fontSize: 18,
    color: '#222222',
  },

  quantity: {
    marginHorizontal: 15,
    fontWeight: '800',
  },

  removeButton: {
    color: '#E91E63',
    fontWeight: '900',
    fontSize: 11,
    marginTop: 5,
  },

  billContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    marginTop: 10,
  },

  billTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 15,
    color: '#222222',
  },

  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },

  billText: {
    fontSize: 13,
    color: '#555555',
  },

  freeDelivery: {
    color: '#008000',
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 10,
  },

  totalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#222222',
  },

  checkoutButton: {
    backgroundColor: '#E91E63',
    padding: 17,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  checkoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});