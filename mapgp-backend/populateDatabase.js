const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Read events from events.json
const initialEvents = JSON.parse(fs.readFileSync("events.json", "utf-8"));

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatEventDetails(details) {
  // Convert ### headers to <strong> tags
  details = details.replace(/### (.*?)\n/g, "<strong>$1</strong><br>");

  // Convert **bold** to <strong> and *italic* to <em>
  details = details.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  details = details.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Remove any # characters
  details = details.replace(/#/g, "");

  return details;
}

async function generateEventDetails(country1, country2, eventHeadline) {
  const prompt = `Give me an in-depth geopolitical explanation of the ${eventHeadline} and how it affected the relationship between ${country1} and ${country2}.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1300,
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const eventDetails = response.data.choices[0].message.content.trim();
    return formatEventDetails(eventDetails);
  } catch (error) {
    console.error("Error generating event details:", error);
    return null;
  }
}

async function populateDatabase() {
  const db = client.db("mapgpTesting1");
  const collection = db.collection("testingData");

  for (const event of initialEvents) {
    const eventDetails = await generateEventDetails(
      event.country1,
      event.country2,
      event.eventHeadline
    );

    if (eventDetails) {
      await collection.insertOne({
        country1: event.country1,
        country2: event.country2,
        eventHeadline: event.eventHeadline,
        eventDetails: eventDetails,
      });
      console.log(`Inserted event: ${event.eventHeadline}`);
    } else {
      console.log(
        `Failed to generate details for event: ${event.eventHeadline}`
      );
    }
  }

  console.log("Database populated with initial events");
}

async function retrieveData() {
  const db = client.db("mapgpTesting1");
  const collection = db.collection("testingData");

  const events = await collection.find({}).toArray();
  console.log("Retrieved events:", events);
}

connectToMongoDB()
  .then(async () => {
    await populateDatabase();
    await retrieveData();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  })
  .finally(async () => {
    await client.close();
    console.log("Disconnected from MongoDB");
  });
