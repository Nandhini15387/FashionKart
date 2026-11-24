import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';
import Address from '../models/Address.js';

const router = express.Router();

// All address routes require login
router.use(authMiddleware);

// GET ALL ADDRESSES
router.get('/', async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.id,
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch addresses.',
    });
  }
});

// ADD NEW ADDRESS
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      houseNo,
      street,
      locality,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !mobile ||
      !houseNo ||
      !street ||
      !locality ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required address fields.',
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit PIN code.',
      });
    }

    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      user: req.user.id,
      fullName,
      mobile,
      houseNo,
      street,
      locality,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully!',
      address,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to add address.',
    });
  }
});

// UPDATE ADDRESS
router.put('/:id', async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      houseNo,
      street,
      locality,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !mobile ||
      !houseNo ||
      !street ||
      !locality ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required address fields.',
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit PIN code.',
      });
    }

    if (isDefault) {
      await Address.updateMany(
        {
          user: req.user.id,
          _id: { $ne: req.params.id },
        },
        { isDefault: false }
      );
    }

    const address = await Address.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      {
        fullName,
        mobile,
        houseNo,
        street,
        locality,
        city,
        state,
        pincode,
        addressType,
        isDefault,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    res.json({
      success: true,
      message: 'Address updated successfully!',
      address,
    });

  } catch (error) {
  console.error('Update Address Error:', error);

  res.status(500).json({
    success: false,
    message: 'Unable to update address.',
    error: error.message,
  });
}
});

// DELETE ADDRESS
router.delete('/:id', async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found.',
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully!',
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to delete address.',
    });
  }
});

export default router;