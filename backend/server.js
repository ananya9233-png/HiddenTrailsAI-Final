import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-itinerary", async (req, res) => {
  console.log("🔥 FRONTEND HIT BACKEND");
  console.log("BODY:", req.body);

  const { destination, days, preference, budget } = req.body;

  if (!destination || !days || !budget || !preference) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: `
Create a ${days}-day ${preference} travel itinerary for ${destination}.

IMPORTANT:
Return ONLY pure JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include backticks.
The response must start with { and end with }.



{
  "destination": "",
  "total_estimated_cost": 0,
  "days": [
    {
      "day": 1,
      "title": "",
      "morning": "",
      "afternoon": "",
      "evening": "",
      "estimated_cost": 0
    }
  ]
}

Budget limit: ₹${budget}
Ensure total_estimated_cost is under budget.
`
            }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));
const aiText = data.choices[0].message?.content;

if (!aiText) {
  return res.status(500).json({ error: "Empty AI response" });
}

// 🔥 Extract JSON between first { and last }
const start = aiText.indexOf("{");
const end = aiText.lastIndexOf("}");

if (start === -1 || end === -1) {
  return res.status(500).json({ error: "No JSON found in AI response" });
}

const jsonString = aiText.substring(start, end + 1);

let structuredData;

try {
  structuredData = JSON.parse(jsonString);
} catch (err) {
  console.error("❌ JSON PARSE ERROR");
  console.error("RAW AI:", aiText);
  console.error("EXTRACTED:", jsonString);
  return res.status(500).json({ error: "Invalid JSON from AI" });
}

return res.json(structuredData);

   

  } catch (error) {
    console.error("❌ Backend error:", error);
    res.status(500).json({ error: "Backend crash" });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});


