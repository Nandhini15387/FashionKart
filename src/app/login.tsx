import { useRouter } from 'expo-router';
import { useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, saveToken } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Login Failed',
          data.message || 'Invalid email or password.',
        );
        return;
      }

      if (!data.token) {
        Alert.alert('Error', 'Login token was not received.');
        return;
      }

      await saveToken(data.token);

      Alert.alert(
        'Login Successful',
        `Welcome back, ${data.user.name}!`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/'),
          },
        ],
      );

    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Unable to connect to FashionKart server. Please check your internet connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backText}>← Back to Home</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logo}>FASHIONKART</Text>
            <Text style={styles.tagline}>STYLE THAT DEFINES YOU</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.heading}>Welcome Back!</Text>

            <Text style={styles.subtitle}>
              Login to continue shopping with FashionKart.
            </Text>

            <Text style={styles.label}>Email Address</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPassword}>
                  {showPassword ? 'HIDE' : 'SHOW'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                Alert.alert(
                  'Forgot Password',
                  'Password recovery will be available in a future update.',
                )
              }
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/register')}
              >
                <Text style={styles.registerLink}> Register</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footer}>
            © 2026 FashionKart. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 25,
  },

  backButton: {
    marginTop: 15,
  },

  backText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 55,
    marginBottom: 45,
  },

  logo: {
    fontSize: 30,
    fontWeight: '900',
    color: '#E91E63',
    letterSpacing: 2,
  },

  tagline: {
    fontSize: 10,
    color: '#777',
    letterSpacing: 3,
    marginTop: 7,
  },

  formContainer: {
    width: '100%',
  },

  heading: {
    fontSize: 29,
    fontWeight: '800',
    color: '#222',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 9,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 9,
    marginTop: 18,
  },

  input: {
    height: 53,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#222',
  },

  passwordContainer: {
    height: 53,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#222',
  },

  showPassword: {
    color: '#E91E63',
    fontSize: 12,
    fontWeight: '800',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },

  forgotText: {
    color: '#E91E63',
    fontSize: 13,
    fontWeight: '600',
  },

  loginButton: {
    height: 54,
    backgroundColor: '#E91E63',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 27,
  },

  registerText: {
    fontSize: 14,
    color: '#777',
  },

  registerLink: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 11,
    marginTop: 55,
  },
});