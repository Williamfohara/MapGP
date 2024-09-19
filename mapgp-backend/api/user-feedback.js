const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize MongoDB client
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db; // To store the database connection

// Connect to MongoDB function
async function connectToMongoDB() {
  if (!db) {
    console.log("Connecting to MongoDB...");
    await client.connect();
    db = client.db("testingData1"); // Replace with your actual database name
  }
}

// Feedback route
app.post("/api/submit-feedback", async (req, res) => {
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).send({ error: "Feedback is required" });
  }

  try {
    // Ensure MongoDB is connected
    await connectToMongoDB();

    // Insert feedback into the userFeedback collection
    const collection = db.collection("userFeedback");
    const result = await collection.insertOne({ feedback, date: new Date() });

    console.log("Feedback stored in MongoDB:", result.insertedId); // Log the inserted feedback ID

    res.status(200).send({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error storing feedback:", error);
    res.status(500).send({ error: "Error storing feedback" });
  }
});
