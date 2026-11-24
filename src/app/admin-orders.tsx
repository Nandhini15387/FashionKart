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

export default function AdminOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  const fetchOrders = async () => {
    try {
      const token = await getToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch orders.');
      }

      setOrders(data.orders || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      setUpdating(orderId);

      const token = await getToken();

      const response = await fetch(
        `${API_URL}/admin/orders/status/${orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderStatus: status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update order.');
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: status }
            : order
        )
      );

      Alert.alert('Success', `Order updated to ${status}.`);
    } catch (error: any) {
      Alert.alert(
        'Update Failed',
        error.message || 'Something went wrong.'
      );
    } finally {
      setUpdating('');
    }
  };

  const confirmStatusChange = (
    orderId: string,
    status: string
  ) => {
    Alert.alert(
      'Update Order',
      `Change order status to ${status}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => updateOrderStatus(orderId, status),
        },
      ]
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>
          Loading Customer Orders...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>ADMIN ORDERS</Text>

        <TouchableOpacity onPress={fetchOrders}>
          <Text style={styles.refresh}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Total Customer Orders
          </Text>
          <Text style={styles.summaryNumber}>
            {orders.length}
          </Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>
              No Customer Orders
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>
                  Customer Order
                </Text>

                <Text
                  style={[
                    styles.status,
                    { color: getStatusColor(order.orderStatus) },
                  ]}
                >
                  {order.orderStatus}
                </Text>
              </View>

              <Text style={styles.orderId}>
                Order ID: {order._id}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                Customer Details
              </Text>

              <Text style={styles.info}>
                Name: {order.user?.name || 'Unavailable'}
              </Text>

              <Text style={styles.info}>
                Email: {order.user?.email || 'Unavailable'}
              </Text>

              <Text style={styles.info}>
                Mobile: {order.user?.mobile || 'Unavailable'}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                Ordered Products
              </Text>

              {order.items.map((item: any, index: number) => (
                <View key={index} style={styles.productRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>
                      {item.name}
                    </Text>

                    <Text style={styles.info}>
                      Size: {item.size}
                    </Text>

                    <Text style={styles.info}>
                      Quantity: {item.quantity}
                    </Text>
                  </View>

                  <Text style={styles.price}>
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              ))}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                Payment Details
              </Text>

              <Text style={styles.info}>
                Method: {order.paymentMethod}
              </Text>

              <Text style={styles.info}>
                Payment Status: {order.paymentStatus}
              </Text>

              <Text style={styles.total}>
                Total: ₹{order.totalAmount}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>

              <Text style={styles.info}>
                {order.shippingAddress}
              </Text>

              {order.orderStatus !== 'Cancelled' &&
                order.orderStatus !== 'Delivered' && (
                  <View style={styles.statusSection}>
                    <Text style={styles.sectionTitle}>
                      Update Order Status
                    </Text>

                    {order.orderStatus === 'Placed' && (
                      <TouchableOpacity
                        style={styles.statusButton}
                        disabled={updating === order._id}
                        onPress={() =>
                          confirmStatusChange(
                            order._id,
                            'Confirmed'
                          )
                        }
                      >
                        <Text style={styles.buttonText}>
                          CONFIRM ORDER
                        </Text>
                      </TouchableOpacity>
                    )}

                    {order.orderStatus === 'Confirmed' && (
                      <TouchableOpacity
                        style={styles.statusButton}
                        disabled={updating === order._id}
                        onPress={() =>
                          confirmStatusChange(
                            order._id,
                            'Shipped'
                          )
                        }
                      >
                        <Text style={styles.buttonText}>
                          MARK AS SHIPPED
                        </Text>
                      </TouchableOpacity>
                    )}

                    {order.orderStatus === 'Shipped' && (
                      <TouchableOpacity
                        style={styles.statusButton}
                        disabled={updating === order._id}
                        onPress={() =>
                          confirmStatusChange(
                            order._id,
                            'Delivered'
                          )
                        }
                      >
                        <Text style={styles.buttonText}>
                          MARK AS DELIVERED
                        </Text>
                      </TouchableOpacity>
                    )}

                    {updating === order._id && (
                      <ActivityIndicator
                        color="#E91E63"
                        style={{ marginTop: 10 }}
                      />
                    )}
                  </View>
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
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
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
  refresh: {
    fontSize: 28,
    color: '#E91E63',
  },
  content: {
    padding: 15,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  summaryTitle: {
    color: '#666',
    fontSize: 14,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#E91E63',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 15,
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
    fontSize: 10,
    color: '#777',
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#222',
    marginBottom: 10,
  },
  info: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productName: {
    fontWeight: '900',
    color: '#222',
  },
  price: {
    fontWeight: '900',
    color: '#222',
  },
  total: {
    fontSize: 19,
    fontWeight: '900',
    color: '#E91E63',
    marginTop: 12,
  },
  statusSection: {
    marginTop: 18,
  },
  statusButton: {
    backgroundColor: '#E91E63',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});