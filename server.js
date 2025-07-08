const express = require('express');
const cors    = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS・プリフライト対応
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://brownquartz.github.io',
  'https://post-share-backend-production.up.railway.app'
]

app.use(cors({
  origin: (origin, callback) => {
    // origin が空（同一オリジンのAPIテスト等）の場合も許可
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS: ' + origin))
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}))

app.options('/{*any}', cors())

// JSON ボディを受け取れるように
app.use(express.json());

// CRUD は routes/posts.js に丸投げ
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// 404 ハンドリング（オプション）
app.use((req, res) => {
  res.status(404).json({ status: 'error', code: 404, message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
