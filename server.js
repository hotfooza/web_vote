const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-admin-code');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CANDIDATES_FILE = path.join(DATA_DIR, 'candidates.json');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

// Default initial data
function getDefaultCategories() {
  const maleCandidates = Array.from({ length: 20 }, (_, i) => ({
    id: `cmd_m_${i + 1}`,
    number: i + 1,
    name: `ผู้ลงสมัครชาย ${String(i + 1).padStart(2, '0')}`,
    description: `ผู้รับการเสนอชื่อรางวัล Commander's Award (ชาย)`
  }));

  const femaleCandidates = Array.from({ length: 20 }, (_, i) => ({
    id: `cmd_f_${i + 1}`,
    number: i + 1,
    name: `ผู้ลงสมัครหญิง ${String(i + 1).padStart(2, '0')}`,
    description: `ผู้รับการเสนอชื่อรางวัล Commander's Award (หญิง)`
  }));

  const ndcSubCategories = [
    { id: 'ndc_academic', title: 'รางวัลวิชาการยอดเยี่ยม' },
    { id: 'ndc_activity', title: 'รางวัลกิจกรรมสัมพันธ์รุ่นยอดเยี่ยม' },
    { id: 'ndc_csr', title: 'รางวัล CSR ยอดเยี่ยม' },
    { id: 'ndc_sports', title: 'รางวัลผู้ส่งเสริมสุขภาพและน้ำใจนักกีฬายอดเยี่ยม' },
    { id: 'ndc_ethics', title: 'รางวัลต้นแบบคุณธรรม' },
    { id: 'ndc_supporter', title: 'รางวัลผู้สนับสนุนรุ่นยอดเยี่ยม' },
    { id: 'ndc_popular', title: 'รางวัลขวัญใจมหาชน' },
    { id: 'ndc_social', title: 'รางวัลผู้นำมิติด้านสังคมยอดเยี่ยม' },
    { id: 'ndc_scitech', title: 'รางวัลผู้นำมิติด้านวิทยาศาสตร์เทคโนโลยีและนวัตกรรมยอดเยี่ยม' },
    { id: 'ndc_econ', title: 'รางวัลผู้นำมิติด้านเศรษฐกิจยอดเยี่ยม' },
    { id: 'ndc_env', title: 'รางวัลผู้นำมิติด้านทรัพยากรธรรมชาติและสิ่งแวดล้อมยอดเยี่ยม' },
    { id: 'ndc_pol', title: 'รางวัลผู้นำมิติด้านการเมือง การปกครองยอดเยี่ยม' },
    { id: 'ndc_sec', title: 'รางวัลผู้นำมิติด้านการทหารและความมั่นคงยอดเยี่ยม' }
  ];

  const categories = [
    {
      id: 'cmd_male',
      title: "Commander's Award (ชาย)",
      group: "หมวดที่ 1: Commander's Award",
      candidates: maleCandidates
    },
    {
      id: 'cmd_female',
      title: "Commander's Award (หญิง)",
      group: "หมวดที่ 1: Commander's Award",
      candidates: femaleCandidates
    }
  ];

  ndcSubCategories.forEach(sub => {
    categories.push({
      id: sub.id,
      title: sub.title,
      group: "หมวดที่ 2: NDC's Award",
      candidates: [
        { id: `${sub.id}_c1`, number: 1, name: `ผู้ลงสมัคร ${sub.title} ท่านที่ 1`, description: '' },
        { id: `${sub.id}_c2`, number: 2, name: `ผู้ลงสมัคร ${sub.title} ท่านที่ 2`, description: '' },
        { id: `${sub.id}_c3`, number: 3, name: `ผู้ลงสมัคร ${sub.title} ท่านที่ 3`, description: '' },
        { id: `${sub.id}_c4`, number: 4, name: `ผู้ลงสมัคร ${sub.title} ท่านที่ 4`, description: '' },
        { id: `${sub.id}_c5`, number: 5, name: `ผู้ลงสมัคร ${sub.title} ท่านที่ 5`, description: '' }
      ]
    });
  });

  return categories;
}

function getDefaultUsers() {
  return [
    { code: '99995', name: 'ผู้ดูแลระบบ (Admin)', isAdmin: true, hasVoted: false }
  ];
}

