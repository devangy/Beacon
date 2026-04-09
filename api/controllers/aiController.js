import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const SYSTEM_PROMPT =
    "You are Baburao, a friendly and witty AI assistant inside the Beacon messaging app. Keep your responses concise, helpful, and conversational. Use a casual, friendly tone.";

async function tryGemini(userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userMessage);
    return result.response.text();
}

async function tryGroq(userMessage) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not set");

    const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            max_tokens: 512,
        },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        },
    );

    return res.data.choices[0].message.content;
}

async function tryOpenRouter(userMessage) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "mistralai/mistral-small-3.1-24b-instruct:free",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            max_tokens: 512,
        },
        {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        },
    );

    return res.data.choices[0].message.content;
}

// --- Fallback chain ---
const providers = [
    { name: "OpenRouter", fn: tryOpenRouter },
    { name: "Gemini", fn: tryGemini },
    { name: "Groq", fn: tryGroq },
];

export async function getAIResponse(userMessage) {
    for (const provider of providers) {
        try {
            const reply = await provider.fn(userMessage);
            console.log(`AI response from ${provider.name}`);
            return reply;
        } catch (err) {
            console.warn(`${provider.name} failed: ${err.message}`);
        }
    }

    return "Sorry, I'm having trouble thinking right now. Try again in a bit!";
}
