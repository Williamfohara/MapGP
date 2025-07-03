const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file, assuming populateDatabaseRelationshipSummaries.js is not in the root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Update path here to determine country relationships to generate BY REGION: node manualDBManipulation/populateDatabaseRelationshipSummaries.js
const initialRelationships = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../data/countryPairs/AmericaOceania.json"),
    "utf-8"
  )
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatRelationshipSummary(summary) {
  // Convert markdown-like headers to <strong> tags
  summary = summary.replace(/(#+)\s*(.*?)\n/g, function (match, hashes, text) {
    return "<strong>" + text.trim() + "</strong><br>";
  });

  // Remove any remaining '#' characters from the text
  summary = summary.replace(/#/g, "");

  // Convert **bold** to <strong> and *italic* to <em>
  summary = summary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  summary = summary.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Normalize line breaks: convert any mix of <br> with \n to just <br>
  summary = summary.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  summary = summary.replace(/\n/g, "<br>");

  return summary;
}

async function generateRelationshipSummary(country1, country2) {
  const prompt = `I am a student trying to learn about geopolitical history who needs granular explanations. As an expert historian, write me a geopolitical summary of the relationship between ${country1} and ${country2} from when they first formally recognized each other as sovereign nations all the way to the present. Make sure the response is roughly 85 words`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
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

    const relationshipSummary = response.data.choices[0].message.content.trim();
    return formatRelationshipSummary(relationshipSummary);
  } catch (error) {
    console.error(
      "Error generating relationship summary:",
      error.response ? error.response.data : error.message
    );
    return null;
  }
}

async function populateDatabase() {
  const db = client.db("testingData1");
  const collection = db.collection("relationshipData");

  for (const relationship of initialRelationships) {
    const relationshipSummary = await generateRelationshipSummary(
      relationship.country1,
      relationship.country2
    );

    if (relationshipSummary) {
      await collection.insertOne({
        country1: relationship.country1,
        country2: relationship.country2,
        relationshipSummary: relationshipSummary,
      });
      console.log(
        `Inserted relationship summary for: ${relationship.country1} and ${relationship.country2}`
      );
    } else {
      console.log(
        `Failed to generate summary for: ${relationship.country1} and ${relationship.country2}`
      );
    }
  }

  console.log("Database populated with initial relationship summaries");
}

async function retrieveData() {
  const db = client.db("testingData1");
  const collection = db.collection("relationshipData");

  const relationships = await collection.find({}).toArray();
  console.log("Retrieved relationship summaries:", relationships);
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
