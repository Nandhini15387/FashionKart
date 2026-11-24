import express from 'express';
import mongoose from 'mongoose';

import Order from '../models/Order.js';

import adminMiddleware from '../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// GET ALL CUSTOMER ORDERS
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error) {
    console.error('Admin Fetch Orders Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch customer orders.',
    });
  }
});

// UPDATE ORDER STATUS
router.put('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID.',
      });
    }

    const allowedStatuses = [
      'Placed',
      'Confirmed',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status.',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be updated.',
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      order,
    });

  } catch (error) {
    console.error('Admin Update Order Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update order status.',
    });
  }
});

export default router;