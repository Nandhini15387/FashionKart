import { useEffect, useState } from 'react';

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

import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getToken } from '../../services/api';

export default function ReviewsScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState('');

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${API_URL}/reviews/product/${id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch reviews.');
      }

      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const submitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please enter your review.');
      return;
    }

    try {
      setSubmitting(true);

      const token = await getToken();

      if (!token) {
        Alert.alert('Login Required', 'Please login to submit a review.');
        router.push('/login');
        return;
      }

      const url = editingReviewId
        ? `${API_URL}/reviews/${editingReviewId}`
        : `${API_URL}/reviews`;

      const response = await fetch(url, {
        method: editingReviewId ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(
          editingReviewId
            ? { rating, comment }
            : { productId: id, rating, comment }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit review.');
      }

      Alert.alert('Success', data.message);

      setComment('');
      setRating(5);
      setEditingReviewId('');

      fetchReviews();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const editReview = (review: any) => {
    setEditingReviewId(review._id);
    setRating(review.rating);
    setComment(review.comment);
  };

  const deleteReview = (reviewId: string) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();

              const response = await fetch(
                `${API_URL}/reviews/${reviewId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message);
              }

              Alert.alert('Success', data.message);

              fetchReviews();

            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text>Loading Reviews...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>PRODUCT REVIEWS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.summaryCard}>
          <Text style={styles.average}>
            {averageRating.toFixed(1)} ⭐
          </Text>

          <Text style={styles.total}>
            Based on {totalReviews} reviews
          </Text>
        </View>

        <View style={styles.formCard}>

          <Text style={styles.sectionTitle}>
            {editingReviewId ? 'EDIT YOUR REVIEW' : 'WRITE A REVIEW'}
          </Text>

          <Text style={styles.label}>Your Rating</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Text style={styles.star}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Write your product review..."
            placeholderTextColor="#999"
            multiline
            value={comment}
            onChangeText={setComment}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitReview}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting
                ? 'PLEASE WAIT...'
                : editingReviewId
                ? 'UPDATE REVIEW'
                : 'SUBMIT REVIEW'}
            </Text>
          </TouchableOpacity>

          {editingReviewId !== '' && (
            <TouchableOpacity
              onPress={() => {
                setEditingReviewId('');
                setComment('');
                setRating(5);
              }}
            >
              <Text style={styles.cancelEdit}>CANCEL EDIT</Text>
            </TouchableOpacity>
          )}

        </View>

        <Text style={styles.sectionTitle}>
          CUSTOMER REVIEWS ({totalReviews})
        </Text>

        {reviews.length === 0 ? (
          <Text style={styles.empty}>
            No reviews yet. Be the first to review!
          </Text>
        ) : (
          reviews.map((review) => (
            <View key={review._id} style={styles.reviewCard}>

              <Text style={styles.customerName}>
                {review.user?.name || 'Customer'}
              </Text>

              <Text style={styles.reviewRating}>
                {'⭐'.repeat(review.rating)}
              </Text>

              <Text style={styles.reviewComment}>
                {review.comment}
              </Text>

              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => editReview(review)}
                >
                  <Text style={styles.edit}>EDIT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteReview(review._id)}
                >
                  <Text style={styles.delete}>DELETE</Text>
                </TouchableOpacity>
              </View>

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

  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  back: {
    fontSize: 35,
    color: '#222',
    marginRight: 20,
  },

  heading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222',
  },

  content: {
    padding: 16,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },

  average: {
    fontSize: 32,
    fontWeight: '900',
    color: '#E91E63',
  },

  total: {
    color: '#777',
    marginTop: 8,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 10,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#222',
    marginBottom: 15,
  },

  label: {
    fontWeight: '700',
    color: '#555',
  },

  stars: {
    flexDirection: 'row',
    marginVertical: 12,
  },

  star: {
    fontSize: 32,
    marginRight: 8,
  },

  input: {
    backgroundColor: '#F5F5F5',
    minHeight: 100,
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    color: '#222',
  },

  submitButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 15,
  },

  submitText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  cancelEdit: {
    color: '#E91E63',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '800',
  },

  empty: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 30,
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },

  customerName: {
    fontWeight: '900',
    fontSize: 15,
    color: '#222',
  },

  reviewRating: {
    marginVertical: 8,
  },

  reviewComment: {
    color: '#555',
    fontSize: 14,
    lineHeight: 21,
  },

  reviewDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
  },

  actions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 25,
  },

  edit: {
    color: '#1976D2',
    fontWeight: '900',
  },

  delete: {
    color: '#E53935',
    fontWeight: '900',
  },
});