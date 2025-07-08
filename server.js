// backend/server.js
const express = require('express');
const { fileURLToPath } = require('url');
const { dirname, join }  = require('path');
const postsRouter = require('./routes/posts.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/api/posts', postsRouter);

const clientBuildPath = join(__dirname, '../build');
app.use(express.static(clientBuildPath));
app.get('*', (_, res) => res.sendFile(join(clientBuildPath, 'index.html')));

app.listen(PORT, () => console.log(`Server up on ${PORT}`));
