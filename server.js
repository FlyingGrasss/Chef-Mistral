import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config(); // Load environment variables

const app = express();
const PORT = 5000;

app.use(express.json()); // Allow JSON requests
app.use(cors()); // Enable CORS

const hf = new HfInference(process.env.HF_ACCESS_TOKEN); // Use token from .env

const SYSTEM_PROMPT = `
  You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. 
  You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to 
  include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`;

app.post("/get-recipe", async (req, res) => {
  const { ingredients, personal } = req.body;

  

  try {
    const response = await hf.chatCompletion({
      model: "mistralai/Mistral-7B-Instruct-v0.2", // Use v0.2 model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `I have ${ingredients.join(", ")}. ${personal ? "Also, " + personal.join(", ") + "." : undefined} Please give me a recipe you'd recommend I make!` }
      ],
      max_tokens: 1024,
    });

    // Log the response from the HuggingFace API
    console.log("HuggingFace API Response:", response);

    res.json({ recipe: response.choices[0].message.content });
  } catch (error) {
    console.error("Error generating recipe:", error);

    // Log detailed error response
    if (error.response) {
      console.error("Error response data:", error.response.data);
    }

    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
