import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { API_URL } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const priceFilters = [
  { label: 'All Prices', value: 0 },
  { label: 'Under ₹1,000', value: 1000 },
  { label: 'Under ₹1,500', value: 1500 },
  { label: 'Under ₹2,000', value: 2000 },
];

const discountFilters = [
  { label: 'All Discounts', value: 0 },
  { label: '30% Off+', value: 30 },
  { label: '50% Off+', value: 50 },
];

const sortOptions = [
  { label: 'Recommended', value: 'default' },
  { label: 'Price: Low to High', value: 'low' },
  { label: 'Price: High to Low', value: 'high' },
  { label: 'Name: A to Z', value: 'name' },
];

type Product = {
  id: string;
  name: string;
  brand: string;
  price: string;
  oldPrice: string;
  priceValue: number;
  oldPriceValue: number;
  category: string;
  image: string;
  averageRating: number;
  totalReviews: number;
};

export default function HomeScreen() {
  const router = useRouter();

  const { cartCount } = useCart();

  const {
    wishlistCount,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
  } = useWishlist();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [sortBy, setSortBy] = useState('default');

  // FETCH PRODUCTS FROM MONGODB
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load products.');
      }

      const formattedProducts: Product[] = (data.products || []).map(
  (item: any) => ({
    id: item._id,
    name: item.name,
    brand: item.brand,
    price: `₹${Number(item.price).toLocaleString('en-IN')}`,
    oldPrice: `₹${Number(item.oldPrice || 0).toLocaleString('en-IN')}`,
    priceValue: Number(item.price),
    oldPriceValue: Number(item.oldPrice || 0),
    category: item.category,
    image: item.image,
    averageRating: Number(item.averageRating || 0),
    totalReviews: Number(item.totalReviews || 0),
  })
);

      setProducts(formattedProducts);
    } catch (err: any) {
      console.log('Product loading error:', err);
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchProducts();
  fetchCategories();
}, []);

  const openProduct = (productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  // FETCH CATEGORIES FROM MONGODB
const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();
    console.log('Categories received:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load categories.');
    }

    const categoryNames = (data.categories || []).map(
      (item: any) => item.name
    );

    setCategories(['All', ...categoryNames]);

  } catch (error) {
    console.log('Category loading error:', error);
  }
};

  // ADD OR REMOVE WISHLIST
  const toggleWishlist = (product: Product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
      Alert.alert('Wishlist', 'Product removed from wishlist.');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        oldPrice: product.oldPrice,
        image: product.image,
      });

      Alert.alert('Wishlist', 'Product added successfully!');
    }
  };

  // FILTER PRODUCTS
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      product.category.toLowerCase() === selectedCategory.toLowerCase();

    const discount =
      product.oldPriceValue > 0
        ? ((product.oldPriceValue - product.priceValue) /
            product.oldPriceValue) *
          100
        : 0;

    const matchesPrice =
      selectedPrice === 0 ||
      product.priceValue < selectedPrice;

    const matchesDiscount =
      selectedDiscount === 0 ||
      discount >= selectedDiscount;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesDiscount
    );
  });

  // SORT PRODUCTS
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'low') {
      return a.priceValue - b.priceValue;
    }

    if (sortBy === 'high') {
      return b.priceValue - a.priceValue;
    }

    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }

    return 0;
  });

  const resetFilters = () => {
    setSearchText('');
    setSelectedCategory('All');
    setSelectedPrice(0);
    setSelectedDiscount(0);
    setSortBy('default');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>FASHIONKART</Text>
            <Text style={styles.tagline}>STYLE THAT DEFINES YOU</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => router.push('/wishlist')}
            >
              <View>
                <Text style={styles.icon}>♡</Text>

                {wishlistCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {wishlistCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/cart')}>
              <View>
                <Text style={styles.icon}>🛍</Text>

                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            placeholder="Search products or brands"
            placeholderTextColor="#888888"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category &&
                  styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category &&
                    styles.activeCategoryText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BANNER */}
        <View style={styles.banner}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000',
            }}
            style={styles.bannerImage}
          />

          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerSmall}>
              THE BIG FASHION SALE
            </Text>

            <Text style={styles.bannerTitle}>
              UP TO 60% OFF
            </Text>

            <Text style={styles.bannerSubtitle}>
              Discover your new style
            </Text>

            <TouchableOpacity
              style={styles.shopButton}
              onPress={resetFilters}
            >
              <Text style={styles.shopButtonText}>
                SHOP NOW →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTER SECTION */}
        <View style={styles.filterSection}>
          <Text style={styles.filterHeading}>FILTER BY PRICE</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {priceFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={[
                  styles.filterChip,
                  selectedPrice === filter.value &&
                    styles.activeFilterChip,
                ]}
                onPress={() => setSelectedPrice(filter.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPrice === filter.value &&
                      styles.activeFilterChipText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterHeading}>FILTER BY DISCOUNT</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {discountFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={[
                  styles.filterChip,
                  selectedDiscount === filter.value &&
                    styles.activeFilterChip,
                ]}
                onPress={() => setSelectedDiscount(filter.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedDiscount === filter.value &&
                      styles.activeFilterChipText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterHeading}>SORT PRODUCTS</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  sortBy === option.value &&
                    styles.activeFilterChip,
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    sortBy === option.value &&
                      styles.activeFilterChipText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* PRODUCT HEADER */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {searchText ||
              selectedCategory !== 'All' ||
              selectedPrice !== 0 ||
              selectedDiscount !== 0
                ? 'FILTERED PRODUCTS'
                : 'TRENDING NOW'}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {sortedProducts.length} products found
            </Text>
          </View>

          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.viewAll}>RESET ALL</Text>
          </TouchableOpacity>
        </View>

        {/* LOADING */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E91E63" />
            <Text style={styles.loadingText}>
              Loading FashionKart products...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsTitle}>
              Unable to Load Products
            </Text>

            <Text style={styles.noResultsText}>{error}</Text>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={fetchProducts}
            >
              <Text style={styles.resetButtonText}>
                TRY AGAIN
              </Text>
            </TouchableOpacity>
          </View>
        ) : sortedProducts.length > 0 ? (
          <View style={styles.productGrid}>
            {sortedProducts.map((product) => {
              const discount =
                product.oldPriceValue > 0
                  ? Math.round(
                      ((product.oldPriceValue - product.priceValue) /
                        product.oldPriceValue) *
                        100
                    )
                  : 0;

              const liked = isWishlisted(product.id);

              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  activeOpacity={0.8}
                  onPress={() => openProduct(product.id)}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />

                  {discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        {discount}% OFF
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.wishlistButton}
                    onPress={() => toggleWishlist(product)}
                  >
                    <Text
                      style={[
                        styles.wishlistIcon,
                        liked && styles.likedIcon,
                      ]}
                    >
                      {liked ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.productInfo}>
                    <Text style={styles.brandName}>
                      {product.brand}
                    </Text>

                    <Text style={styles.productName}>
                      {product.name}
                    </Text>

                    <View style={styles.ratingContainer}>
  {product.totalReviews > 0 ? (
    <>
      <Text style={styles.ratingStar}>★</Text>

      <Text style={styles.ratingText}>
        {product.averageRating.toFixed(1)}
      </Text>

      <Text style={styles.reviewCount}>
        ({product.totalReviews}{' '}
        {product.totalReviews === 1 ? 'review' : 'reviews'})
      </Text>
    </>
  ) : (
    <Text style={styles.noRatingText}>
      No reviews yet
    </Text>
  )}
</View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.price}>
                        {product.price}
                      </Text>

                      <Text style={styles.oldPrice}>
                        {product.oldPrice}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>

            <Text style={styles.noResultsTitle}>
              No Products Found
            </Text>

            <Text style={styles.noResultsText}>
              Try changing your search, price range or discount filter.
            </Text>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>
                RESET ALL FILTERS
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FASHIONKART</Text>

          <Text style={styles.footerSubtext}>
            Fashion is what you buy. Style is what you do with it.
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.activeNavIcon}>⌂</Text>
          <Text style={styles.activeNavText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setSearchText('');
            setSelectedCategory('All');
          }}
        >
          <Text style={styles.navIcon}>▦</Text>
          <Text style={styles.navText}>Categories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/wishlist')}
        >
          <Text style={styles.navIcon}>♥</Text>
          <Text style={styles.navText}>Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/account')}
        >
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  logo: {
    fontSize: 23,
    fontWeight: '900',
    color: '#E91E63',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#555555',
    marginTop: 3,
  },
  headerIcons: { flexDirection: 'row', gap: 20 },
  icon: { fontSize: 27, color: '#222222' },
  cartBadge: {
    position: 'absolute',
    top: -7,
    right: -9,
    backgroundColor: '#E91E63',
    width: 19,
    height: 19,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: {
    fontSize: 25,
    color: '#777777',
    marginRight: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#222222' },
  clearSearch: {
    fontSize: 17,
    color: '#777777',
    paddingHorizontal: 8,
  },
  categoryContainer: {
    marginTop: 18,
    marginBottom: 18,
    paddingLeft: 12,
  },
  categoryButton: {
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 23,
    paddingVertical: 11,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeCategoryButton: { backgroundColor: '#E91E63' },
  categoryText: {
    color: '#D81B60',
    fontSize: 13,
    fontWeight: '700',
  },
  activeCategoryText: { color: '#FFFFFF' },
  banner: {
    height: 230,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333333',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  bannerSmall: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  bannerSubtitle: { color: '#FFFFFF', fontSize: 14, marginTop: 5 },
  shopButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 5,
    marginTop: 17,
  },
  shopButtonText: {
    color: '#E91E63',
    fontSize: 12,
    fontWeight: '900',
  },
  filterSection: { marginTop: 25, paddingHorizontal: 16 },
  filterHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#222222',
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  filterChip: {
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 9,
    marginBottom: 5,
  },
  activeFilterChip: { backgroundColor: '#E91E63' },
  filterChipText: {
    fontSize: 11,
    color: '#555555',
    fontWeight: '700',
  },
  activeFilterChipText: { color: '#FFFFFF' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 28,
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#222222',
    letterSpacing: 1,
  },
  sectionSubtitle: { color: '#888888', fontSize: 12, marginTop: 4 },
  viewAll: { color: '#E91E63', fontSize: 11, fontWeight: '800' },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  productCard: {
    width: '48%',
    marginBottom: 22,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 190,
    borderRadius: 7,
    backgroundColor: '#F3F3F3',
  },
  discountBadge: {
    position: 'absolute',
    top: 9,
    left: 8,
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  wishlistButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistIcon: { fontSize: 21, color: '#333333' },
  likedIcon: { color: '#E91E63' },
  productInfo: { padding: 8 },
  brandName: { fontSize: 14, fontWeight: '800', color: '#222222' },
  productName: { fontSize: 11, color: '#777777', marginTop: 4 },
  ratingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 6,
},

ratingStar: {
  color: '#F5A623',
  fontSize: 14,
  marginRight: 4,
},

ratingText: {
  fontSize: 11,
  fontWeight: '800',
  color: '#333333',
},

reviewCount: {
  fontSize: 10,
  color: '#888888',
  marginLeft: 4,
},

noRatingText: {
  fontSize: 10,
  color: '#999999',
},
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  price: { fontSize: 13, fontWeight: '900', color: '#222222' },
  oldPrice: {
    fontSize: 10,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  noResults: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 55,
  },
  noResultsIcon: { fontSize: 50 },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222222',
    marginTop: 15,
  },
  noResultsText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  resetButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 6,
    marginTop: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 55,
  },
  loadingText: {
    color: '#888888',
    fontSize: 13,
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF0F5',
    marginTop: 10,
  },
  footerText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E91E63',
    letterSpacing: 2,
  },
  footerSubtext: { fontSize: 10, color: '#777777', marginTop: 8 },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: { fontSize: 23, color: '#777777' },
  activeNavIcon: { fontSize: 24, color: '#E91E63' },
  navText: { fontSize: 10, color: '#777777', marginTop: 3 },
  activeNavText: {
    fontSize: 10,
    color: '#E91E63',
    fontWeight: '800',
    marginTop: 3,
  },
});