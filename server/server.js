// server/gemini.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama2";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PORT = process.env.GEMINI_PORT || 5000;

// Validation and cleanup function
function validateAndCleanRecipe(data) {
  const cleaned = {
    name: data.name || "Untitled Recipe",
    description: data.description || "",
    ingredients: [],
    instructions: data.instructions || "",
    prepTime: data.prepTime || "30 mins",
    servings: data.servings || "4 people",
    category: data.category || "main"
  };

  // Validate category
  const validCategories = ["breakfast", "lunch", "dinner", "dessert", "snack", "main", "side"];
  if (!validCategories.includes(cleaned.category)) {
    cleaned.category = "main";
  }

  // Clean and validate ingredients
  if (Array.isArray(data.ingredients)) {
    cleaned.ingredients = data.ingredients
      .filter(ing => ing && (ing.item || ing.name)) // Filter out empty items
      .map(ing => {
        const item = ing.item || ing.name || "";
        let quantity = ing.quantity || ing.amount || "";
        let unit = ing.unit || "";

        // Convert quantity to string and clean
        quantity = String(quantity).trim();
        
        // Handle empty or non-numeric quantities
        if (!quantity || quantity === "" || quantity === "0" || isNaN(parseFloat(quantity))) {
          quantity = "";
        } else {
          // Parse and format numeric quantities
          const parsed = parseFloat(quantity);
          if (!isNaN(parsed)) {
            quantity = parsed.toString();
          }
        }

        // Normalize unit
        unit = String(unit).toLowerCase().trim();
        const validUnits = ["", "tsp", "tbsp", "cup", "ml", "l", "g", "kg", "oz", "lb", "piece", "pinch", "to taste"];
        if (!validUnits.includes(unit)) {
          // Try to map common variations
          const unitMap = {
            "teaspoon": "tsp",
            "teaspoons": "tsp",
            "tablespoon": "tbsp",
            "tablespoons": "tbsp",
            "cups": "cup",
            "milliliter": "ml",
            "milliliters": "ml",
            "liter": "l",
            "liters": "l",
            "gram": "g",
            "grams": "g",
            "kilogram": "kg",
            "kilograms": "kg",
            "ounce": "oz",
            "ounces": "oz",
            "pound": "lb",
            "pounds": "lb",
            "pieces": "piece",
            "pcs": "piece"
          };
          unit = unitMap[unit] || "";
        }

        return {
          name: item.trim(),
          quantity: quantity,
          unit: unit
        };
      })
      .filter(ing => ing.name); // Remove any with empty names
  }

  // Ensure at least one ingredient
  if (cleaned.ingredients.length === 0) {
    cleaned.ingredients = [{ name: "", quantity: "", unit: "" }];
  }

  return cleaned;
}

app.post("/api/extract-recipe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileData = fs.readFileSync(req.file.path);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent output
        topP: 0.8,
        topK: 40,
      }
    });

    const prompt = `You are a recipe extraction AI. Extract recipe information from the image and return ONLY a valid JSON object.

CRITICAL RULES:
1. Return ONLY the JSON object, no markdown, no code blocks, no explanations
2. Do NOT wrap the JSON in \`\`\`json or \`\`\` markers
3. All fields are REQUIRED - provide best estimates if information is missing
4. Quantities MUST be numbers (use 0 if unknown, not empty string)
5. Use ONLY these units: "tsp", "tbsp", "cup", "ml", "l", "g", "kg", "oz", "lb", "piece", "pinch", "to taste"

Required JSON structure (follow EXACTLY):

{
  "name": "Recipe name",
  "description": "Brief description of the dish",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "numeric value as string or empty string",
      "unit": "one of the allowed units or empty string"
    }
  ],
  "instructions": "Step by step cooking instructions",
  "prepTime": "estimated time like '30 mins'",
  "servings": "number of servings like '4 people'",
  "category": "one of: breakfast, lunch, dinner, dessert, snack, main, side"
}

INGREDIENT PARSING RULES:
- "2 cups flour" → {"name": "flour", "quantity": "2", "unit": "cup"}
- "1⁄2 tsp salt" → {"name": "salt", "quantity": "0.5", "unit": "tsp"}
- "2 x 400g tins tomatoes" → {"name": "tins tomatoes", "quantity": "800", "unit": "g"}
- "3 chopped onions" → {"name": "onions", "quantity": "3", "unit": "piece"}
- "salt to taste" → {"name": "salt", "quantity": "", "unit": "to taste"}
- "1 bunch parsley" → {"name": "parsley", "quantity": "1", "unit": "piece"}

ESTIMATIONS (if not visible in image):
- prepTime: Estimate based on complexity (simple=15-20 mins, moderate=30-40 mins, complex=60+ mins)
- servings: Estimate based on ingredient amounts (typically 2-6 people)
- category: Determine from dish type and meal context

Extract the recipe and output ONLY the JSON object:`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: fileData.toString("base64"),
          mimeType: req.file.mimetype
        }
      }
    ]);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    let rawText = result.response.text().trim();
    console.log("Raw AI response:", rawText);

    // Remove markdown code blocks if present
    rawText = rawText.replace(/^```json\s*\n?/i, "").replace(/\n?```$/i, "");
    rawText = rawText.replace(/^```\s*\n?/, "").replace(/\n?```$/, "");
    rawText = rawText.trim();

    // Try to parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", rawText);
      
      // Try to extract JSON from text if it's embedded in other text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          return res.status(500).json({ 
            error: "AI returned invalid JSON",
            rawResponse: rawText.substring(0, 500)
          });
        }
      } else {
        return res.status(500).json({ 
          error: "No valid JSON found in AI response",
          rawResponse: rawText.substring(0, 500)
        });
      }
    }

    // Validate and clean the parsed data
    const cleanedRecipe = validateAndCleanRecipe(parsedData);

    res.json({ 
      success: true,
      recipe: cleanedRecipe,
      raw: rawText // Include for debugging
    });

  } catch (error) {
    console.error("Recipe extraction error:", error);
    
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: "Recipe extraction failed",
      message: error.message 
    });
  }
});

app.post('/api/chat-stream', async (req, res) => {
    console.log("💬 Ollama: Chat request received");
    try {
        const { prompt, context } = req.body;

        // Server-Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const fullPrompt = `You are a helpful cooking assistant.
${context ? `User's pantry: ${context.join(", ")}` : ""}

User: ${prompt}
Assistant:`;


        const response = await axios.post("http://localhost:11434/api/generate", {
            model: OLLAMA_MODEL,
            prompt: fullPrompt,
            stream: true
        }, { responseType: "stream" });

        response.data.on("data", chunk => {
            const lines = chunk.toString().split("\n").filter(Boolean);
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        res.write(`data: ${JSON.stringify({ text: data.response })}\n\n`);
                    }
                    if (data.done) {
                        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                        res.end();
                    }
                } catch { /* ignore partial */ }
            }
        });

        response.data.on("end", () => res.end());
        response.data.on("error", () => {
            res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error("❌ Ollama error:", error);
        res.write(`data: ${JSON.stringify({ error: "Ollama unavailable" })}\n\n`);
        res.end();
    }
});


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Gemini recipe extraction server is running",
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`\nTest the server:`);
  console.log(`  curl http://localhost:${PORT}/api/health`);
  console.log(`🤖 Smart Pantry AI server running on http://localhost:${PORT}`);
  console.log(`🔑 Gemini key: ${process.env.GEMINI_API_KEY ? "OK" : "MISSING"}`);
  console.log(`🦙 Ollama model: ${OLLAMA_MODEL}`);
});

export default app;