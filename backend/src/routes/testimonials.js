const express = require('express');
const Testimonial = require('../models/Testimonial');

const router = express.Router();

// GET /api/testimonials — public endpoint for landing page
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isVisible: true })
      .select('name role text rating avatar')
      .sort({ order: 1, createdAt: -1 })
      .limit(20);

    res.json({ testimonials });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
