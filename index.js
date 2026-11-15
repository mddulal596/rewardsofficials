const { Telegraf } = require('telegraf');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');
const express = require('express'); // এক্সপ্রেস সার্ভার যোগ করা হলো রেন্ডার পোর্টের জন্য

const app = express();
const PORT = process.env.PORT || 8080;

// একটি ডামি রুট রাখা হলো যাতে রেন্ডার পোর্ট ওপেন পায়
app.get('/', (req, res) => {
  res.send('RewardOfficials Telegram Bot is running successfully!');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// টেলিগ্রাম বট টোকেন সরাসরি কোডে সেট করা
const BOT_TOKEN = "9217390232:AAF46GElCmGP9mp81d0CP85BEKgUB7DEaRg"; 
if (!BOT_TOKEN) {
  console.error("Error: BOT_TOKEN is missing!");
  process.exit(1);
}

// ফায়ারবেস ওয়েব কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyDBCZZAebuQ3i66C8UNp9qdBI79RS7KHcc",
  authDomain: "rewardsofficials.firebaseapp.com",
  projectId: "rewardsofficials",
  storageBucket: "rewardsofficials.firebasestorage.app",
  messagingSenderId: "17078908900",
  appId: "1:17078908900:web:4a11cc8c4f41fac5ceb9f1"
};

// ফায়ারবেস ইনিশিয়ালাইজ
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
console.log("Firebase initialized successfully via Web SDK.");

const bot = new Telegraf(BOT_TOKEN);

// /start কমান্ড হ্যান্ডলার
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
      ctx.reply('স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। 🎉');
    } else {
      ctx.reply('স্বাগতম! আপনি আগেই আমাদের সিস্টেমে রেজিস্টার্ড আছেন। 😊');
    }
  } catch (error) {
    console.error("Error in /start command:", error);
    ctx.reply('দুঃখিত, একটি প্রযুক্তিগত সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
  }
});

// /balance কমান্ড হ্যান্ডলার
bot.command('balance', async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const userRef = doc(db, 'users', telegramId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      ctx.reply(`💰 আপনার বর্তমান ব্যালেন্স: $${data.balance || 0}\n✅ সম্পন্ন টাস্ক: ${data.tasksDone || 0} টি`);
    } else {
      ctx.reply('প্রথমে /start কমান্ড দিয়ে আপনার অ্যাকাউন্ট রেজিস্টার করুন।');
    }
  } catch (error) {
    console.error("Error in /balance command:", error);
    ctx.reply('ব্যালেন্স চেক করতে সমস্যা হচ্ছে।');
  }
});

// বট চালু করা
bot.launch()
  .then(() => {
    console.log('RewardOfficials Bot is running successfully!');
  })
  .catch((err) => {
    console.error('Failed to launch bot:', err);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