// Helpers for Reading/Writing JSON files safely
function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize files if missing
function initData() {
  readJSON(USERS_FILE, getDefaultUsers());
  readJSON(CANDIDATES_FILE, getDefaultCategories());
  readJSON(VOTES_FILE, []);
}

initData();

// ================= API ENDPOINTS =================

// 1. Auth Login
app.post('/api/login', (req, res) => {
  const { code } = req.body;
  if (!code || code.trim().length !== 5) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสประจำตัว 5 หลัก' });
  }

  const cleanCode = code.trim();
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.code === cleanCode);

  if (!user) {
    return res.status(401).json({ success: false, message: 'ไม่พบรหัสประจำตัวนี้ในระบบ กรุณาติดต่อ Admin' });
  }

  return res.json({
    success: true,
    user: {
      code: user.code,
      name: user.name,
      isAdmin: !!user.isAdmin,
      hasVoted: !!user.hasVoted
    }
  });
});

// 2. Get Categories & Candidates for voting
app.get('/api/candidates', (req, res) => {
  const categories = readJSON(CANDIDATES_FILE, []);
  res.json({ success: true, categories });
});

// 3. User Submit Vote
app.post('/api/vote', (req, res) => {
  const { userCode, choices } = req.body;
  if (!userCode || !choices || typeof choices !== 'object') {
    return res.status(400).json({ success: false, message: 'ข้อมูลการโหวตไม่ถูกต้อง' });
  }

  const users = readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.code === userCode);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานในระบบ' });
  }

  if (users[userIndex].hasVoted) {
    return res.status(400).json({ success: false, message: 'คุณได้ทำการโหวตไปแล้ว ไม่สามารถโหวตซ้ำได้' });
  }

  const categories = readJSON(CANDIDATES_FILE, []);
  const missingCategories = categories.filter(cat => !choices[cat.id]);
  if (missingCategories.length > 0) {
    return res.status(400).json({
      success: false,
      message: `กรุณาเลือกผู้ลงสมัครให้ครบทุกหัวข้อ (ยังไม่ได้เลือก: ${missingCategories.map(c => c.title).join(', ')})`
    });
  }

  // Record Anonymous Votes
  const votes = readJSON(VOTES_FILE, []);
  const timestamp = new Date().toISOString();

  Object.entries(choices).forEach(([categoryId, candidateId]) => {
    votes.push({
      categoryId,
      candidateId,
      timestamp
    });
  });

  // Mark User as Voted
  users[userIndex].hasVoted = true;
  users[userIndex].votedAt = timestamp;

  writeJSON(VOTES_FILE, votes);
  writeJSON(USERS_FILE, users);

  res.json({ success: true, message: 'บันทึกการโหวตสำเร็จเรียบร้อยแล้ว!' });
});

// 4. Get Top 3 Candidates per Category (Post-Vote View for Users)
app.get('/api/top3', (req, res) => {
  const categories = readJSON(CANDIDATES_FILE, []);
  const votes = readJSON(VOTES_FILE, []);

  const scoreMap = {};
  votes.forEach(v => {
    const key = `${v.categoryId}_${v.candidateId}`;
    scoreMap[key] = (scoreMap[key] || 0) + 1;
  });

  const results = categories.map(cat => {
    const rankedCandidates = cat.candidates.map(cand => {
      const count = scoreMap[`${cat.id}_${cand.id}`] || 0;
      return { ...cand, votes: count };
    }).sort((a, b) => b.votes - a.votes);

    return {
      id: cat.id,
      title: cat.title,
      group: cat.group,
      top3: rankedCandidates.slice(0, 3)
    };
  });

  res.json({ success: true, results });
});

// ================= ADMIN API ENDPOINTS =================

function checkAdmin(req, res, next) {
  const adminCode = req.headers['x-admin-code'];
  if (adminCode !== '99995') {
    return res.status(403).json({ success: false, message: 'สิทธิ์การใช้งานเฉพาะ Admin เท่านั้น' });
  }
  next();
}

app.get('/api/admin/users', checkAdmin, (req, res) => {
  const users = readJSON(USERS_FILE, []);
  res.json({ success: true, users });
});

