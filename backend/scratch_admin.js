const mongoose = require('mongoose');

async function makeAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/crowdfunding');
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { role: 'admin' } }
    );
    console.log(`Successfully upgraded ${result.modifiedCount} user(s) to admin!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

makeAdmin();
