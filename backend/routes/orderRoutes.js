import express from 'express';

import mongoose from 'mongoose';

import Address from '../models/Address.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// PLACE NEW ORDER
router.post('/place', async (req, res) => {
  try {
    const { addressId } = req.body;

    // Validate address ID
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID.',
      });
    }

    // Find customer's saved address
    const address = await Address.findOne({
      _id: addressId,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found.',
      });
    }

    // Find customer's cart
    const cart = await Cart.findOne({
      user: req.user.id,
    }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty.',
      });
    }

    let totalAmount = 0;

    const orderItems = [];

    // Prepare order items
    for (const item of cart.items) {
      const product = item.product;

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is unavailable.',
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock or has insufficient stock.`,
        });
      }

      const itemTotal = product.price * item.quantity;

      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
      });
    }

    // Format delivery address
    const shippingAddress = [
      address.fullName,
      address.mobile,
      address.houseNo,
      address.street,
      address.locality,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean).join(', ');

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Placed',
    });

    // Clear cart after successful order
    await Cart.findOneAndDelete({
      user: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });

  } catch (error) {
    console.error('Place Order Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to place order.',
    });
  }
});
// GET ALL ORDERS FOR LOGGED-IN USER
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error('Fetch Orders Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch orders.',
    });
  }
});

// CANCEL ORDER
router.put('/cancel/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (['Shipped', 'Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'This order cannot be cancelled.',
      });
    }

    order.orderStatus = 'Cancelled';

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      order,
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to cancel order.',
    });
  }
});

export default router;