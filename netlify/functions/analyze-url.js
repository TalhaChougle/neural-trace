const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Method Not Allowed",
      };
    }

    const { url } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing URL" }),
      };
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    const prompt = `
Analyze website authenticity.

URL: ${url}

Return ONLY JSON:
{
  "verdictHeader": "...",
  "verdictReason": "...",
  "score": 0-100,
  "status": "Safe | Suspicious | Fraudulent",
  "confidence": 1-100,
  "explanation": "...",
  "weightedBreakdown": {
    "technical": number,
    "heuristic": number,
    "ai": number
  },
  "findings": [
    { "label": "...", "val": "...", "status": "Good | Warning | Bad" }
  ]
}
`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    // safer parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON from Gemini");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };

  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Analysis failed" }),
    };
  }
};