app.post('/api/admin/users', checkAdmin, (req, res) => {
  const { code, name } = req.body;
  if (!code || code.trim().length !== 5 || !name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสประจำตัว 5 หลัก และชื่อ-นามสกุล' });
  }

  const cleanCode = code.trim();
  const users = readJSON(USERS_FILE, []);
  if (users.some(u => u.code === cleanCode)) {
    return res.status(400).json({ success: false, message: 'รหัสประจำตัวนี้มีในระบบแล้ว' });
  }

  const newUser = { code: cleanCode, name: name.trim(), isAdmin: false, hasVoted: false };
  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.json({ success: true, message: 'เพิ่มผู้ใช้งานสำเร็จ', user: newUser });
});

app.post('/api/admin/users/bulk', checkAdmin, (req, res) => {
  const { userText } = req.body; // Multiline string e.g. "10051,นายสมชาย\n10052,นายสมศักดิ์"
  if (!userText || typeof userText !== 'string') {
    return res.status(400).json({ success: false, message: 'ข้อมูลไม่ถูกต้อง' });
  }

  const users = readJSON(USERS_FILE, []);
  const lines = userText.split('\n');
  let addedCount = 0;
  let skippedCount = 0;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let code = '';
    let name = '';

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',');
      code = parts[0].trim();
      name = parts.slice(1).join(',').trim();
    } else if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t');
      code = parts[0].trim();
      name = parts.slice(1).join('\t').trim();
    } else {
      const parts = trimmed.split(/\s+/);
      code = parts[0].trim();
      name = parts.slice(1).join(' ').trim();
    }

    if (code.length === 5 && name) {
      if (!users.some(u => u.code === code)) {
        users.push({ code, name, isAdmin: false, hasVoted: false });
        addedCount++;
      } else {
        skippedCount++;
      }
    }
  });

  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: `เพิ่มสำเร็จ ${addedCount} รายการ (ข้ามรหัสซ้ำ ${skippedCount} รายการ)` });
});

// Update User (Admin)
app.put('/api/admin/users/:code', checkAdmin, (req, res) => {
  const { code } = req.params;
  const { name, newCode } = req.body;

  const users = readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.code === code);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });
  }

  if (name && name.trim()) {
    users[userIndex].name = name.trim();
  }

  if (newCode && newCode.trim() && newCode.trim() !== code) {
    const cleanNewCode = newCode.trim();
    if (cleanNewCode.length !== 5) {
      return res.status(400).json({ success: false, message: 'รหัสประจำตัวต้องมี 5 หลัก' });
    }
    if (users.some(u => u.code === cleanNewCode)) {
      return res.status(400).json({ success: false, message: 'รหัสใหม่นี้ถูกใช้งานแล้ว' });
    }
    users[userIndex].code = cleanNewCode;
  }

  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: 'แก้ไขข้อมูลสมาชิกสำเร็จเรียบร้อยแล้ว', user: users[userIndex] });
});

// Reset Individual User Vote Status (Admin)
app.post('/api/admin/users/:code/reset-vote', checkAdmin, (req, res) => {
  const { code } = req.params;

  const users = readJSON(USERS_FILE, []);
  const userIndex = users.findIndex(u => u.code === code);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });
  }

  users[userIndex].hasVoted = false;
  delete users[userIndex].votedAt;

  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: `คืนสิทธิ์การโหวตให้ผู้ใช้ ${users[userIndex].name} เรียบร้อยแล้ว`, user: users[userIndex] });
});

app.delete('/api/admin/users/:code', checkAdmin, (req, res) => {
  const { code } = req.params;
  if (code === '99995') {
    return res.status(400).json({ success: false, message: 'ไม่สามารถลบผู้ดูแลระบบหลักได้' });
  }

  let users = readJSON(USERS_FILE, []);
  const initialLength = users.length;
  users = users.filter(u => u.code !== code);

  if (users.length === initialLength) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });
  }

  writeJSON(USERS_FILE, users);
  res.json({ success: true, message: 'ลบผู้ใช้งานเรียบร้อย' });
});

app.get('/api/admin/unvoted', checkAdmin, (req, res) => {
  const users = readJSON(USERS_FILE, []);
  const unvoted = users.filter(u => !u.isAdmin && !u.hasVoted);
  const voted = users.filter(u => !u.isAdmin && u.hasVoted);
  res.json({
    success: true,
    totalVoters: users.filter(u => !u.isAdmin).length,
    votedCount: voted.length,
    unvotedCount: unvoted.length,
    unvotedUsers: unvoted
  });
});

