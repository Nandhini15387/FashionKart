import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Category from './models/Category.js';

dotenv.config();

const categories = [
  {
    name: 'Men',
    slug: 'men',
    isActive: true,
  },
  {
    name: 'Women',
    slug: 'women',
    isActive: true,
  },
  {
    name: 'Kids',
    slug: 'kids',
    isActive: true,
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    isActive: true,
  },
  {
    name: 'Home',
    slug: 'home',
    isActive: true,
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    for (const category of categories) {
      await Category.findOneAndUpdate(
        { slug: category.slug },
        { $set: category },
        { upsert: true, new: true }
      );
    }

    console.log('Five categories added successfully!');

    const allCategories = await Category.find();

    console.log('Total categories:', allCategories.length);

    process.exit(0);
  } catch (error) {
    console.error('Category Seeding Error:', error.message);
    process.exit(1);
  }
};

seedCategories();