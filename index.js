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

// ২. নতুন ইভেন্ট ক্রিয়েট করা[cite: 2, 4]
app.post('/events', async (req, res) => {
  try {
    const newEvent = req.body;
    const result = await eventsCollection.insertOne(newEvent);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to create event' });
  }
});

// ৩. নির্দিষ্ট ইভেন্টের ডিটেইলস আনা[cite: 5]
app.get('/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).send({ error: 'Event not found' });
    }
    res.send(event);
  } catch (error) {
    res.status(400).send({ error: 'Invalid ID format' });
  }
});

// ৪. ইভেন্টে জয়েন করা[cite: 5]
app.post('/join-event', async (req, res) => {
  try {
    const { eventId, userEmail } = req.body;
    const existingJoin = await joinedEventsCollection.findOne({ eventId, userEmail });
    
    if (existingJoin) {
      return res.status(400).send({ message: 'You have already joined this event!' });
    }
    
    const result = await joinedEventsCollection.insertOne({ eventId, userEmail });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to join event' });
  }
});

// ৫. ইউজারের জয়েন করা ইভেন্টগুলো দেখা (তারিখ অনুযায়ী সর্ট করা)[cite: 6]
app.get('/joined-events/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const joinedList = await joinedEventsCollection.find({ userEmail: email }).toArray();
    
    // ইভেন্ট আইডিগুলো সংগ্রহ করা
    const eventIds = joinedList.map(item => new ObjectId(item.eventId));
    const events = await eventsCollection.find({ _id: { $in: eventIds } }).sort({ date: 1 }).toArray();
    
    res.send(events);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch joined events' });
  }
});

// ৬. ইউজারের নিজের ক্রিয়েট করা ইভেন্টগুলো দেখা (Manage Events)[cite: 6]
app.get('/my-events/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const events = await eventsCollection.find({ createdBy: email }).toArray();
    res.send(events);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch user events' });
  }
});

// ৭. ইভেন্ট আপডেট করা[cite: 6]
app.put('/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    delete updatedData._id; // _id ফিল্ড আপডেট করা যাবে না

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to update event' });
  }
});

// ৮. ইভেন্ট ডিলিট করা[cite: 6]
app.delete('/events/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    await joinedEventsCollection.deleteMany({ eventId: id }); // রিলেটেড জয়েন ডাটা ডিলিট করা
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete event' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});