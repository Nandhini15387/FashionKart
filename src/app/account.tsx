import { useRouter } from 'expo-router';
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

import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getToken, removeToken } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
};

export default function AccountScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { icon: '📦', title: 'My Orders', route: '/orders' },
    { icon: '🛠️', title: 'Admin Orders', route: '/admin-orders' },
    { icon: '❤️', title: 'My Wishlist', route: '/wishlist' },
    { icon: '🛍️', title: 'Shopping Bag', route: '/cart' },
    {
  icon: '📍',
  title: 'Saved Addresses',
  route: '/addresses',
},
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        await removeToken();
        setUser(null);
        return;
      }

      setUser(data.user);

    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Unable to load your profile. Please check your connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            setUser(null);

            Alert.alert(
              'Logged Out',
              'You have successfully logged out.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/login'),
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.back}>← Back to Home</Text>
          </TouchableOpacity>

          <Text style={styles.title}>My Account</Text>

          <Text style={styles.subtitle}>
            Welcome to FashionKart!
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.loadingText}>
              Loading your profile...
            </Text>
          </View>
        ) : user ? (
          <View style={styles.loginCard}>
            <Text style={styles.welcome}>
              Hello, {user.name}! 👋
            </Text>

            <Text style={styles.description}>
              Welcome back to FashionKart. Happy shopping!
            </Text>

            <View style={styles.profileDetails}>
              <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.detailValue}>{user.email}</Text>

              <Text style={styles.detailLabel}>MOBILE NUMBER</Text>
              <Text style={styles.detailValue}>{user.mobile}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>
                LOGOUT
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={styles.welcome}>
              Hello, Fashion Lover! 👋
            </Text>

            <Text style={styles.description}>
              Login or create an account to enjoy your shopping experience.
            </Text>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerButtonText}>
                CREATE AN ACCOUNT
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>MY ACTIVITY</Text>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.menuItem,
                index !== menuItems.length - 1 && styles.border,
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>
          FashionKart – Style That Defines You
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },

  header: {
    backgroundColor: '#FFFFFF',
    padding: 22,
  },

  back: {
    fontSize: 14,
    color: '#555555',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#222222',
    marginTop: 25,
  },

  subtitle: {
    color: '#777777',
    marginTop: 6,
    fontSize: 14,
  },

  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    color: '#777777',
    marginTop: 12,
  },

  loginCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },

  welcome: {
    fontSize: 19,
    fontWeight: '800',
    color: '#222222',
  },

  description: {
    fontSize: 13,
    color: '#777777',
    lineHeight: 20,
    marginTop: 10,
  },

  profileDetails: {
    backgroundColor: '#FFF5F8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E91E63',
    marginTop: 8,
  },

  detailValue: {
    fontSize: 14,
    color: '#333333',
    marginTop: 5,
    marginBottom: 8,
  },

  loginButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 22,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  registerButton: {
    borderWidth: 1,
    borderColor: '#E91E63',
    padding: 14,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 12,
  },

  registerButtonText: {
    color: '#E91E63',
    fontWeight: '800',
  },

  logoutButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 22,
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#777777',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 12,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },

  border: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  menuIcon: {
    fontSize: 21,
    width: 42,
  },

  menuTitle: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
  },

  arrow: {
    fontSize: 25,
    color: '#999999',
  },

  footer: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 12,
    marginVertical: 35,
  },
});