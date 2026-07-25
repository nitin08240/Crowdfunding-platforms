import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI is not defined in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@gmail.com';
    const password = 'AdminPassword@123';
    const secretKey = '8434';
    const name = 'Super Admin';
    const role = 'super_admin';

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log('Admin already exists');
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const secretKeyHash = await bcrypt.hash(secretKey, 12);

    await Admin.create({
      name,
      email,
      passwordHash,
      secretKeyHash,
      role,
      isActive: true,
      isDeleted: false,
      loginAttempts: 0,
    });

    console.log('✅ Admin seeded successfully!');
    console.log(`   Name:       ${name}`);
    console.log(`   Email:      ${email}`);
    console.log(`   Password:   ${password}`);
    console.log(`   Secret Key: ${secretKey}`);
    console.log(`   Role:       ${role}`);

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
