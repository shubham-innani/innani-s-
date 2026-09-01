const mongoose = require('mongoose');
require('dotenv').config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    await mongoose.connection.db.collection('workers').updateMany(
      { active: { $exists: true } },
      { $rename: { "active": "isActive" } }
    );
    
    await mongoose.connection.db.collection('workers').updateMany(
      { isActive: { $exists: false } },
      { $set: { "isActive": true } }
    );
    
    console.log('Finished rename operation.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrate();
