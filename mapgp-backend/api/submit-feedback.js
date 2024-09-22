const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

let db;

async function connectToMongoDB() {
  if (!db) {
    await client.connect();
    db = client.db("testingData1"); // Connect to the "testingData1" database
  }
}

module.exports = async (req, res) => {
  // Handle CORS Preflight Request
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co"); // Allow requests from this origin
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end(); // Respond with a 200 status for preflight checks
    return;
  }

  // Handle POST request
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await connectToMongoDB();

  const { feedback } = req.body;

  // Validate that feedback is provided
  if (!feedback) {
    return res.status(400).json({ error: "Feedback is required" });
  }

  try {
    // Insert feedback into the "userFeedback" collection
    const feedbackCollection = db.collection("userFeedback");
    await feedbackCollection.insertOne({ feedback, submittedAt: new Date() });

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co"); // Allow requests from your domain
    res.setHeader("Access-Control-Allow-Credentials", "true");

    return res.status(200).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error occurred while submitting feedback:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
