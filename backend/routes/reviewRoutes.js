import express from 'express';
import mongoose from 'mongoose';

import authMiddleware from '../middleware/authMiddleware.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

const router = express.Router();

// GET REVIEWS FOR A PRODUCT
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const reviews = await Review.find({
      product: productId,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    return res.status(200).json({
      success: true,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      reviews,
    });
  } catch (error) {
  console.error('Fetch reviews error:', error);

  res.status(500).json({
    success: false,
    message: 'Unable to fetch reviews.',
    error: error.message,
  });
}
});

// ADD A REVIEW
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    if (
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number between 1 and 5.',
      });
    }

    if (
      typeof comment !== 'string' ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a review of up to 1000 characters.',
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment: comment.trim(),
    });

    await review.populate('user', 'name');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    console.error('Add Review Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit review.',
    });
  }
});

// UPDATE YOUR REVIEW
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
    }

    if (
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a whole number between 1 and 5.',
      });
    }

    if (
      typeof comment !== 'string' ||
      !comment.trim() ||
      comment.trim().length > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a review of up to 1000 characters.',
      });
    }

    const review = await Review.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied.',
      });
    }

    review.rating = rating;
    review.comment = comment.trim();

    await review.save();
    await review.populate('user', 'name');

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review,
    });
  } catch (error) {
    console.error('Update Review Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update review.',
    });
  }
});

// DELETE YOUR REVIEW
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.',
      });
    }

    const review = await Review.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Review Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete review.',
    });
  }
});

export default router;