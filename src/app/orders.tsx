import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getToken } from '../services/api';

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH CUSTOMER ORDERS
  const fetchOrders = async () => {
    try {
      const token = await getToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch orders.');
      }

      setOrders(data.orders || []);

    } catch (error) {
      console.log('Orders Error:', error);

      Alert.alert('Error', 'Unable to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  // CANCEL ORDER
  const cancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',

          onPress: async () => {
            try {
              const token = await getToken();

              if (!token) {
                router.replace('/login');
                return;
              }

              const response = await fetch(
                `${API_URL}/orders/cancel/${orderId}`,
                {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || 'Unable to cancel order.'
                );
              }

              setOrders((previousOrders) =>
                previousOrders.map((order) =>
                  order._id === orderId
                    ? {
                        ...order,
                        orderStatus: 'Cancelled',
                      }
                    : order
                )
              );

              Alert.alert(
                'Success',
                'Your order has been cancelled successfully.'
              );

            } catch (error: any) {
              Alert.alert(
                'Cancellation Failed',
                error.message || 'Something went wrong.'
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ORDER STATUS COLOR
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return '#008000';

      case 'Cancelled':
        return '#E53935';

      case 'Shipped':
        return '#1976D2';

      case 'Confirmed':
        return '#FF9800';

      default:
        return '#E91E63';
    }
  };

  // LOADING SCREEN
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />

        <Text style={styles.loadingText}>
          Loading Orders...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>
          MY ORDERS
        </Text>

        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* EMPTY ORDERS */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>

            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              No Orders Yet!
            </Text>

            <Text style={styles.emptyText}>
              Your orders will appear here.
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.shopButtonText}>
                START SHOPPING
              </Text>
            </TouchableOpacity>

          </View>
        ) : (

          /* ORDER LIST */
          orders.map((order) => (
            <View
              key={order._id}
              style={styles.orderCard}
            >

              {/* ORDER HEADER */}
              <View style={styles.orderHeader}>

                <Text style={styles.orderTitle}>
                  Order Details
                </Text>

                <Text
                  style={[
                    styles.status,
                    {
                      color: getStatusColor(order.orderStatus),
                    },
                  ]}
                >
                  {order.orderStatus}
                </Text>

              </View>

              {/* ORDER INFORMATION */}
              <Text style={styles.orderId}>
                Order ID: {order._id}
              </Text>

              <Text style={styles.date}>
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}
              </Text>

              <View style={styles.divider} />

              {/* ORDERED PRODUCTS */}
              {order.items.map((item: any, index: number) => (
                <View
                  key={index}
                  style={styles.productRow}
                >

                  <View style={styles.productDetails}>

                    <Text style={styles.productName}>
                      {item.name}
                    </Text>

                    <Text style={styles.productInfo}>
                      Size: {item.size}
                    </Text>

                    <Text style={styles.productInfo}>
                      Quantity: {item.quantity}
                    </Text>

                  </View>

                  <Text style={styles.price}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </Text>

                </View>
              ))}

              <View style={styles.divider} />

              {/* PAYMENT DETAILS */}
              <View style={styles.orderFooter}>

                <View>

                  <Text style={styles.payment}>
                    Payment: {order.paymentMethod}
                  </Text>

                  <Text style={styles.paymentStatus}>
                    Payment Status: {order.paymentStatus}
                  </Text>

                </View>

                <Text style={styles.total}>
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </Text>

              </View>

              {/* DELIVERY ADDRESS */}
              <View style={styles.addressBox}>

                <Text style={styles.addressTitle}>
                  Delivery Address
                </Text>

                <Text style={styles.addressText}>
                  {order.shippingAddress}
                </Text>

              </View>

              {/* CANCEL ORDER BUTTON */}
              {!['Shipped', 'Delivered', 'Cancelled'].includes(
                order.orderStatus
              ) && (

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelOrder(order._id)}
                >
                  <Text style={styles.cancelButtonText}>
                    CANCEL ORDER
                  </Text>
                </TouchableOpacity>

              )}

            </View>
          ))

        )}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#555',
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    fontSize: 35,
    color: '#222',
  },

  heading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222',
  },

  content: {
    padding: 15,
    flexGrow: 1,
  },

  emptyContainer: {
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
    color: '#222',
  },

  emptyText: {
    color: '#888',
    marginTop: 10,
  },

  shopButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    marginTop: 25,
    borderRadius: 6,
  },

  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#222',
  },

  status: {
    fontWeight: '900',
    fontSize: 13,
  },

  orderId: {
    fontSize: 11,
    color: '#777',
    marginTop: 10,
  },

  date: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 13,
  },

  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  productDetails: {
    flex: 1,
  },

  productName: {
    fontWeight: '900',
    color: '#222',
  },

  productInfo: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },

  price: {
    fontWeight: '900',
    color: '#222',
  },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  payment: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
  },

  paymentStatus: {
    fontSize: 12,
    color: '#E91E63',
    marginTop: 5,
  },

  total: {
    fontSize: 19,
    fontWeight: '900',
    color: '#E91E63',
  },

  addressBox: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    marginTop: 15,
    borderRadius: 6,
  },

  addressTitle: {
    fontWeight: '900',
    color: '#222',
    marginBottom: 6,
  },

  addressText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 19,
  },

  cancelButton: {
    borderWidth: 1,
    borderColor: '#E91E63',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },

  cancelButtonText: {
    color: '#E91E63',
    fontWeight: '900',
    fontSize: 13,
  },

});