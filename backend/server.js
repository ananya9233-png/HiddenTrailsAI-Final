process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
import sslRootCas from 'ssl-root-cas';

sslRootCas.inject();

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
          {
  role: "system",
  content: `
You are HiddenTrails AI, a concise travel planning assistant.

Rules:
- Maximum 4 short sentences.
- No long introductions.
- No storytelling.
- Be direct and helpful.
- Always suggest next action.
- Use bullet points when suggesting options.
- Keep responses under 80 words.
- Sound friendly but efficient.
`
}
         
        ],
        max_tokens: 120,
temperature: 0.7,
      })
    });

    const data = await response.json();
    console.log("AI RAW RESPONSE:", JSON.stringify(data, null, 2));
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
 
  const destination = req.body.destination;
const preference = req.body.preference;
const days = Number(req.body.days);
const budget = Number(req.body.budget);
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
  role: "system",
  content: `
You are HiddenTrails AI — a modern, design-first travel curator.

You create immersive, aesthetic, Gen-Z friendly itineraries.

Your tone:
- Natural
- Local-insider
- Not robotic
- Not blog-style
- Not generic
- Slightly cinematic but not dramatic

Avoid:
- Famous tourist landmarks
- Wikipedia descriptions
- Generic suggestions like "explore local markets"

Trip Style Definitions:

Adventure:
- Physically active elements (cycling, hikes, climbing gyms, kayaking, night walks)
- Rooftop exploration
- Underground events
- Hidden viewpoints
- At least 1 adrenaline or high-energy activity per day

Relaxation:
- Slow mornings
- Café hopping
- Spa / wellness / yoga
- Scenic quiet neighborhoods
- Sunset sitting spots
- No rushed schedules

Culture:
- Art studios
- Museums (non-mainstream)
- Craft workshops
- Local storytelling
- Heritage walks
- Historic neighborhoods

Nature:
- Parks, forests, lakes
- Sunrise / sunset outdoors
- Botanical gardens
- Eco experiences
- Minimal indoor time

Luxury:
- Boutique hotels
- Chef-curated dining
- Rooftop lounges
- Premium experiences
- Private guided sessions
- Elevated aesthetics

IMPORTANT:
Each trip MUST strictly follow its style.
Do NOT mix styles randomly.
Cost logic must match travel style.
Luxury cannot be budget backpacking.
Adventure cannot have zero activity cost.
Stay recommendation must influence daily plan location.
All activities should be within 5–7 km of stay.

If a location appears in top 4 Google tourist results, avoid it.
Focus on:
- Specific cafes
- Street names
- Small local businesses
- Neighborhood micro-spots

Focus on:
- Micro experiences
- Specific cafes
- Street details
- Neighborhood vibe
- Time-of-day atmosphere
- Unexpected discoveries

Each day must feel like:
"A friend who lives there planned it."

Still return STRICT JSON only.
`
   
  },
  {
    role: "user",
    content: `
Create a ${days}-day ${preference} hidden-gem itinerary for ${destination}.

User Budget: ₹${budget}

Return ONLY this JSON structure:

{
  "destination": "",
  "trip_style": "",
  "hidden_score": 0,
  "stay_recommendations": [
    {
      "type": "",
      "name": "",
      "area": "",
      "approx_price_per_night": 0
    }
  ],
  "food_spots": [
    {
      "name": "",
      "area": "",
      "specialty": "",
      "approx_cost": 0
    }
  ],
  "experiences": [
    {
      "title": "",
      "description": "",
      "approx_cost": 0
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "",
      "morning": "Detailed 2-3 sentence immersive description",
"afternoon": "Detailed 2-3 sentence immersive description",
"evening": "Detailed 2-3 sentence immersive description",
    
      "estimated_cost": 0
    }
  ],
  "budget_breakdown": {
    "stay_total": 0,
    "food_total": 0,
    "activities_total": 0,
    "transport_total": 0
  },
  "total_estimated_cost": 0
}
`
  }
],
 response_format: { type: "json_object" },
  temperature: 0.2,
  max_tokens: 900
})
// temperature: 0.3,
// max_tokens: 800
// })
    });



    const data = await response.json();
    console.log("AI RAW RESPONSE:", JSON.stringify(data, null, 2));

if (!data.choices || !data.choices[0]) {
  console.error("Groq Error:", data);
  return res.status(500).json({ error: "AI response invalid" });
}

const aiText = data.choices[0].message?.content;

let structuredData;

try {
  structuredData = JSON.parse(aiText);

// Add realistic stay calculation
// Ensure budget_breakdown exists
if (!structuredData.budget_breakdown) {
  structuredData.budget_breakdown = {
    stay_total: 0,
    food_total: 0,
    activities_total: 0,
    transport_total: 0
  };
}

const breakdown = structuredData.budget_breakdown;

// Ensure numbers
breakdown.stay_total = Number(breakdown.stay_total) || 0;
breakdown.food_total = Number(breakdown.food_total) || 0;
breakdown.activities_total = Number(breakdown.activities_total) || 0;
breakdown.transport_total = Number(breakdown.transport_total) || 0;

// Add realistic stay calculation
if (structuredData.stay_recommendations?.length > 0) {
  const perNight = Number(structuredData.stay_recommendations[0].approx_price_per_night) || 0;
  breakdown.stay_total = perNight * days;
}

// Recalculate total
const calculatedTotal =
  breakdown.stay_total +
  breakdown.food_total +
  breakdown.activities_total +
  breakdown.transport_total;

structuredData.total_estimated_cost = calculatedTotal;

// If AI overshoots budget, auto-adjust
if (calculatedTotal >= budget) {
  structuredData.total_estimated_cost = Math.floor(budget * 0.85);
}

} catch (err) {
  console.error("JSON Parse Error:", err);
  console.log("AI RAW OUTPUT:", aiText);
  return res.status(500).json({ error: "Invalid JSON from AI" });
}

res.json(structuredData);

  } catch (error) {
    console.error("❌ Itinerary error:", error);
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});
app.get("/get-destination-image", async (req, res) => {
  const { query } = req.query;

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=10`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const imageUrl = data.results[randomIndex].urls.regular;

      res.json({ image: imageUrl });
    } else {
      res.json({ image: null });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image fetch failed" });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});