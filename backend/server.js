import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 💬 1. CHATBOT API (Simple Text Response)
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("🔥 CHAT HIT:", message);

    if (!message) return res.status(400).json({ error: "Message required" });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a helpful travel assistant for HiddenTrails.AI." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) return res.status(500).json({ error: "No AI reply" });

    res.json({ reply });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Chatbot failed" });
  }
});

// 🧭 2. ITINERARY API (Aapka Purana JSON Logic)
app.post("/generate-itinerary", async (req, res) => {
  const { destination, days, preference, budget } = req.body;
  console.log("🔥 ITINERARY HIT:", { destination, days });

  if (!destination || !days || !budget || !preference) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: `Create a ${days}-day ${preference} travel itinerary for ${destination}. 
            Return ONLY pure JSON. No markdown.
            {
              "destination": "",
              "total_estimated_cost": 0,
              "days": [
                { "day": 1, "title": "", "morning": "", "afternoon": "", "evening": "", "estimated_cost": 0 }
              ]
            }
            Budget: ₹${budget}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const aiText = data.choices[0].message?.content;

    // 🔥 Aapka Purana Extraction Logic
    const start = aiText.indexOf("{");
    const end = aiText.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return res.status(500).json({ error: "No JSON found" });
    }

    const jsonString = aiText.substring(start, end + 1);
    const structuredData = JSON.parse(jsonString);

    res.json(structuredData);
  } catch (error) {
    console.error("❌ Itinerary error:", error);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});