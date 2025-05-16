import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import userModel from './models/userModel';

dotenv.config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: 'ahmedharby138@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const admin = new userModel({
      name: 'Ahmed Harby',
      email: 'ahmedharby138@gmail.com',
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully');

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error: any) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();