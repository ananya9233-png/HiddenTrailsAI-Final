process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import sslRootCas from 'ssl-root-cas';

dotenv.config();
sslRootCas.inject();

const app = express();
app.use(cors());
app.use(express.json());

// 💬 1. CHATBOT API
// 💬 1. UPGRADED CHATBOT API (Friendly & Smart Personality)
// 💬 1. PRO CHATBOT API (Cool & Friendly Personality)
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message required" });

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `You are HiddenTrails AI, the coolest travel expert on the planet. 
                        
                        PERSONALITY:
                        - You talk like a friendly travel bro/guide. Use words like 'vibe', 'epic', 'low-key', 'scenes'.
                        - You are obsessed with travel, hidden gems, and aesthetic spots.
                        
                        STRICT RULES FOR NON-TRAVEL QUERIES:
                        - If a user asks about coding (like OOPS, Java, Python), math, or school subjects, DO NOT answer them.
                        - Instead, give a funny, cool, and friendly refusal that brings them back to travel.
                        - Example refusal: "Bro, OOPS? That sounds like a bug in a code, but I'm busy looking for bugs in the rainforest! 🌿 Let's leave the coding to the nerds and talk about your next trip. Where we headed?"
                        
                        STRICT RULES FOR TRAVEL QUERIES:
                        - Be super helpful and suggest specific 'hidden gems'.
                        - Keep it short, punchy, and full of energy.
                        - Use 1-2 emojis per message maximum.` 
                    },
                    { role: "user", content: message }
                ],
                max_tokens: 300,
                temperature: 0.9, // Higher temperature for more "personality"
            })
        });

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        
        res.json({ reply: reply || "Yo! My GPS is acting up. Ask me again? 🧭" });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Chatbot failed" });
    }
});


// 🧭 2. ITINERARY API
app.post("/generate-itinerary", async (req, res) => {
    const { destination, preference, days, budget } = req.body;
    console.log("🔥 Generating for:", destination);

    if (!destination || !days || !budget) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are a travel curator. Return ONLY valid JSON.
                        Focus on hidden gems, aesthetic cafes, and local secrets.
                        Each morning, afternoon, and evening description should be 2-3 detailed sentences.`
                    },
                    {
                        role: "user",
                        content: `Create a ${days}-day ${preference} itinerary for ${destination} with a total budget of ₹${budget}. 
                        Format:
                        {
                          "destination": "${destination}",
                          "hidden_score": 9.2,
                          "days": [
                            {
                              "day": 1,
                              "title": "Theme of day",
                              "morning": "description",
                              "afternoon": "description",
                              "evening": "description",
                              "estimated_cost": 1500
                            }
                          ]
                        }`
                    }
                ],
                temperature: 0.2, // Low temperature for stable JSON
                max_tokens: 3000
            })
        });

        const data = await response.json();
        let aiText = data.choices?.[0]?.message?.content || "";

        // Clean JSON formatting
        aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBrace = aiText.indexOf("{");
        const lastBrace = aiText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
            aiText = aiText.substring(firstBrace, lastBrace + 1);
        }

        const structuredData = JSON.parse(aiText);

        // ✅ FIXED: Removed the "6 sentences" strict check that was causing errors
        res.json(structuredData);

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
    }
});

// 🖼️ 3. IMAGE API
app.get("/get-destination-image", async (req, res) => {
    const { query } = req.query;
    try {
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
            { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
        );
        const data = await response.json();
        res.json({ image: data.results?.[0]?.urls?.regular || null });
    } catch (err) {
        res.json({ image: null });
    }
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));