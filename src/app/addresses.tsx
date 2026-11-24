import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getToken } from '../services/api';

type Address = {
  _id: string;
  fullName: string;
  mobile: string;
  houseNo: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'Home' | 'Work' | 'Other';
  isDefault: boolean;
};

const emptyForm = {
  fullName: '',
  mobile: '',
  houseNo: '',
  street: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  addressType: 'Home' as 'Home' | 'Work' | 'Other',
  isDefault: false,
};

export default function AddressesScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Login Required', 'Please log in to manage addresses.');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load addresses.');
      }

      setAddresses(data.addresses || []);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load addresses.'
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const updateField = (key: string, value: string | boolean) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (address: Address) => {
    setForm({
      fullName: address.fullName,
      mobile: address.mobile,
      houseNo: address.houseNo,
      street: address.street,
      locality: address.locality,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      addressType: address.addressType,
      isDefault: address.isDefault,
    });

    setEditingId(address._id);
    setShowForm(true);
  };

  const saveAddress = async () => {
    if (
      !form.fullName.trim() ||
      !form.mobile.trim() ||
      !form.houseNo.trim() ||
      !form.street.trim() ||
      !form.locality.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      Alert.alert('Missing Details', 'Please fill in all address fields.');
      return;
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      Alert.alert('Invalid Mobile', 'Enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      Alert.alert('Invalid PIN Code', 'Enter a valid 6-digit PIN code.');
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      if (!token) {
        Alert.alert('Login Required', 'Please log in again.');
        router.replace('/login');
        return;
      }

      const url = editingId
        ? `${API_URL}/addresses/${editingId}`
        : `${API_URL}/addresses`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save address.');
      }

      Alert.alert('Success', data.message);

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchAddresses();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to save address.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();

              const response = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || 'Unable to delete address.');
              }

              Alert.alert('Success', data.message);
              await fetchAddresses();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete address.'
              );
            }
          },
        },
      ]
    );
  };

  const renderInput = (
    label: string,
    key: keyof typeof emptyForm,
    placeholder: string,
    keyboardType: 'default' | 'phone-pad' | 'number-pad' = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={String(form[key])}
        keyboardType={keyboardType}
        onChangeText={(value) => updateField(key, value)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Saved Addresses</Text>

        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {!showForm && (
            <>
              <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
                <Text style={styles.addButtonText}>＋ ADD NEW ADDRESS</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>
                YOUR ADDRESSES ({addresses.length})
              </Text>

              {addresses.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>📍</Text>
                  <Text style={styles.emptyTitle}>No saved addresses</Text>
                  <Text style={styles.emptyText}>
                    Add an address for faster checkout.
                  </Text>
                </View>
              ) : (
                addresses.map((address) => (
                  <View key={address._id} style={styles.addressCard}>
                    <View style={styles.addressTop}>
                      <Text style={styles.addressName}>{address.fullName}</Text>

                      <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>
                          {address.addressType}
                        </Text>
                      </View>
                    </View>

                    {address.isDefault && (
                      <Text style={styles.defaultText}>DEFAULT ADDRESS</Text>
                    )}

                    <Text style={styles.addressText}>
                      {address.houseNo}, {address.street},{'\n'}
                      {address.locality}, {address.city},{'\n'}
                      {address.state} - {address.pincode}
                    </Text>

                    <Text style={styles.mobileText}>
                      Mobile: {address.mobile}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEditForm(address)}
                      >
                        <Text style={styles.editText}>EDIT</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteAddress(address._id)}
                      >
                        <Text style={styles.deleteText}>DELETE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit Address' : 'Add New Address'}
              </Text>

              {renderInput('Full Name', 'fullName', 'Enter full name')}
              {renderInput('Mobile Number', 'mobile', '10-digit mobile number', 'phone-pad')}
              {renderInput('House / Flat Number', 'houseNo', 'Enter house number')}
              {renderInput('Street / Road', 'street', 'Enter street')}
              {renderInput('Locality / Area', 'locality', 'Enter locality')}
              {renderInput('City', 'city', 'Enter city')}
              {renderInput('State', 'state', 'Enter state')}
              {renderInput('PIN Code', 'pincode', '6-digit PIN code', 'number-pad')}

              <Text style={styles.label}>Address Type</Text>

              <View style={styles.typeRow}>
                {(['Home', 'Work', 'Other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      form.addressType === type && styles.selectedType,
                    ]}
                    onPress={() => updateField('addressType', type)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        form.addressType === type && styles.selectedTypeText,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.defaultOption}
                onPress={() => updateField('isDefault', !form.isDefault)}
              >
                <Text style={styles.checkbox}>
                  {form.isDefault ? '☑' : '☐'}
                </Text>
                <Text style={styles.defaultOptionText}>
                  Set as default address
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAddress}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 36,
    color: '#222',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  addButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e91e63',
    borderStyle: 'dashed',
    padding: 17,
    alignItems: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#e91e63',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#777',
    marginTop: 25,
    marginBottom: 12,
  },
  emptyBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#222',
  },
  emptyText: {
    color: '#888',
    marginTop: 7,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  addressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  typeBadge: {
    backgroundColor: '#fce4ec',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  typeText: {
    color: '#e91e63',
    fontWeight: 'bold',
    fontSize: 12,
  },
  defaultText: {
    color: '#16a36a',
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 12,
  },
  addressText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 23,
    marginTop: 12,
  },
  mobileText: {
    color: '#333',
    fontSize: 13,
    marginTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 16,
    paddingTop: 12,
    gap: 25,
  },
  editButton: {
    paddingVertical: 7,
  },
  editText: {
    color: '#e91e63',
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingVertical: 7,
  },
  deleteText: {
    color: '#777',
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 17,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fff',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  selectedType: {
    borderColor: '#e91e63',
    backgroundColor: '#fce4ec',
  },
  typeOptionText: {
    color: '#555',
    fontWeight: '600',
  },
  selectedTypeText: {
    color: '#e91e63',
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    fontSize: 22,
    color: '#e91e63',
  },
  defaultOptionText: {
    color: '#444',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#e91e63',
    padding: 16,
    borderRadius: 7,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelText: {
    color: '#777',
    fontWeight: 'bold',
  },
});