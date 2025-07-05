// api/extract-key-countries.js
import OpenAI from "openai"; // ← new import

export default async function handler(req, res) {
  // CORS pre-flight
  res.setHeader("Access-Control-Allow-Origin", "https://www.mapgp.co");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "Missing text input" });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // switch if full 4-o not enabled
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: `From the following text, identify only the major countries or nation-states involved. Return a comma-separated list. Text: """${text}"""`,
        },
      ],
      max_tokens: 200,
      temperature: 0.2,
    });

    const countries = completion.choices[0].message.content
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    return res.status(200).json({ countries });
  } catch (err) {
    console.error("extract-key-countries:", err);
    return res.status(500).json({ error: "Failed to fetch countries" });
  }
}
