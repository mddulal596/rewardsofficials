const { Telegraf } = require('telegraf');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, increment, serverTimestamp } = require('firebase/firestore');
const express = require('express');

const app = express();
app.use(express.json()); // JSON ডাটা রিসিভ করার জন্য
const PORT = process.env.PORT || 10000;

// রেন্ডার পোর্ট ওপেন রাখার জন্য ডামি রুট
app.get('/', (req, res) => {
  res.send('RewardOfficials Telegram Bot is running successfully!');
});

// বট টোকেন
const BOT_TOKEN = "9217390232:AAEc8kenpRlPO1n_2c55kClI7AQjvzJZwkI";

if (!BOT_TOKEN) {
  console.error("Error: BOT_TOKEN is missing!");
  process.exit(1);
}

// ফায়ারবেস ওয়েব কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyDBCZZAebuQ3i66C8UNp9qdBI79RS7KHcc",
  authDomain: "rewardsofficials.firebaseapp.com",
  projectId: "rewardsofficials",
  storageBucket: "rewardsofficials.firebasestorage.app",
  messagingSenderId: "17078908900",
  appId: "1:17078908900:web:4a11cc8c4f41fac5ceb9f1"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
console.log("Firebase initialized successfully via Web SDK.");

const bot = new Telegraf(BOT_TOKEN);

// /start কমান্ড হ্যান্ডলার ও ইনলাইন বাটন
bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || 'NoUsername';

    const userRef = doc(db, 'users', telegramId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        telegramId: telegramId,
        username: username,
        balance: 0,
        tasksDone: 0,
        createdAt: serverTimestamp()
      });
    }

    // Node.js (Telegraf বা node-telegram-bot-api) এর উদাহরণ:
bot.sendMessage(chatId, "স্বাগতম Pro Rewards-এ!\n\nনিচের বাটন থেকে আমাদের মিনি অ্যাপ ওপেন করে ডেইলি বোনাস, টাস্ক ও আপনার ব্যালেন্স চেক করুন। 👇", {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "🚀 Open Mini App", web_app: { url: "https://rewardsofficials.onrender.com" } }
            ],
            [
                { text: "📢 Official Channel", url: "https://t.me/rewardofficials" },
                { text: "🤖 Support Bot", url: "https://t.me/rewardsofficials_bot" }
            ]
        ]
    }
});

// মিনি অ্যাপ থেকে চ্যানেল টাস্ক ভেরিফাই করার জন্য API রাউট
app.post('/verify-channel', async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.json({ success: false, message: 'Telegram ID missing' });

  try {
    const CHANNEL_USERNAME = "@rewardofficials";
    // টেলিগ্রাম সার্ভার থেকে চেক করা ইউজার চ্যানেলে আছে কি না
    const chatMember = await bot.telegram.getChatMember(CHANNEL_USERNAME, telegramId);
    const validStatuses = ['creator', 'administrator', 'member'];

    if (validStatuses.includes(chatMember.status)) {
      return res.json({ success: true, message: 'Verified successfully' });
    } else {
      return res.json({ success: false, message: 'User has not joined the channel yet!' });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return res.json({ success: false, message: 'Error checking membership' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// নিরাপদ বট লঞ্চ ফাংশন
async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log('Telegraf bot is running smoothly...');
  } catch (err) {
    if (err.response && err.response.error_code === 409) {
      console.log('আগের ইনস্ট্যান্সটি বন্ধ হওয়ার জন্য ৫ সেকেন্ড অপেক্ষা করা হচ্ছে...');
      setTimeout(startBot, 5000);
    } else {
      console.error('Bot launch error:', err);
    }
  }
}

setTimeout(startBot, 3000);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
