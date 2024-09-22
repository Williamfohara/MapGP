const { MongoClient } = require("mongodb");

const mongoUri = process.env.MONGO_URI; // Vercel uses environment variables from the dashboard
let client = null;
let db = null;

// Reuse the MongoDB connection across requests
async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db("testingData1"); // Your database name
  }
  return db;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({ error: "Feedback is required" });
    }

    try {
      // Connect to MongoDB
      const db = await connectToMongoDB();

      // Insert feedback into the "userFeedback" collection
      const feedbackCollection = db.collection("userFeedback");
      await feedbackCollection.insertOne({ feedback, submittedAt: new Date() });

      // Return success response
      res.status(200).json({ message: "Feedback submitted successfully" });
    } catch (error) {
      console.error("Error occurred while submitting feedback:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
