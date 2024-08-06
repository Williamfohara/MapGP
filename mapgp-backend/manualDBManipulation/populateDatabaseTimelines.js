const { MongoClient, ObjectId } = require("mongodb");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Specify the path to your .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Update path here to determine country relationships to generate BY REGION
const initialRelationships = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../data/countryPairs/Europe.json"),
    "utf-8"
  )
);

async function connectToMongoDB() {
  await client.connect();
  console.log("Connected to MongoDB");
}

function formatTimeline(timeline) {
  // Convert markdown-like headers to <strong> tags
  timeline = timeline.replace(
    /(#+)\s*(.*?)\n/g,
    function (match, hashes, text) {
      return "<strong>" + text.trim() + "</strong><br>";
    }
  );

  // Remove any remaining '#' characters from the text
  timeline = timeline.replace(/#/g, "");

  // Convert **bold** to <strong> and *italic* to <em>
  timeline = timeline.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  timeline = timeline.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Normalize line breaks: convert any mix of <br> with \n to just <br>
  timeline = timeline.replace(/<br>\s*\n|\n\s*<br>/g, "<br>");
  timeline = timeline.replace(/\n/g, "<br>");

  return timeline;
}

function parseTimelineToJSON(timeline, country1, country2) {
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

async function generateRelationshipTimeline(
  country1,
  country2,
  retries = 3,
  delay = 1000
) {
  const prompt = `You are a historian of international geopolitics. Create a detailed timeline with excruciating granularity (in regards to the decision of whether or not to add a timeline event) explaining the geopolitical relationship between ${country1} and ${country2} from when they first recognized each other up to the year 2000. Ensure the criteria for deciding whether or not to include the timeline entry includes whether the entry will provide rich context, including key figures, political contexts, specific actions, and consequences. Avoid generalizations and instead include concrete events, treaties, wars, diplomatic missions, and significant political and economic changes. Each entry should begin with the year, followed by a concise but detailed description. Do not use bullet points. EACH ENTRY MUST BE LESS THAN 230 CHARACTERS. Make sure the entries don't end in periods. There should be AT MINIMUM 70 entries if the year starts before 1900. Here are some examples: "1821 Mexico gains independence from Spain 1822 Joel Robert Poinsett embarks on a special mission to Mexico, publishing an account of his experiences in 'Notes on Mexico'". This is one entry: "1821 Mexico gains independence from Spain". Do not acknowledge me in your response. `;

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
        timeout: 200000, // Increased timeout to 200 seconds
      }
    );

    const relationshipTimeline =
      response.data.choices[0].message.content.trim();
    return formatTimeline(relationshipTimeline);
  } catch (error) {
    if (
      (error.code === "ETIMEDOUT" ||
        error.code === "ENOTFOUND" ||
        error.response?.status === 429) &&
      retries > 0
    ) {
      console.error(
        `Error generating relationship timeline for ${country1} and ${country2}:`,
        error.message
      );
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
      return generateRelationshipTimeline(
        country1,
        country2,
        retries - 1,
        delay * 2
      ); // Increase delay for subsequent retries
    } else {
      console.error(
        `Failed to generate timeline for ${country1} and ${country2}:`,
        error.message
      );
      return null;
    }
  }
}

async function populateDatabase() {
  const db = client.db("testingData1");
  const collection = db.collection("timelineData");

  for (const relationship of initialRelationships) {
    const relationshipTimeline = await generateRelationshipTimeline(
      relationship.country1,
      relationship.country2
    );

    if (relationshipTimeline) {
      const jsonTimeline = parseTimelineToJSON(
        relationshipTimeline,
        relationship.country1,
        relationship.country2
      );
      for (const event of jsonTimeline) {
        const result = await collection.insertOne({
          country1: relationship.country1,
          country2: relationship.country2,
          year: event.year,
          text: event.text,
        });
        // Add the _id from the MongoDB assigned ObjectId
        event._id = result.insertedId;
      }
      console.log(
        `Inserted relationship timeline for: ${relationship.country1} and ${relationship.country2}`
      );
    } else {
      console.log(
        `Failed to generate timeline for: ${relationship.country1} and ${relationship.country2}`
      );
    }
  }

  console.log("Database populated with initial relationship timelines");
}

async function main() {
  try {
    await connectToMongoDB();
    await populateDatabase();
  } catch (error) {
    console.error("Error during script execution:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

main();
