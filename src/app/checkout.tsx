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

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCart } from '../context/CartContext';
import { API_URL, getToken } from '../services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { refreshCart } = useCart();

  const [cart, setCart] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // FETCH CART AND ADDRESSES
  const fetchCheckoutData = async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Login Required', 'Please log in to continue.');
        router.replace('/login');
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [cartResponse, addressResponse] = await Promise.all([
        fetch(`${API_URL}/cart`, { headers }),
        fetch(`${API_URL}/addresses`, { headers }),
      ]);

      const cartData = await cartResponse.json();
      const addressData = await addressResponse.json();

      if (!cartResponse.ok || !addressResponse.ok) {
        throw new Error('Unable to load checkout details.');
      }

      setCart(cartData);

      const savedAddresses = addressData.addresses || [];

      setAddresses(savedAddresses);

      const defaultAddress = savedAddresses.find(
        (address: any) => address.isDefault
      );

      if (defaultAddress) {
        setSelectedAddress(defaultAddress._id);
      } else if (savedAddresses.length > 0) {
        setSelectedAddress(savedAddresses[0]._id);
      }

    } catch (error) {
      console.log('Checkout loading error:', error);

      Alert.alert(
        'Error',
        'Unable to load checkout details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  // PLACE ORDER
  const placeOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a delivery address.');
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add products to your bag.');
      return;
    }

    try {
      setPlacingOrder(true);

      const token = await getToken();

      const response = await fetch(`${API_URL}/orders/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addressId: selectedAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to place order.');
      }

      await refreshCart();

      Alert.alert(
        'Order Placed Successfully!',
        `Your order has been placed.\nOrder ID: ${data.order._id}\nTotal: ₹${data.order.totalAmount}`,
        [
          {
            text: 'Continue Shopping',
            onPress: () => router.replace('/'),
          },
        ]
      );

    } catch (error: any) {
      Alert.alert(
        'Order Failed',
        error.message || 'Something went wrong.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#ff3f6c" />
        <Text style={styles.loadingText}>Loading Checkout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={styles.heading}>Checkout</Text>

        {/* DELIVERY ADDRESS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>

          {addresses.length === 0 ? (
            <View>
              <Text style={styles.emptyText}>
                No saved addresses found.
              </Text>

              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => router.push('/addresses')}
              >
                <Text style={styles.addAddressText}>
                  + Add New Address
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address._id}
                style={[
                  styles.addressCard,
                  selectedAddress === address._id &&
                    styles.selectedCard,
                ]}
                onPress={() => setSelectedAddress(address._id)}
              >
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName}>
                    {address.fullName}
                  </Text>

                  <Text style={styles.radio}>
                    {selectedAddress === address._id ? '🔘' : '⚪'}
                  </Text>
                </View>

                <Text style={styles.addressText}>
                  {address.houseNo}, {address.street},
                  {' '}{address.locality}, {address.city},
                  {' '}{address.state} - {address.pincode}
                </Text>

                <Text style={styles.addressText}>
                  Mobile: {address.mobile}
                </Text>

                <Text style={styles.addressType}>
                  {address.addressType}
                  {address.isDefault ? ' • DEFAULT' : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {cart?.items?.map((item: any, index: number) => (
            <View key={index} style={styles.productCard}>

              <Image
                source={{ uri: item.product?.image }}
                style={styles.productImage}
              />

              <View style={styles.productDetails}>
                <Text style={styles.productName}>
                  {item.product?.name}
                </Text>

                <Text style={styles.brand}>
                  {item.product?.brand}
                </Text>

                <Text style={styles.productInfo}>
                  Size: {item.size}
                </Text>

                <Text style={styles.productInfo}>
                  Quantity: {item.quantity}
                </Text>

                <Text style={styles.price}>
                  ₹{item.subtotal}
                </Text>
              </View>

            </View>
          ))}
        </View>

        {/* PAYMENT METHOD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <View style={styles.paymentCard}>
            <Text style={styles.paymentIcon}>💵</Text>

            <View>
              <Text style={styles.paymentTitle}>
                Cash on Delivery
              </Text>

              <Text style={styles.paymentSubtitle}>
                Pay when your order arrives.
              </Text>
            </View>

            <Text style={styles.radio}>🔘</Text>
          </View>
        </View>

        {/* PRICE DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Items</Text>
            <Text style={styles.priceValue}>
              {cart?.totalItems || 0}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.free}>FREE</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>

            <Text style={styles.totalPrice}>
              ₹{cart?.totalAmount || 0}
            </Text>
          </View>
        </View>

        {/* PLACE ORDER BUTTON */}
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (placingOrder ||
              !cart?.items?.length ||
              !selectedAddress) &&
              styles.disabledButton,
          ]}
          onPress={placeOrder}
          disabled={
            placingOrder ||
            !cart?.items?.length ||
            !selectedAddress
          }
        >
          <Text style={styles.placeOrderText}>
            {placingOrder ? 'Placing Order...' : 'PLACE ORDER'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  loadingText: {
    marginTop: 12,
    color: '#555',
  },

  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    padding: 20,
  },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
  },

  addressCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },

  selectedCard: {
    borderColor: '#ff3f6c',
    backgroundColor: '#fff5f7',
  },

  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },

  radio: {
    fontSize: 18,
  },

  addressText: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },

  addressType: {
    color: '#ff3f6c',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 12,
  },

  emptyText: {
    color: '#777',
    marginBottom: 12,
  },

  addAddressButton: {
    backgroundColor: '#ff3f6c',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },

  addAddressText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  productCard: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  productImage: {
    width: 95,
    height: 115,
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  productDetails: {
    flex: 1,
    marginLeft: 14,
  },

  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },

  brand: {
    color: '#777',
    marginTop: 4,
  },

  productInfo: {
    color: '#555',
    fontSize: 13,
    marginTop: 5,
  },

  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 6,
  },

  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3f6c',
    borderRadius: 8,
    padding: 14,
  },

  paymentIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  paymentTitle: {
    fontWeight: 'bold',
    color: '#222',
  },

  paymentSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  priceLabel: {
    color: '#666',
  },

  priceValue: {
    color: '#222',
  },

  free: {
    color: 'green',
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },

  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3f6c',
  },

  placeOrderButton: {
    backgroundColor: '#ff3f6c',
    margin: 15,
    padding: 17,
    borderRadius: 8,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  placeOrderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});