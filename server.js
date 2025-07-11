// server.js
const express     = require('express');
const cors        = require('cors');
const postsRouter = require('./routes/posts.js');
const app         = express();
const PORT        = process.env.PORT || 4000;

// ① GitHub Pages のオリジンだけ許可
const allowedOrigins = [
  'https://brownquartz.github.io'
];

app.use(cors({
  origin: (origin, callback) => {
    // origin が空（curl 等）の場合も許可
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS: ' + origin));
  }
}));
app.options('*', cors());

// ② JSON パーサー＋API
app.use(express.json());
app.use('/api/posts', postsRouter);

// （必要ならヘルスチェックも）
app.get('/__health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Server up on ${PORT}`);
});
