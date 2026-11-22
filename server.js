const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 60 * 1024 * 1024
});

const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const UPLOAD_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const AUDIO_ASSETS_DIR = path.join(PUBLIC_DIR, 'assets', 'audio');
const MESSAGES_DB_FILE = path.join(DATA_DIR, 'messages.json');

for (const dir of [PUBLIC_DIR, UPLOAD_DIR, DATA_DIR, AUDIO_ASSETS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOAD_DIR));

const USERS = Object.freeze({
  mim: {
    username: 'mim',
    password: '12345',
    displayName: 'Mim',
    role: 'viewer',
    canImpersonate: false,
    redirectTo: '/story.html'
  },
  sam: {
    username: 'sam',
    password: 'sizan',
    displayName: 'Sam',
    role: 'sender',
    canImpersonate: true,
    redirectTo: '/chat.html'
  }
});

const MAX_MESSAGES = 1000;

function loadMessagesFromDisk() {
  try {
    if (fs.existsSync(MESSAGES_DB_FILE)) {
      const raw = fs.readFileSync(MESSAGES_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(-MAX_MESSAGES);
      }
    }
  } catch (err) {
    console.error('Failed to load messages.json:', err.message);
  }
  return [];
}

function saveMessagesToDisk(list) {
  try {
    const tempFile = `${MESSAGES_DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tempFile, MESSAGES_DB_FILE);
  } catch (err) {
    console.error('Failed to save messages.json:', err.message);
  }
}

let messages = loadMessagesFromDisk();

function sanitizeFilename(originalName = 'file') {
  const base = path.basename(String(originalName));
  return base.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload_file';
}

function formatCurrentTime() {
  return new Date().toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function safeUnlinkUpload(mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== 'string') return;
  if (!mediaUrl.startsWith('/uploads/')) return;
  const relativeName = mediaUrl.replace(/^\/uploads\//, '');
  const resolvedPath = path.resolve(UPLOAD_DIR, relativeName);
  if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return;
  }
  fs.stat(resolvedPath, (err) => {
    if (!err) {
      fs.unlink(resolvedPath, () => {});
    }
  });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, file, cb) {
    const cleanName = sanitizeFilename(file.originalname);
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniquePrefix}-${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 60 * 1024 * 1024
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    messageCount: messages.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    return res.status(400).json({
      success: false,
      message: 'ইউজারনেম এবং পাসওয়ার্ড উভয়ই প্রয়োজন।'
    });
  }

  const account = USERS[cleanUser];
  if (!account || account.password !== cleanPass) {
    return res.status(401).json({
      success: false,
      message: 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।'
    });
  }

  return res.json({
    success: true,
    user: {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      canImpersonate: account.canImpersonate,
      redirectTo: account.redirectTo
    }
  });
});

app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'আপলোড করার জন্য কোনো ফাইল পাওয়া যায়নি।'
    });
  }

  return res.json({
    success: true,
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size
  });
});

app.use((err, _req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'ফাইলের সাইজ ৬০ MB-এর বেশি হতে পারবে না।'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'ফাইল আপলোডে সমস্যা হয়েছে।'
    });
  }
  next();
});

app.get('/api/get-media', (_req, res) => {
  fs.readdir(AUDIO_ASSETS_DIR, (err, files) => {
    if (err || !Array.isArray(files) || files.length === 0) {
      return res.json({ found: false, file: null, files: [] });
    }

    const mediaFiles = files
      .filter((f) => !f.startsWith('.'))
      .filter((f) => /\.(mp3|wav|ogg|m4a|webm|mp4)$/i.test(f));

    if (mediaFiles.length === 0) {
      return res.json({ found: false, file: null, files: [] });
    }

    return res.json({
      found: true,
      file: `/assets/audio/${mediaFiles[0]}`,
      files: mediaFiles.map((name) => `/assets/audio/${name}`)
    });
  });
});

io.on('connection', (socket) => {
  socket.emit('init_messages', messages);

  socket.on('typing_status', (payload) => {
    const actor = payload?.actor === 'sam' ? 'sam' : 'mim';
    const isTyping = Boolean(payload?.isTyping);
    socket.broadcast.emit('peer_typing', { actor, isTyping });
  });

  socket.on('send_message', (rawData) => {
    const data = rawData || {};
    const loggedInRole = data.loggedInUser === 'sam' ? 'sam' : 'mim';

    const sender = loggedInRole === 'sam' && data.sender === 'mim' ? 'mim' : loggedInRole === 'sam' ? 'sam' : 'mim';

    const msgType = ['text', 'image', 'video', 'audio', 'file', 'media'].includes(data.type)
      ? data.type
      : 'text';

    const cleanText = String(data.text || '').trim();
    const cleanMediaUrl = String(data.mediaUrl || '').trim();

    if (msgType === 'text' && !cleanText) return;
    if (msgType !== 'text' && !cleanMediaUrl) return;

    const newMessage = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sender,
      loggedInUser: loggedInRole,
      type: msgType,
      text: cleanText,
      mediaUrl: cleanMediaUrl,
      mediaName: String(data.mediaName || '').trim(),
      mimeType: String(data.mimeType || '').trim(),
      time: formatCurrentTime(),
      edited: false,
      status: 'delivered'
    };

    messages.push(newMessage);
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(messages.length - MAX_MESSAGES);
    }

    saveMessagesToDisk(messages);
    io.emit('new_message', newMessage);
  });

  socket.on('edit_message', (payload) => {
    const id = String(payload?.id || '').trim();
    const newText = String(payload?.newText || '').trim();
    if (!id || !newText) return;

    const target = messages.find((m) => m.id === id);
    if (!target || target.type !== 'text') return;

    target.text = newText;
    target.edited = true;
    target.editedAt = formatCurrentTime();
    saveMessagesToDisk(messages);
    io.emit('message_edited', target);
  });

  socket.on('delete_message', (id) => {
    const cleanId = String(id || '').trim();
    if (!cleanId) return;

    const idx = messages.findIndex((m) => m.id === cleanId);
    if (idx === -1) return;

    const [removed] = messages.splice(idx, 1);
    if (removed && removed.mediaUrl) {
      safeUnlinkUpload(removed.mediaUrl);
    }
    saveMessagesToDisk(messages);
    io.emit('message_deleted', cleanId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} (Persistent DB: ${MESSAGES_DB_FILE})`);
});