import express from 'express';
import mongoose from 'mongoose';

import authMiddleware from '../middleware/authMiddleware.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = express.Router();

// All cart routes require login
router.use(authMiddleware);

// GET USER CART
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate('items.product');

    if (!cart) {
      return res.json({
        success: true,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }

    const items = cart.items
      .filter((item) => item.product && item.product.isActive)
      .map((item) => ({
        product: item.product,
        size: item.size,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }));

    const totalAmount = items.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    const totalItems = items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    res.json({
      success: true,
      items,
      totalAmount,
      totalItems,
    });
  } catch (error) {
    console.error('Get Cart Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch cart.',
    });
  }
});

// ADD PRODUCT TO CART
router.post('/add', async (req, res) => {
  try {
    const { productId, size, quantity = 1 } = req.body;

    if (!productId || !size) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and size are required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer.',
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

    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product size.',
      });
    }

    let cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === size
    );

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock.',
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        size,
        quantity,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully.',
    });
  } catch (error) {
    console.error('Add Cart Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to add product to cart.',
    });
  }
});

// UPDATE PRODUCT QUANTITY
router.put('/update', async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (
      !productId ||
      !size ||
      !mongoose.Types.ObjectId.isValid(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID, size and quantity are required.',
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

    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product size.',
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock.',
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === size
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    item.quantity = quantity;

    await cart.save();

    res.json({
      success: true,
      message: 'Cart quantity updated successfully.',
    });
  } catch (error) {
    console.error('Update Cart Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to update cart.',
    });
  }
});

// REMOVE PRODUCT FROM CART
router.delete('/remove', async (req, res) => {
  try {
    const { productId, size } = req.body;

    if (
      !productId ||
      !size ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID and size are required.',
      });
    }

    const cart = await Cart.findOne({
      user: req.user.id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found.',
      });
    }

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.size === size
        )
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Product removed from cart successfully.',
    });
  } catch (error) {
    console.error('Remove Cart Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to remove product from cart.',
    });
  }
});

// CLEAR ENTIRE CART
router.delete('/clear', async (req, res) => {
  try {
    await Cart.findOneAndDelete({
      user: req.user.id,
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    console.error('Clear Cart Error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to clear cart.',
    });
  }
});

export default router;