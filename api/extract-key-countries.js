import { Configuration, OpenAIApi } from "openai";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
}
