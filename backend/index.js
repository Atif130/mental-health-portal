const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/ask-ai', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).send({ error: 'Message is required' });
    }

    // YEH LINE HUMNE CHANGE KI HAI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    res.send({ reply: text });
  } catch (error) {
    console.error("Error with Generative AI:", error);
    res.status(500).send({ error: 'Failed to get response from AI' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
