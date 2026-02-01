const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const BOT_TOKEN = 'xxxxx';
const bot = new TelegramBot(BOT_TOKEN);


const POSTS_FILE = './posts.json';
const PREDICTIONS_FILE = './predictions.json';

if (!fs.existsSync(PREDICTIONS_FILE)) {
  fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify({}));
}


app.get('/', (req, res) => {
  res.send('Server çalışıyor 🚀');
});

// 🔄 Yorum sayısını butonda güncelle




function updateButton(postId) {
  const predictions = JSON.parse(fs.readFileSync(PREDICTIONS_FILE));
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE));

  const post = posts[postId];
  if (!post) return;

  const count = predictions[postId]?.length || 0;

  const keyboard = {
    inline_keyboard: [[
      {
        text: `⚽ Tahmin Yap (${count})`,
        url: `https://tamie-presphenoid-shonta.ngrok-free.dev/comment/${postId}`
      }
    ]]
  };

  try {
    if (post.type === 'text') {
      bot.editMessageText(post.text, {
        chat_id: post.channelId,
        message_id: post.messageId,
        reply_markup: keyboard
      });
    } else {
      bot.editMessageCaption(post.text || '', {
        chat_id: post.channelId,
        message_id: post.messageId,
        reply_markup: keyboard
      });
    }
  } catch (e) {
    console.log('Telegram update error:', e.message);
  }
}

// 💬 Yorum sayfası
app.get('/comment/:postId', (req, res) => {
    
  const postId = req.params.postId;
  const error = req.query.error;
  const telegramId = req.query.uid;
  const telegramUsername = req.query.u;
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE));
const predictions = JSON.parse(fs.readFileSync(PREDICTIONS_FILE));
const postPredictions = predictions[postId] || [];
  const post = posts[postId];
console.log ='hata burda';

  let mediaHtml = '';

  if (post?.type === 'photo') {
    mediaHtml = `<img src="${post.fileUrl}" class="media" />`;
  }

  if (post?.type === 'video') {
    mediaHtml = `
      <video controls class="media">
        <source src="${post.fileUrl}" type="video/mp4">
      </video>
    `;
  }

  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yorumlar</title>

<style>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  background: #111827;
  padding: 24px;
  border-radius: 14px;
  max-width: 320px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,.5);
}

.modal h3 {
  margin-top: 0;
}

.modal p {
  color: #9ca3af;
  font-size: .95rem;
}

.modal button {
  margin-top: 16px;
  background: #3b82f6;
  border: none;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  color: white;
  font-weight: bold;
  cursor: pointer;
}
body { background:#020617; color:#e5e7eb; font-family:sans-serif; padding:16px }
.container { max-width:600px; margin:auto }
.card { background:#111827; padding:20px; border-radius:14px; margin-bottom:16px }
.media { width:100%; border-radius:12px; margin-bottom:12px }
input, textarea, button {
  width:100%; padding:12px; margin-bottom:10px;
  border-radius:10px; border:none
}
button { background:#3b82f6; color:white; font-weight:bold }
.comment { border-top:1px solid #1f2933; padding-top:10px; margin-top:10px }
.user { font-weight:bold }
.text { color:#9ca3af }
</style>
</head>

<body>
<div class="container">
${error === 'already' ? `
<div class="modal-backdrop" id="modal">
  <div class="modal">
    <h3>⚠️ Uyarı</h3>
    <p>Bu gönderiye zaten yorum yaptın.</p>
    <button onclick="closeModal()">Tamam</button>
  </div>
</div>
` : ''}
  <div class="card">
    ${mediaHtml}
    <p>${post?.text || ''}</p>
  </div>

  <div class="card">



    <form method="POST">
<input type="hidden" name="telegramId" value="${telegramId}" />
  <input type="hidden" name="username" value="${telegramUsername}" />
<div style="display:flex; gap:10px"> 
<input type="text" name="rumuz" placeholder="Coinbar Kullanıcı Adı" required="">
</div>
  <div style="display:flex; gap:10px">
    <input type="number" name="home" placeholder="Ev Sahibi" required>
    <input type="number" name="away" placeholder="Deplasman" required>
  </div>

  <button type="submit">Tahmini Gönder</button>
</form>

  </div>

  <div class="card">

<h3>Tahminler (${postPredictions.length})</h3>
${postPredictions.map(p => `
  <div class="comment">
    <div class="user">${p.username}</div>
    <div class="text">${p.home} - ${p.away}</div>
  </div>
`).join('')}

  </div>

</div>
</body>
<script>
  function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.remove();

    // URL'deki error parametresini temizle
    const url = new URL(window.location);
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url);
  }
</script>
</html>
`);

});







// 📩 Yorum gönderme


app.post('/comment/:postId', (req, res) => {
  const postId = req.params.postId;
  const { telegramId, username, rumuz, home, away } = req.body;

  const predictions = JSON.parse(fs.readFileSync(PREDICTIONS_FILE));
  if (!predictions[postId]) predictions[postId] = [];


  // AYNI KULLANICI KONTROLÜ


const alreadyCommented = predictions[postId]
  .some(p => p.telegramId === telegramId);

if (alreadyCommented) {
  return res.redirect(
    `/comment/${postId}?uid=${telegramId}&u=${username}&error=already`
  );
}



  predictions[postId].unshift({
    telegramId,
    username,
    rumuz,
    home: Number(home),
    away: Number(away),
    date: new Date()
  });

  fs.writeFileSync(PREDICTIONS_FILE, JSON.stringify(predictions, null, 2));

  // Yorum sayısı = tahmin sayısı
  setTimeout(() => updateButton(postId), 300);

  //res.redirect(`/comment/${postId}`);
  res.redirect(`/comment/${postId}?uid=${telegramId}&u=${username}`);
});


app.get('/result/:postId', (req, res) => {
  const postId = req.params.postId;
  const { home, away } = req.query;

  if (home === undefined || away === undefined) {
    return res.send('Eksik skor bilgisi');
  }


  const predictions = JSON.parse(
    fs.readFileSync(PREDICTIONS_FILE)
  );

  const list = predictions[postId] || [];

  const winners = list.filter(p =>
    p.home === Number(home) &&
    p.away === Number(away)
  );

  res.send(`
    <h2>Maç Sonucu: ${home} - ${away}</h2>
    <h3>Doğru Tahmin Yapanlar (${winners.length})</h3>

    <ul>
      ${winners.map(w => `<li>${w.username} ( ${w.rumuz} )</li>`).join('')}
    </ul>
  `);
});

app.listen(3000, () => {
  console.log('Server çalışıyor: http://localhost:3000');

});
