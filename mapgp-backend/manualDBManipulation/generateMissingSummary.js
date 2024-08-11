const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatRelationshipSummary(summary) {
  summary = summary.replace(/(#+)\s*(.*?)\n/g, function (match, hashes, text) {
    return "<strong>" + text.trim() + "</strong><br>";
  });

  summary = summary.replace(/#/g, "");
  summary = summary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  summary = summary.replace(/\*(.*?)\*/g, "<em>$1</em>");
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

async function generateAndStoreSummary(country1, country2) {
  const db = client.db("testingData1");
  const collection = db.collection("relationshipData");

  const existingSummary = await collection.findOne({
    $or: [
      { country1, country2 },
      { country1: country2, country2: country1 },
    ],
  });

  if (!existingSummary) {
    const relationshipSummary = await generateRelationshipSummary(
      country1,
      country2
    );

    if (relationshipSummary) {
      await collection.insertOne({
        country1,
        country2,
        relationshipSummary,
      });
      console.log(
        `Inserted relationship summary for: ${country1} and ${country2}`
      );
      return { success: true, relationshipSummary };
    } else {
      console.log(
        `Failed to generate summary for: ${country1} and ${country2}`
      );
      return { success: false };
    }
  } else {
    console.log(`Summary already exists for: ${country1} and ${country2}`);
    return {
      success: true,
      relationshipSummary: existingSummary.relationshipSummary,
    };
  }
}

async function handleGenerateSummaryRequest(req, res) {
  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ success: false, message: "Both countries must be provided." });
  }

  try {
    const result = await generateAndStoreSummary(country1, country2);
    res.json(result);
  } catch (error) {
    console.error("Error handling generate summary request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { handleGenerateSummaryRequest };

// Connect to MongoDB and start the server
connectToMongoDB()
  .then(() => {
    console.log("Ready to handle summary generation requests");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
