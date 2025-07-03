const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatEventDetails(details) {
  details = details.replace(/USTYPE="external_link">/g, "");
  details = details.replace(/(#+)\s*(.*?)\n/g, function (match, hashes, text) {
    return "<strong>" + text.trim() + "</strong><br>";
  });
  details = details.replace(/#/g, "");
  details = details.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  details = details.replace(/\*(.*?)\*\*/g, "<em>$1</em>");
  details = details.replace(/(\b\d)\.(?=\s|$)/g, "<strong>$1</strong>");
  details = details.replace(/(\b\d\b)(?!<\/strong>|,)/g, "<strong>$1</strong>");
  details = details.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  details = details.replace(/\n/g, "<br>");

  return details;
}

async function generateEventDetails(country1, country2, text) {
  const prompt = `I am a student trying to learn about geopolitical history who needs granular explanations. As an expert historian, write me an in-depth geopolitical explanation of ${text} and how it affected the relationship between ${country1} and ${country2} as if you are writing a non-fiction book about it (make it flow like a book but do not mention chapters). Start each response with a title that summarizes your response (10 words or less, no colons). Don't explain any events that happened after the year of the quote.`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 10500,
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

async function populateDatabase(country1, country2, text, year) {
  // Added year as parameter
  const db = client.db("testingData1");
  const targetCollection = db.collection("eventDetails");

  // Generate event details using the provided text
  const eventDetails = await generateEventDetails(country1, country2, text);

  if (eventDetails) {
    await targetCollection.insertOne({
      country1: country1,
      country2: country2,
      year: year, // Use the year parameter passed to the function
      details: eventDetails,
    });
    console.log(`Inserted event details for: ${text}`);
  } else {
    console.log(`Failed to generate details for event: ${text}`);
  }

  console.log("Database populated with event details");
}

// Export functions to be used in server.js
module.exports = {
  connectToMongoDB,
  generateEventDetails,
  populateDatabase,
};
