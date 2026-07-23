import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let aiAvailable = false;
let genAI = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    aiAvailable = true;
    console.log('Gemini API initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API:', error.message);
  }
} else {
  console.warn('WARNING: GEMINI_API_KEY is not set. Running in MOCK mode.');
}

// Endpoint to handle interview chat session
app.post('/api/interview/chat', async (req, res) => {
  const { candidateName, targetRole, history, currentAnswer } = req.body;

  // If running in Mock Mode, return simulated response
  if (!aiAvailable) {
    return res.json(getMockResponse(history, currentAnswer));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format chat history for prompt
    let conversationHistory = '';
    if (history && history.length > 0) {
      conversationHistory = history.map(h => `${h.role === 'candidate' ? 'Candidate' : 'Interviewer'}: ${h.text}`).join('\n');
    }

    const prompt = `
You are an HR Interviewer conducting a mock interview for "${candidateName || 'Candidate'}" who is applying for the role of "${targetRole || 'Professional'}".

Your goal is to evaluate the candidate's communication skills and ask simple, short, and concise questions that are easy to understand and answer.

CRITICAL INSTRUCTIONS:
- Keep the "nextQuestion" very short, simple, and direct (maximum 1 sentence).
- Avoid long, complex situational scenarios or multi-part questions.
- Ask basic HR or career-readiness questions (e.g., "Why do you want to join this role?", "What is your biggest strength?", "How do you handle deadlines?").
- If this is the start of the interview (no history, currentAnswer is empty), ask a simple introductory question like "Tell me a little about yourself."

Conversation history so far:
${conversationHistory}
${currentAnswer ? `Candidate's latest answer: "${currentAnswer}"` : ''}

Please structure your response as a valid JSON object containing exactly two keys:
1. "feedback": A very brief, encouraging feedback of their latest answer (1-2 short sentences). If this is the first question of the interview, set this to an empty string "".
2. "nextQuestion": A simple, short, and direct interview question (maximum 1 sentence long).

Return ONLY the raw JSON object. Do not wrap it in markdown code blocks or add any other text.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean JSON response (sometimes models wrap it in ```json ... ```)
    let jsonString = responseText;
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    
    try {
      const responseData = JSON.parse(jsonString.trim());
      res.json(responseData);
    } catch (e) {
      console.error('Failed to parse model response as JSON. Raw response:', responseText);
      res.status(500).json({ 
        error: 'AI response parsing failed', 
        raw: responseText,
        feedback: "Thanks for sharing that.",
        nextQuestion: "Can you tell me about a time you had to adapt to a major change at work or college?"
      });
    }

  } catch (error) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Helper for Mock Responses
function getMockResponse(history, currentAnswer) {
  const defaultQuestions = [
    "Tell me about yourself and why you'd like to improve your communication skills.",
    "Describe a time you had to explain something complex in simple English.",
    "What does effective communication mean to you?",
    "Tell me about a challenge you overcame using good communication.",
    "Why should we consider you confident in professional English?",
    "Thank you! That concludes our mock interview. Do you have any questions for me?"
  ];

  const qIndex = history ? Math.floor(history.length / 2) : 0;
  const feedback = currentAnswer 
    ? "That was a good response. Try to add a specific example to support your points and speak slightly more slowly to maintain clarity." 
    : "";
  const nextQuestion = defaultQuestions[Math.min(qIndex, defaultQuestions.length - 1)];

  return {
    feedback,
    nextQuestion,
    mockActive: true
  };
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});