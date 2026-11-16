const { Telegraf } = require('telegraf');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// রেন্ডার পোর্ট ওপেন রাখার জন্য ডামি রুট
app.get('/', (req, res) => {
  res.send('RewardOfficials Telegram Bot is running successfully!');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// ----------------------------------------------------------------------------------
// স্ক্রিনশট অনুযায়ী আপনার ডেমো টোকেনটি এখানে বসানো আছে
// ----------------------------------------------------------------------------------
const BOT_TOKEN = "9217390232:AAFmp5lX5BkRLq0xd_g7inFFGtRV1SGKRto";

if (!BOT_TOKEN || BOT_TOKEN === "YOUR_NEW_BOT_TOKEN_HERE") {
  console.error("Error: BOT_TOKEN is missing or not set!");
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

// ফায়ারবেস ইনিশিয়েলাইজ
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
console.log("Firebase initialized successfully via Web SDK.");

// বট ইনিশিয়েলাইজ
const bot = new Telegraf(BOT_TOKEN);

// ১. /start কমান্ড হ্যান্ডলার (অ্যাকাউন্ট রেজিস্ট্রেশন)
bot.start(async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const username = ctx.from.username || 'NoUsername';

    const userRef = doc(db, 'users', telegramId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // নতুন ইউজার রেজিস্ট্রেশন
      await setDoc(userRef, {
        telegramId: telegramId,
        username: username,
        balance: 0,
        tasksDone: 0,
        createdAt: serverTimestamp()
      });
      ctx.reply(`স্বাগতম! আপনার অ্যাকাউন্ট তৈরি হয়েছে। আপনার টেলিগ্রাম আইডি: ${telegramId}`);
    } else {
      ctx.reply(`স্বাগতম! আপনি আগেই আমাদের সিস্টেমে রেজিস্টার্ড আছেন।`);
    }
  } catch (error) {
    console.error("Error in /start command:", error);
    ctx.reply('দুঃখিত, একটি সমস্যা হয়েছে।');
  }
});

// বট চালু করা
bot.launch().then(() => {
  console.log('Telegraf bot is running...');
});

// বটের জন্য স্টপ সিগন্যাল হ্যান্ডলিং
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
