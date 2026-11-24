import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://192.168.32.190:5000/api';

export const saveToken = async (token: string) => {
  await AsyncStorage.setItem('fashionkart_token', token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem('fashionkart_token');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('fashionkart_token');
};