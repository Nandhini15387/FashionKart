import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// GET ALL ACTIVE CATEGORIES
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Get Categories Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch categories.',
    });
  }
});

// GET CATEGORY BY SLUG
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug.toLowerCase(),
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Get Category Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch category.',
    });
  }
});

export default router;