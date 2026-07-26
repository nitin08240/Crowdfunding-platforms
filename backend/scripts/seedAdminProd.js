/**
 * Production Admin Seed Script
 * Run with: node scripts/seedAdminProd.js
 * 
 * Set MONGO_URI env variable before running:
 * MONGO_URI=mongodb+srv://... node scripts/seedAdminProd.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword@123';
const ADMIN_SECRET   = process.env.SEED_ADMIN_SECRET   || '8434';
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Super Admin';

const AdminSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, required: true },
  secretKeyHash: { type: String, required: true },
  role:          { type: String, default: 'super_admin' },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set. Export it before running this script.');
    console.error('   Example: MONGO_URI=mongodb+srv://... node scripts/seedAdminProd.js');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log('⚠️  Admin already exists in database.');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role:  ${existing.role}`);
      console.log('   Use these credentials to login.\n');
      await mongoose.disconnect();
      return;
    }

    const passwordHash  = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const secretKeyHash = await bcrypt.hash(ADMIN_SECRET, 12);

    await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      secretKeyHash,
      role: 'super_admin',
      isActive: true,
      isDeleted: false,
      loginAttempts: 0,
    });

    console.log('\n✅ Admin seeded successfully!\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│ Email     : ${ADMIN_EMAIL.padEnd(27)}│`);
    console.log(`│ Password  : ${ADMIN_PASSWORD.padEnd(27)}│`);
    console.log(`│ Secret Key: ${ADMIN_SECRET.padEnd(27)}│`);
    console.log(`│ Role      : super_admin                 │`);
    console.log('└─────────────────────────────────────────┘\n');
    console.log('👉 Login at: <your-site>/admin/login\n');

  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
