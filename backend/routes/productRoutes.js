import express from 'express';
import mongoose from 'mongoose';

import Product from '../models/Product.js';
import Review from '../models/Review.js';

const router = express.Router();

// ADD REVIEW RATINGS AND COUNTS
const addReviewStats = async (products) => {
  const productIds = products.map((product) => product._id);

  const reviewStats = await Review.aggregate([
    {
      $match: {
        product: { $in: productIds },
      },
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};

  reviewStats.forEach((item) => {
    statsMap[item._id.toString()] = {
      averageRating: Number(item.averageRating.toFixed(1)),
      totalReviews: item.totalReviews,
    };
  });

  return products.map((product) => ({
    ...product.toObject(),

    averageRating:
      statsMap[product._id.toString()]?.averageRating || 0,

    totalReviews:
      statsMap[product._id.toString()]?.totalReviews || 0,
  }));
};

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });

    const updatedProducts = await addReviewStats(products);

    res.json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error('Fetch products error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch products.',
    });
  }
});

// GET PRODUCTS BY CATEGORY
router.get('/category/:categoryName', async (req, res) => {
  try {
    const products = await Product.find({
      category: {
        $regex: `^${req.params.categoryName}$`,
        $options: 'i',
      },
      isActive: true,
    });

    const updatedProducts = await addReviewStats(products);

    res.json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error('Fetch category products error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch category products.',
    });
  }
});

// GET PRODUCT BY ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const updatedProducts = await addReviewStats([product]);

    res.json({
      success: true,
      product: updatedProducts[0],
    });
  } catch (error) {
    console.error('Fetch product error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch product.',
    });
  }
});

export default router;