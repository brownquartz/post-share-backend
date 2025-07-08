import express from 'express';
import cors    from 'cors';
import postsRouter from './routes/posts.js';

const app = express();

// 全オリジンを一時的に許可
app.use(cors());
app.options('*', cors());

app.get('/__health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.json());
app.use('/api/posts', postsRouter);

app.listen(process.env.PORT||4000, () =>
  console.log('🚀 Server up on', process.env.PORT||4000)
);
