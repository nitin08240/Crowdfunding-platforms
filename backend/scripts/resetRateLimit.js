const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // List all collections to find correct name
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  // Try both possible names
  for (const name of ['admins', 'Admin', 'admin']) {
    try {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`Collection "${name}": ${count} docs`);
      if (count > 0) {
        const docs = await mongoose.connection.db.collection(name).find({}).toArray();
        console.log('Admin docs:', JSON.stringify(docs.map(d => ({ email: d.email, role: d.role, loginAttempts: d.loginAttempts, isActive: d.isActive })), null, 2));
        
        const result = await mongoose.connection.db.collection(name).updateMany(
          {},
          { $set: { loginAttempts: 0, isActive: true } }
        );
        console.log('Updated:', result.modifiedCount);
      }
    } catch (e) {
      console.log(`"${name}" - error:`, e.message);
    }
  }
  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