app.post('/api/admin/candidates', checkAdmin, (req, res) => {
  const { categoryId, name, description, number } = req.body;
  if (!categoryId || !name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกหมวดหมู่และชื่อผู้สมัคร' });
  }

  const categories = readJSON(CANDIDATES_FILE, []);
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) {
    return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่รางวัล' });
  }

  const newCandId = `${categoryId}_${Date.now()}`;
  const candNumber = number || (cat.candidates.length + 1);

  const newCand = {
    id: newCandId,
    number: Number(candNumber),
    name: name.trim(),
    description: description ? description.trim() : ''
  };

  cat.candidates.push(newCand);
  writeJSON(CANDIDATES_FILE, categories);

  res.json({ success: true, message: 'เพิ่มผู้ลงสมัครเรียบร้อยแล้ว', candidate: newCand });
});

app.delete('/api/admin/candidates/:categoryId/:id', checkAdmin, (req, res) => {
  const { categoryId, id } = req.params;
  const categories = readJSON(CANDIDATES_FILE, []);
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) {
    return res.status(404).json({ success: false, message: 'ไม่พบหมวดหมู่รางวัล' });
  }

  cat.candidates = cat.candidates.filter(c => c.id !== id);
  writeJSON(CANDIDATES_FILE, categories);
  res.json({ success: true, message: 'ลบผู้ลงสมัครเรียบร้อยแล้ว' });
});

app.get('/api/admin/results', checkAdmin, (req, res) => {
  const categories = readJSON(CANDIDATES_FILE, []);
  const votes = readJSON(VOTES_FILE, []);

  const scoreMap = {};
  votes.forEach(v => {
    const key = `${v.categoryId}_${v.candidateId}`;
    scoreMap[key] = (scoreMap[key] || 0) + 1;
  });

  const fullResults = categories.map(cat => {
    const rankedCandidates = cat.candidates.map(cand => {
      const count = scoreMap[`${cat.id}_${cand.id}`] || 0;
      return { ...cand, votes: count };
    }).sort((a, b) => b.votes - a.votes);

    return {
      id: cat.id,
      title: cat.title,
      group: cat.group,
      totalCategoryVotes: cat.candidates.reduce((sum, c) => sum + (scoreMap[`${cat.id}_${c.id}`] || 0), 0),
      rankings: rankedCandidates
    };
  });

  res.json({ success: true, results: fullResults });
});

app.post('/api/admin/reset', checkAdmin, (req, res) => {
  const { resetCode } = req.body;
  if (resetCode !== '000001') {
    return res.status(400).json({ success: false, message: 'รหัสยืนยันการ Reset ไม่ถูกต้อง (ต้องใช้รหัส 000001)' });
  }

  writeJSON(VOTES_FILE, []);

  const users = readJSON(USERS_FILE, []);
  users.forEach(u => {
    u.hasVoted = false;
    delete u.votedAt;
  });
  writeJSON(USERS_FILE, users);

  res.json({ success: true, message: 'ทำการ Reset คะแนนโหวตและสิทธิ์การโหวตของผู้ใช้ทั้งหมดเรียบร้อยแล้ว!' });
});

app.post('/api/admin/reset-candidates', checkAdmin, (req, res) => {
  const { resetCode } = req.body;
  if (resetCode !== '000001') {
    return res.status(400).json({ success: false, message: 'รหัสยืนยันการ Reset ไม่ถูกต้อง (ต้องใช้รหัส 000001)' });
  }

  const defaultCategories = getDefaultCategories();
  writeJSON(CANDIDATES_FILE, defaultCategories);

  res.json({ success: true, message: 'ทำการ Reset รายชื่อผู้สมัครโหวตทั้งหมดกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว!' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const https = require('https');
const http = require('http');

// Server Keep-Alive Self-Ping (Ping server every 30 seconds to keep Render awake 24/7)
setInterval(() => {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || 'https://web-vote.onrender.com/api/candidates';
  const client = targetUrl.startsWith('https') ? https : http;
  client.get(targetUrl, () => {}).on('error', () => {});
}, 30000);

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  Voting System Server running on port ${PORT}`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Data Storage: ${DATA_DIR}`);
  console.log(`===================================================`);
});
