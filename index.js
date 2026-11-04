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

// ১. গেট অল ইভেন্টস (Limit এবং Future Date ফিল্টার সহ)[cite: 4]
app.get('/events', async (req, res) => {
  try {
    const today = new Date();
    const limitCount = parseInt(req.query.limit) || 0;
    
    // শুধু ভবিষ্যতের ইভেন্টগুলো দেখাবে[cite: 4]
    let query = eventsCollection.find({ date: { $gte: today.toISOString().split('T')[0] } }).sort({ date: 1 });
    
    if (limitCount > 0) {
      query = query.limit(limitCount);
    }
    
    const events = await query.toArray();
    res.send(events);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch events' });
  }
});














app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});