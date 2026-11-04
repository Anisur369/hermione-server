import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.BETTER_AUTH_DB_URL);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// কানেকশন এবং ডাটাবেস ইনিশিয়ালাইজেশন
await connectToMongoDB();
const db = client.db("hermioneDB");
const eventsCollection = db.collection("events");
const joinedEventsCollection = db.collection("joinedEvents");

app.get('/', (req, res) => {
  res.send('Hello World! this is a hello');
});







app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});