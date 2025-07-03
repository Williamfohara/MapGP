const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const router = express.Router();

// ✅ Add CORS just for this route (or globally in server.js)
router.use(
  cors({
    origin: "https://www.mapgp.co",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Middleware to parse JSON body
router.use(express.json());

router.options("/", (req, res) => {
  res.sendStatus(200);
});

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing text input" });
  }

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const prompt = `From the following text, identify only the major countries or nation-states involved. Do not include individuals or vague entities. Return only a comma-separated list of country names. Text: """${text}"""`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
      temperature: 0.2,
    });

    const content = completion.data.choices[0].message.content;
    const countries = content
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    return res.status(200).json({ countries });
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to fetch countries" });
  }
});

module.exports = router;
