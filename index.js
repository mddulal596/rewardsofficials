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

// -------------------------------------------------------------
// আপনার টেলিগ্রাম বটের নতুন টোকেনটি নিচের কোটেশনের ভেতরে বসিয়ে দিন
// -------------------------------------------------------------
const BOT_TOKEN = "9217390232:AAGLwFu8D-0qTTjqoiyI8TY_h0UFgsLbg30"; 

if (!BOT_TOKEN || BOT_TOKEN === "YOUR_NEW_BOT_TOKEN_HERE") {
  console.error("Error: BOT_TOKEN is missing or not set!");
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

// ১. /start কমান্ড হ্যান্ডলার (অ্যাকাউন্ট রেজিস্ট্রেশন)
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

// ২. /balance কমান্ড হ্যান্ডলার
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

// ৩. /daily ডেইলি বোনাস ফিচার
bot.command('daily', async (ctx) => {
  try {
    const telegramId = String(ctx.from.id);
    const userRef = doc(db, 'users', telegramId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      return ctx.reply('প্রথমে /start কমান্ড দিয়ে অ্যাকাউন্ট তৈরি করুন।');
    }

    const userData = docSnap.data();
    const lastClaim = userData.lastDailyClaim ? userData.lastDailyClaim.toDate() : null;
    const now = new Date();

    if (lastClaim && (now - lastClaim < 24 * 60 * 60 * 1000)) {
      return ctx.reply('⏳ আপনি আজ ইতিমধ্যে ডেইলি বোনাস নিয়েছেন! আগামী ২৪ ঘণ্টা পর আবার চেষ্টা করুন।');
    }

    const currentBalance = userData.balance || 0;
    const bonusAmount = 0.50;

    await setDoc(userRef, {
      balance: currentBalance + bonusAmount,
      lastDailyClaim: serverTimestamp()
    }, { merge: true });

    ctx.reply(`🎉 অভিনন্দন! আপনি সফলভাবে ডেইলি বোনাস হিসেবে $${bonusAmount} পেয়েছেন!\n💰 নতুন ব্যালেন্স: $${(currentBalance + bonusAmount).toFixed(2)}`);
  } catch (error) {
    console.error("Error in daily bonus:", error);
    ctx.reply('ডেইলি বোনাস নিতে সমস্যা হয়েছে।');
  }
});

// ৪. /tasks টাস্ক লিস্ট ও বাটন মেনু
bot.command('tasks', async (ctx) => {
  ctx.reply('📋 নিচের তালিকা থেকে উপলব্ধ টাস্কগুলো সম্পন্ন করুন:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 আমাদের চ্যানেল জয়েন করুন ($0.20)', callback_data: 'task_channel' }],
        [{ text: '🌐 ওয়েবসাইট ভিজিট করুন ($0.10)', callback_data: 'task_website' }],
        [{ text: '👥 বন্ধুকে রেফার করুন', callback_data: 'referral_info' }]
      ]
    }
  });
});

// টাস্ক বাটন অ্যাকশন হ্যান্ডলার
bot.action('task_channel', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('দয়া করে আমাদের চ্যানেলে জয়েন করুন এবং আপনার টাস্ক সম্পন্ন করুন: https://t.me/your_channel_link');
});

bot.action('task_website', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply('নিচের লিংকে ক্লিক করে ওয়েবসাইট ভিজিট করুন: https://rewardsofficials.onrender.com');
});

bot.action('referral_info', async (ctx) => {
  await ctx.answerCbQuery();
  const telegramId = ctx.from.id;
  ctx.reply(`🔗 আপনার রেফারেল লিংক:\nhttps://t.me/${ctx.botInfo.username}?start=${telegramId}\n\nপ্রতিটি রেফারে পাবেন $0.50 বোনাস!`);
});

// বট চালু করা
bot.launch()
  .then(() => {
    console.log('RewardOfficials Bot is running successfully with all features!');
  })
  .catch((err) => {
    console.error('Failed to launch bot:', err);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
