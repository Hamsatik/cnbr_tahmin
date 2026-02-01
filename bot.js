const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const TOKEN = '8356724745:AAEIy79syAV1UwzxRTE_a-3DpazXewx8LGQ';
const bot = new TelegramBot(TOKEN, { polling: true });

const POSTS_FILE = './posts.json';

const CHANNELS = [
  '@cnbr_yorum'
];

if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify({}));
}

async function savePostWithMedia(postId, data) {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE));

  if (data.fileId && !data.fileUrl) {
    const file = await bot.getFile(data.fileId);
    data.fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;
  }

  posts[postId] = data;
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

bot.on('message', async (msg) => {
  const postId = uuidv4();

  const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;

    const commentUrl =`https://tamie-presphenoid-shonta.ngrok-free.dev/comment/${postId}?uid=${userId}&u=${username}`;
    

  const replyMarkup = {
    reply_markup: {
      inline_keyboard: [[
        { text: '💬 Yorum Yap (0)', url: commentUrl }
      ]]
    }
  };

  // 📝 METİN
  if (msg.text) {
    CHANNELS.forEach(channel => {
      bot.sendMessage(channel, msg.text, replyMarkup)
        .then(sent => {
          savePostWithMedia(postId, {
            type: 'text',
            text: msg.text,
            channelId: sent.chat.id,
            messageId: sent.message_id
          });
        });
    });
  }

  // 🖼 FOTO
  else if (msg.photo) {
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    const caption = msg.caption || '';

    CHANNELS.forEach(channel => {
      bot.sendPhoto(channel, photoId, {
        caption,
        reply_markup: replyMarkup.reply_markup
      }).then(sent => {
        savePostWithMedia(postId, {
          type: 'photo',
          text: caption,
          fileId: photoId,
          channelId: sent.chat.id,
          messageId: sent.message_id
        });
      });
    });
  }

  // 🎥 VİDEO
  else if (msg.video) {
    const videoId = msg.video.file_id;
    const caption = msg.caption || '';

    CHANNELS.forEach(channel => {
      bot.sendVideo(channel, videoId, {
        caption,
        reply_markup: replyMarkup.reply_markup
      }).then(sent => {
        savePostWithMedia(postId, {
          type: 'video',
          text: caption,
          fileId: videoId,
          channelId: sent.chat.id,
          messageId: sent.message_id
        });
      });
    });
  }
});
