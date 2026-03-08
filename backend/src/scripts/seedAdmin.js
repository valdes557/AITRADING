require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@aitradingsignals.com';
const ADMIN_PASSWORD = 'Admin@2024!';
const ADMIN_NAME = 'Administrator';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      // Ensure admin role
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log('Existing user promoted to admin');
      } else {
        console.log('Admin account already exists');
      }
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        plan: 'vip',
      });
      console.log('Admin account created successfully');
    }

    console.log('-----------------------------------');
    console.log('Admin Login Credentials:');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('-----------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedAdmin();
