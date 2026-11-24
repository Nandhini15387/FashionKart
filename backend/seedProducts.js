import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import Product from './models/Product.js';

dotenv.config();

const products = [
  {
    name: 'Casual Denim Jacket',
    brand: 'Roadster',
    description: 'Stylish casual denim jacket for everyday wear.',
    price: 1499,
    oldPrice: 2999,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    category: 'Men',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
    rating: 4.5,
    discount: 50,
    isActive: true,
  },
  {
    name: 'Elegant Summer Dress',
    brand: 'StyleCast',
    description: 'Beautiful summer dress with an elegant design.',
    price: 1199,
    oldPrice: 2499,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    category: 'Women',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stock: 50,
    rating: 4.4,
    discount: 52,
    isActive: true,
  },
  {
    name: 'Classic White Sneakers',
    brand: 'HRX',
    description: 'Comfortable and stylish everyday sneakers.',
    price: 1799,
    oldPrice: 3499,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    category: 'Men',
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 50,
    rating: 4.3,
    discount: 49,
    isActive: true,
  },
  {
    name: 'Premium Handbag',
    brand: 'Lavie',
    description: 'Premium handbag for everyday fashion.',
    price: 999,
    oldPrice: 1999,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
    category: 'Women',
    sizes: ['Free Size'],
    stock: 50,
    rating: 4.6,
    discount: 50,
    isActive: true,
  },
];

const seedProducts = async () => {
  try {
    await connectDB();

    for (const product of products) {
      await Product.findOneAndUpdate(
        { name: product.name },
        product,
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    }

    console.log('Products added to MongoDB successfully!');

    const savedProducts = await Product.find();

    console.log('Total products:', savedProducts.length);

    savedProducts.forEach((product) => {
      console.log(product.name, 'ID:', product._id);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Product seeding failed:', error);

    await mongoose.disconnect();
    process.exit(1);
  }
};

seedProducts();