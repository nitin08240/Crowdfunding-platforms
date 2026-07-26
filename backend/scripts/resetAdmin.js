/**
 * Reset Admin Script — Deletes existing admin and re-creates with known credentials
 * Run: node scripts/resetAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = 'AdminPassword@123';
const ADMIN_SECRET   = '8434';
const ADMIN_NAME     = 'Super Admin';

const AdminSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  passwordHash:  { type: String, required: true },
  secretKeyHash: { type: String, required: true },
  role:          { type: String, default: 'super_admin' },
  isActive:      { type: Boolean, default: true },
  isDeleted:     { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
  lastLoginAt:   { type: Date },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function resetAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Delete any existing admin with this email
    const deleted = await Admin.deleteMany({ email: ADMIN_EMAIL.toLowerCase() });
    if (deleted.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleted.deletedCount} existing admin record(s)`);
    } else {
      console.log('ℹ️  No existing admin found — creating fresh');
    }

    // Hash new credentials
    const passwordHash  = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const secretKeyHash = await bcrypt.hash(ADMIN_SECRET, 12);

    // Create fresh admin
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

    console.log('\n✅ Admin RESET successfully!\n');
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│ Email     : ${ADMIN_EMAIL.padEnd(27)}│`);
    console.log(`│ Password  : ${ADMIN_PASSWORD.padEnd(27)}│`);
    console.log(`│ Secret Key: ${ADMIN_SECRET.padEnd(27)}│`);
    console.log(`│ Role      : super_admin                 │`);
    console.log('└─────────────────────────────────────────┘\n');
    console.log('👉 Now login at: <your-site>/admin/login\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdmin();
