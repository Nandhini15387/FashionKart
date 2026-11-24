import express from 'express';
import mongoose from 'mongoose';

import authMiddleware from '../middleware/authMiddleware.js';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';

const router = express.Router();

// Protect all wishlist routes
router.use(authMiddleware);

// GET USER WISHLIST
router.get('/', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    }).populate('products');

    res.status(200).json({
      success: true,
      wishlist: wishlist ? wishlist.products : [],
      count: wishlist ? wishlist.products.length : 0,
    });
  } catch (error) {
    console.error('Get Wishlist Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch wishlist.',
    });
  }
});

// ADD PRODUCT TO WISHLIST
router.post('/add', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required.',
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    let wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        products: [],
      });
    }

    const alreadyExists = wishlist.products.some(
      (id) => id.toString() === productId
    );

    if (!alreadyExists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    wishlist = await Wishlist.findOne({
      user: req.user.id,
    }).populate('products');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist.',
      wishlist: wishlist.products,
    });
  } catch (error) {
    console.error('Add Wishlist Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to add product to wishlist.',
    });
  }
});

// REMOVE PRODUCT FROM WISHLIST
router.delete('/remove', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID is required.',
      });
    }

    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found.',
      });
    }

    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist.',
    });
  } catch (error) {
    console.error('Remove Wishlist Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to remove product from wishlist.',
    });
  }
});

// CLEAR WISHLIST
router.delete('/clear', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      user: req.user.id,
    });

    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully.',
    });
  } catch (error) {
    console.error('Clear Wishlist Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to clear wishlist.',
    });
  }
});

export default router;