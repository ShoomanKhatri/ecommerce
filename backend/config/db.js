import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Successfully connnected to mongoDB 👍`);

    // 🔥 Drop all collections (clears all data)
    // const collections = await mongoose.connection.db.collections();
    // for (let collection of collections) {
    //   try {
    //     await collection.drop();
    //     console.log(`Dropped collection: ${collection.namespace}`);
    //   } catch (error) {
    //     if (error.message === "ns not found") continue;
    //     console.error(`Error dropping ${collection.namespace}:`, error.message);
    //   }
    // }
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
