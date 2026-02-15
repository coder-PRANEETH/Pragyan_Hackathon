require('dns').setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const uri = "mongodb+srv://danieljoshva786_db_user:f5S6vadh3dPdaYjm@cluster0.mrnqzkk.mongodb.net/?appName=Cluster0";

const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (er){
    console.log("rror connecting to MongoDB:", er);
  } finally {
    await mongoose.connection.close();
  }
}
run().catch(console.dir);
