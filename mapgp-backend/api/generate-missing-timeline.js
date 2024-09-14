const { MongoClient } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const express = require("express");
const cors = require("cors");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

const app = express();
app.use(express.json()); // To parse JSON body

// CORS setup
app.use(
  cors({
    origin: "https://www.mapgp.co", // Allow requests only from your frontend domain
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

async function generateRelationshipTimeline(country1, country2) {
  const prompt = `You are a historian of international geopolitics. Create a detailed timeline with excruciating granularity (in regards to the decision of whether or not to add a timeline event) explaining the geopolitical relationship between ${country1} and ${country2} from when they first recognized each other up to the present day. Ensure the criteria for deciding whether or not to include the timeline entry includes whether the entry will provide rich context, including key figures, political contexts, specific actions, and consequences. Avoid generalizations and instead include concrete events, treaties, wars, diplomatic missions, and significant political and economic changes. Each entry should begin with the year, followed by a concise but detailed description. Do not use bullet points. EACH ENTRY MUST BE LESS THAN 230 CHARACTERS. Make sure the entries don't end in periods. Here are some examples: "1821 Mexico gains independence from Spain 1822 Joel Robert Poinsett embarks on a special mission to Mexico, publishing an account of his experiences in 'Notes on Mexico'". This is one entry: "1821 Mexico gains independence from Spain". Do not acknowledge me in your response.`;

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
        temperature: 0.4,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 200000, // Increased timeout to 200 seconds
      }
    );

    const relationshipTimeline =
      response.data.choices[0].message.content.trim();
    console.log("Generated Timeline:", relationshipTimeline); // Log the generated timeline
    return formatTimeline(relationshipTimeline);
  } catch (error) {
    console.error(
      `Failed to generate timeline for ${country1} and ${country2}:`,
      error.message
    );
    return null;
  }
}

function formatTimeline(timeline) {
  // Format timeline text into HTML-like formatting (e.g., replacing markdown-style headings)
  timeline = timeline.replace(
    /(#+)\s*(.*?)\n/g,
    function (match, hashes, text) {
      return "<strong>" + text.trim() + "</strong><br>";
    }
  );

  timeline = timeline.replace(/#/g, "");
  timeline = timeline.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  timeline = timeline.replace(/\*(.*?)\*/g, "<em>$1</em>");
  timeline = timeline.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  timeline = timeline.replace(/\n/g, "<br>");

  return timeline;
}

function parseTimelineToJSON(timeline, country1, country2) {
  // Parse timeline into a JSON format with { year, text, country1, country2 }
  const lines = timeline.split("<br>");
  const jsonTimeline = lines
    .map((line) => {
      const yearMatch = line.match(/^(\d{4}(-\d{4}s?)?)/);
      if (yearMatch) {
        const year = yearMatch[1];
        const text = line.replace(/^(\d{4}(-\d{4}s?)?)\s*/, "").trim();
        return { year, text, country1, country2 };
      }
      return null;
    })
    .filter((entry) => entry !== null);
  return jsonTimeline;
}

async function populateDatabase(country1, country2) {
  const db = client.db("testingData1");
  const collection = db.collection("timelineData");

  const existingTimeline = await collection.findOne({ country1, country2 });

  if (!existingTimeline) {
    const relationshipTimeline = await generateRelationshipTimeline(
      country1,
      country2
    );

    if (relationshipTimeline) {
      const jsonTimeline = parseTimelineToJSON(
        relationshipTimeline,
        country1,
        country2
      );
      console.log("JSON Timeline:", jsonTimeline); // Log the JSON timeline
      for (const event of jsonTimeline) {
        const result = await collection.insertOne({
          country1,
          country2,
          year: event.year,
          text: event.text,
        });
        event._id = result.insertedId;
        console.log("Inserted Event:", event); // Log each inserted event
      }
      console.log(
        `Inserted relationship timeline for: ${country1} and ${country2}`
      );
    } else {
      console.log(
        `Failed to generate timeline for: ${country1} and ${country2}`
      );
    }
  } else {
    console.log(`Timeline already exists for: ${country1} and ${country2}`);
  }

  console.log("Database populated with initial relationship timelines");
}

// API handler for generating the missing timeline
app.post("/api/generate-missing-timeline", async (req, res) => {
  const { country1, country2 } = req.body;

  if (!country1 || !country2) {
    return res
      .status(400)
      .json({ success: false, message: "Both countries must be provided." });
  }

  try {
    await connectToMongoDB();
    await populateDatabase(country1, country2);
    res
      .status(200)
      .json({ success: true, message: "Timeline generated successfully." });
  } catch (error) {
    console.error("Error generating timeline:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating timeline." });
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

module.exports = app;
