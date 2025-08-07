// =========================
// 📁 Backend: confessbot/index.js
// =========================

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MessagingResponse } = require('twilio').twiml;
const admin = require('firebase-admin');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// ✅ Dummy Home Route
app.get('/', (req, res) => {
  console.log("📩 Home route hit!");
  res.send('🎉 ConfessBot is working!');
});

// 🔐 Firebase Setup
const serviceAccount = require('./firebase.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://confessbot-a9e27.firebaseio.com"
});
const db = admin.firestore();

// 🔁 Twilio Webhook
app.post('/sms', async (req, res) => {
  const message = req.body.Body;
  const timestamp = new Date().toISOString();

  try {
    await db.collection('confessions').add({ message, timestamp });
    console.log('✅ Confession saved:', message);
  } catch (error) {
    console.error('❌ Failed to save:', error);
  }

  const twiml = new MessagingResponse();
  twiml.message("💌 Your confession has been received anonymously.");
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// 📤 API: Get Confessions
app.get('/confessions', async (req, res) => {
  try {
    const snapshot = await db.collection('confessions').orderBy('timestamp', 'desc').limit(20).get();
    const confessions = snapshot.docs.map(doc => doc.data());
    res.json(confessions);
  } catch (error) {
    console.error('❌ Error fetching:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// 🟢 Start Server
const PORT = 1000; // Changed to avoid conflict on 5000
app.listen(PORT, () => {
  console.log(`✅ ConfessBot backend running at http://localhost:${PORT}`);
});
