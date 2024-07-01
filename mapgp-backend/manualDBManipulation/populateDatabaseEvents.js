const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming populateDatabase.js is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Read events from events file and choose which country pair you want to generate
const initialEvents = JSON.parse(
  fs.readFileSync("../data/events/MEXUSAEvents.json", "utf-8")
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatEventDetails(details) {
  // Remove unwanted external link markers
  details = details.replace(/USTYPE="external_link">/g, "");

  // Convert markdown-like headers to <strong> tags
  details = details.replace(/(#+)\s*(.*?)\n/g, function (match, hashes, text) {
    return "<strong>" + text.trim() + "</strong><br>";
  });

  // Remove any remaining '#' characters from the text
  details = details.replace(/#/g, "");

  // Convert **bold** to <strong> and *italic* to <em>
  details = details.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  details = details.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Bold single-digit numbers followed by a period and remove the period
  details = details.replace(/(\b\d)\.(?=\s|$)/g, "<strong>$1</strong>");

  // Bold numbers only if they are single digits and not already bolded, and not followed by a comma
  details = details.replace(/(\b\d\b)(?!<\/strong>|,)/g, "<strong>$1</strong>");

  // Normalize line breaks: convert any mix of <br> with \n to just <br>
  details = details.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  details = details.replace(/\n/g, "<br>");

  return details;
}

async function generateEventDetails(country1, country2, eventHeadline) {
  const prompt = `I am a student trying to learn about geopolitical history who needs granular explanations. As an expert historian, write me an in-depth geopolitical explanation of ${eventHeadline} and how it affected the relationship between ${country1} and ${country2} as if you are writing a non-fiction book about it (make it flow like a book but do not mention chapters). Start each response with a title that summarizes your response (10 words or less, no colons). Don't explain any events that happened after the year of the quote.`;

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
        temperature: 0.75,
        top_p: 0.9,
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
