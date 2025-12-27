require('dotenv').config();
const OpenAI = require("openai").default;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function detectIntent(diff) {
  const prompt = `
    Classify the following git commit diff into one category:
    Bug Fix, Feature, Refactor, Risky Commit, Docs/Test/Chore.

    Diff:
    ${diff}

    Answer with a single word from the above categories.
  `;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Unknown";
  }
}

module.exports = { detectIntent };
