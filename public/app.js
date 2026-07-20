/* =========================================================
   VOTING SYSTEM - FIREBASE & LOCAL HYBRID FRONTEND LOGIC
   ========================================================= */

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFaXHzCg9k9jBUon0Mb-Isev_QB-TihsY",
  authDomain: "commander-award-db.firebaseapp.com",
  projectId: "commander-award-db",
  storageBucket: "commander-award-db.firebasestorage.app",
  messagingSenderId: "948009180474",
  appId: "1:948009180474:web:55f8ef9ab7f3e8d94f4403",
  measurementId: "G-SJ8N7X8CGN",
  databaseURL: "https://commander-award-db-default-rtdb.firebaseio.com"
};

let firebaseEnabled = false;
let db = null;

try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    firebaseEnabled = true;
    console.log("Firebase Database initialized successfully!");
  }
} catch (e) {
  console.warn("Firebase initialization warning, falling back to REST API:", e);
}

document.addEventListener('DOMContentLoaded', () => {
  // Master Default Users List
  const defaultUsersList = [
    { code: "99995", name: "ผู้ดูแลระบบ (Admin)", isAdmin: true, hasVoted: false },
    { code: "10627", name: "พล.ต.ต.กฤตัชญ์ บำรุงรัตนยศ", isAdmin: false, hasVoted: false },
    { code: "10628", name: "นาย กฤศ จันทร์สุวรรณ", isAdmin: false, hasVoted: false },
    { code: "10644", name: "พล.ร.ต.เขมชาต พิทักษ์ธรรม", isAdmin: false, hasVoted: false },
    { code: "10667", name: "น.อ.ชนาวีร์ กลิ่นมาลี", isAdmin: false, hasVoted: false },
    { code: "10669", name: "พ.อ.ชวลิต ประดิษฐ์นวกุล", isAdmin: false, hasVoted: false },
    { code: "10694", name: "นาย ดุรงค์ฤทธิ์ ศิริวัฒนพันธ์", isAdmin: false, hasVoted: false },
    { code: "10701", name: "พล.ต.เทวินทร์ เทศนธรรม", isAdmin: false, hasVoted: false },
    { code: "10708", name: "ผศ.พิเศษ นพ.ธนินทร์ เวชชาภินันท์", isAdmin: false, hasVoted: false },
    { code: "10728", name: "นาย นิทัศน์ วรพนพิพัฒน์", isAdmin: false, hasVoted: false },
    { code: "10731", name: "นาง เนตรนภา วรรณชัย", isAdmin: false, hasVoted: false },
    { code: "10734", name: "พล.ท.บรมวิช หิรัณยัษฐิติ", isAdmin: false, hasVoted: false },
    { code: "10747", name: "นาย ประเสริฐ ศิรินภาพร", isAdmin: false, hasVoted: false },
    { code: "10759", name: "น.ส.ปุณยนุช มีมั่งคั่ง", isAdmin: false, hasVoted: false },
    { code: "10768", name: "รศ.ดร.พัทธนันท์ หรรษาภิรมย์โชค", isAdmin: false, hasVoted: false },
    { code: "10770", name: "นาย พิฆเนศ ต๊ะปวง", isAdmin: false, hasVoted: false },
    { code: "10773", name: "พล.ต.พิทยากูล โพธิสุวรรณ", isAdmin: false, hasVoted: false },
    { code: "10775", name: "นาย พิภพ โชควัฒนา", isAdmin: false, hasVoted: false },
    { code: "10794", name: "พ.ต.ต.ยุทธนา แพรดํา", isAdmin: false, hasVoted: false },
    { code: "10812", name: "ดร.วรวุฒิ คงศิลป์", isAdmin: false, hasVoted: false },
    { code: "10815", name: "นาง วลัยพร ศี่ประยูรสกุล", isAdmin: false, hasVoted: false },
    { code: "10838", name: "น.อ.วุฒิกร สุวารี", isAdmin: false, hasVoted: false },
    { code: "10841", name: "น.ส.ศรมน อิงคตานุวัฒน์", isAdmin: false, hasVoted: false },
    { code: "10850", name: "พล.ต.เศรษฐศักดิ์ ดีสุข", isAdmin: false, hasVoted: false },
    { code: "10857", name: "พล.ต.สมพงษ์ สุขประดิษฐ", isAdmin: false, hasVoted: false },
    { code: "10880", name: "นาย สุรพงษ์ เอิมอุทัย", isAdmin: false, hasVoted: false },
    { code: "10882", name: "พล.ต.สุรยา แม้นเหมือน", isAdmin: false, hasVoted: false },
    { code: "10888", name: "นาย อดิศร พิพัฒน์วรพงศ์", isAdmin: false, hasVoted: false },
    { code: "10908", name: "นาย อารีศักดิ์ เสถียรภาพอยุทธ์", isAdmin: false, hasVoted: false },
    { code: "10909", name: "นาย อุกฤษฏ์ วงษ์ทองสาลี", isAdmin: false, hasVoted: false },
    { code: "10919", name: "SLTC NG Kiang Chuan", isAdmin: false, hasVoted: false }
  ];

  // --- CLIENT STORAGE HELPERS FOR STANDALONE STATIC HOSTING ---
  function getClientUsers() {
    const raw = localStorage.getItem('vote_users');
    if (raw) {
      try { return JSON.parse(raw); } catch(e){}
    }
    localStorage.setItem('vote_users', JSON.stringify(defaultUsersList));
    return defaultUsersList;
  }

  function saveClientUsers(users) {
    localStorage.setItem('vote_users', JSON.stringify(users));
  }

  function getClientVotes() {
    const raw = localStorage.getItem('vote_records');
    if (raw) {
      try { return JSON.parse(raw); } catch(e){}
    }
    return [];
  }

  function saveClientVotes(votes) {
    localStorage.setItem('vote_records', JSON.stringify(votes));
  }

  // --- STATE ---
  let currentUser = null;
  let allCategories = [];
  let userChoices = {};

  // --- DOM ELEMENTS ---
  const views = {
    login: document.getElementById('loginScreen'),
    voting: document.getElementById('votingScreen'),
    leaderboard: document.getElementById('leaderboardScreen'),
    admin: document.getElementById('adminScreen')
  };

  const userHeaderBadge = document.getElementById('userHeaderBadge');
  const headerUserName = document.getElementById('headerUserName');
  const btnLogout = document.getElementById('btnLogout');
  const btnAdminLogout = document.getElementById('btnAdminLogout');

  const loginForm = document.getElementById('loginForm');
  const inputCode = document.getElementById('inputCode');

  // Voting Elements
  const userWelcomeTitle = document.getElementById('userWelcomeTitle');
  const votingCategoriesList = document.getElementById('votingCategoriesList');
  const voteProgressText = document.getElementById('voteProgressText');
  const voteProgressBar = document.getElementById('voteProgressBar');
  const btnSubmitVote = document.getElementById('btnSubmitVote');

  // Leaderboard Elements
  const top3Container = document.getElementById('top3Container');

  // Admin Elements
  const adminTabs = document.querySelectorAll('.admin-tab');
  const adminTabContents = document.querySelectorAll('.admin-tab-content');
  const btnRefreshResults = document.getElementById('btnRefreshResults');
  const adminResultsContainer = document.getElementById('adminResultsContainer');
  const unvotedTableBody = document.getElementById('unvotedTableBody');
  const unvotedSummaryText = document.getElementById('unvotedSummaryText');
  const unvotedBadgeCount = document.getElementById('unvotedBadgeCount');
  
  // User Management
  const newCodeInput = document.getElementById('newCode');
  const newNameInput = document.getElementById('newName');
  const btnAddUser = document.getElementById('btnAddUser');
  const usersTableBody = document.getElementById('usersTableBody');

  // Candidate Management
  const adminCategorySelect = document.getElementById('adminCategorySelect');
  const candNumberInput = document.getElementById('candNumber');
  const candNameInput = document.getElementById('candName');
  const candDescInput = document.getElementById('candDesc');
  const btnAddCandidate = document.getElementById('btnAddCandidate');
  const candidateAdminTableBody = document.getElementById('candidateAdminTableBody');

  // Reset Modal
  const btnAdminResetModal = document.getElementById('btnAdminResetModal');
  const resetModal = document.getElementById('resetModal');
  const resetConfirmCode = document.getElementById('resetConfirmCode');
  const btnCancelReset = document.getElementById('btnCancelReset');
  const btnConfirmReset = document.getElementById('btnConfirmReset');

  // Edit User Modal
  const editUserModal = document.getElementById('editUserModal');
  const editOriginalCode = document.getElementById('editOriginalCode');
  const editUserCode = document.getElementById('editUserCode');
  const editUserName = document.getElementById('editUserName');
  const btnCancelEditUser = document.getElementById('btnCancelEditUser');
  const btnSaveEditUser = document.getElementById('btnSaveEditUser');

  // --- INITIALIZATION ---
  init();

  function init() {
    setupEventListeners();
    localStorage.removeItem('vote_user_session');
    currentUser = null;
    userChoices = {};
    if (inputCode) inputCode.value = '';
    if (resetModal) resetModal.classList.add('hidden');
    if (editUserModal) editUserModal.classList.add('hidden');
    showView('login');
  }

  function setupEventListeners() {
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.addEventListener('click', handleLogin);

    btnLogout.addEventListener('click', handleLogout);
    if (btnAdminLogout) btnAdminLogout.addEventListener('click', handleLogout);
    btnSubmitVote.addEventListener('click', handleSubmitVote);

    // Admin Tab switching
    adminTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        adminTabContents.forEach(c => {
          c.classList.add('hidden');
          c.classList.remove('active');
        });

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.remove('hidden');
          targetContent.classList.add('active');
        }
      });
    });

    // Admin Actions
    btnRefreshResults.addEventListener('click', loadAdminResults);
    btnAddUser.addEventListener('click', handleAddUser);
    adminCategorySelect.addEventListener('change', renderAdminCandidateTable);
    btnAddCandidate.addEventListener('click', handleAddCandidate);

    // Reset Vote Modal
    btnAdminResetModal.addEventListener('click', () => {
      resetConfirmCode.value = '';
      resetModal.classList.remove('hidden');
    });
    btnCancelReset.addEventListener('click', () => {
      resetModal.classList.add('hidden');
    });
    btnConfirmReset.addEventListener('click', handleConfirmReset);

    // Edit User Modal
    if (btnCancelEditUser) {
      btnCancelEditUser.addEventListener('click', () => {
        if (editUserModal) editUserModal.classList.add('hidden');
      });
    }
    if (btnSaveEditUser) {
      btnSaveEditUser.addEventListener('click', handleSaveEditUser);
    }
  }

  // --- NAVIGATION CONTROLLER ---
  function showView(viewName) {
    Object.keys(views).forEach(key => {
      if (key === viewName) {
        views[key].classList.remove('hidden');
      } else {
        views[key].classList.add('hidden');
      }
    });

    if (currentUser) {
      userHeaderBadge.classList.remove('hidden');
      headerUserName.textContent = `${currentUser.name} (${currentUser.code})`;
    } else {
      userHeaderBadge.classList.add('hidden');
    }
  }

  function navigateUserScreen() {
    if (!currentUser) {
      showView('login');
      return;
    }

    if (currentUser.isAdmin) {
      showView('admin');
      loadAdminDashboardData();
    } else if (currentUser.hasVoted) {
      showView('leaderboard');
      loadUserLeaderboard();
    } else {
      showView('voting');
      loadVotingForm();
    }
  }

  // --- LOGIN & LOGOUT ---
  async function handleLogin(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const code = inputCode.value.trim();
    if (!code || code.length !== 5) {
      showToast('กรุณากรอกรหัสประจำตัว 5 หลัก', 'error');
      return;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            currentUser = data.user;
            inputCode.value = '';
            showToast(`ยินดีต้อนรับ ${currentUser.name}`, 'success');
            navigateUserScreen();
            return;
          } else {
            showToast(data.message, 'error');
            return;
          }
        }
      } catch (err) {
        console.warn("Express API failed, using static client database:", err);
      }
    }

    // Standalone Static Host
    const users = getClientUsers();
    const found = users.find(u => u.code === code);
    if (found) {
      currentUser = found;
      inputCode.value = '';
      showToast(`ยินดีต้อนรับ ${currentUser.name}`, 'success');
      navigateUserScreen();
    } else {
      showToast('ไม่พบรหัสประจำตัวนี้ในระบบ กรุณาติดต่อ Admin', 'error');
    }
  }

  function handleLogout() {
    currentUser = null;
    userChoices = {};
    if (inputCode) inputCode.value = '';
    showToast('ออกจากระบบเรียบร้อย', 'info');
    showView('login');
  }

  // --- VOTING FORM ---
  async function loadVotingForm() {
    userWelcomeTitle.textContent = `${currentUser.name} ยินดีต้อนรับ`;

    try {
      const res = await fetch('/api/candidates');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.categories) {
          allCategories = data.categories;
          renderVotingCategories();
          updateProgressBar();
          return;
        }
      }
    } catch (err) {
      console.warn("Express candidates API failed, using static fallback:", err);
    }

    allCategories = defaultCategoriesList;
    renderVotingCategories();
    updateProgressBar();
  }

  function renderVotingCategories() {
    votingCategoriesList.innerHTML = '';
    userChoices = {};

    const grouped = {};
    allCategories.forEach(cat => {
      const groupName = cat.group || 'หัวข้อการโหวต';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(cat);
    });

    let globalCatIndex = 0;

    Object.entries(grouped).forEach(([groupName, categories]) => {
      const groupHeader = document.createElement('h2');
      groupHeader.className = 'category-group-header';
      groupHeader.innerHTML = `<i class="fa-solid fa-award"></i> ${groupName}`;
      votingCategoriesList.appendChild(groupHeader);

      categories.forEach(cat => {
        globalCatIndex++;
        const card = document.createElement('div');
        card.className = 'glass-card category-card animate-fade-in';

        const optionsHtml = cat.candidates.map(cand => {
          return `<option value="${cand.id}">${cand.number} : ${cand.name} ${cand.description ? '(' + cand.description + ')' : ''}</option>`;
        }).join('');

        card.innerHTML = `
          <div class="category-card-header">
            <h3><span class="badge-num">${globalCatIndex}</span> ${cat.title}</h3>
            <span class="badge-welcome">เลือก 1 คน</span>
          </div>
          <div class="candidate-selector">
            <select class="custom-select candidate-select-styled" data-cat-id="${cat.id}">
              <option value="" disabled selected>-- กรุณาคลิกเพื่อเลือกผู้ลงสมัคร --</option>
              ${optionsHtml}
            </select>
          </div>
        `;

        votingCategoriesList.appendChild(card);
      });
    });

    document.querySelectorAll('.candidate-select-styled').forEach(select => {
      select.addEventListener('change', (e) => {
        const catId = e.target.getAttribute('data-cat-id');
        userChoices[catId] = e.target.value;
        updateProgressBar();
      });
    });
  }

  function updateProgressBar() {
    const totalCategories = allCategories.length;
    const selectedCount = Object.keys(userChoices).length;
    const percentage = totalCategories > 0 ? Math.round((selectedCount / totalCategories) * 100) : 0;

    voteProgressText.textContent = `เลือกครบ ${selectedCount} จาก ${totalCategories} หัวข้อ`;
    voteProgressBar.style.width = `${percentage}%`;
  }

  async function handleSubmitVote() {
    const totalCategories = allCategories.length;
    const selectedCount = Object.keys(userChoices).length;

    if (selectedCount < totalCategories) {
      showToast(`กรุณาเลือกผู้ลงสมัครให้ครบทุกหัวข้อ (ยังขาดอีก ${totalCategories - selectedCount} หัวข้อ)`, 'error');
      return;
    }

    if (!confirm('ยืนยันการบันทึกการโหวต? เมื่อบันทึกแล้วจะไม่สามารถแก้ไขหรือโหวตซ้ำได้')) {
      return;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userCode: currentUser.code,
            choices: userChoices
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('บันทึกการโหวตเรียบร้อยแล้ว!', 'success');
          currentUser.hasVoted = true;
          showView('leaderboard');
          loadUserLeaderboard();
          return;
        }
      } catch (err) {}
    }

    // Standalone Static Host
    const votes = getClientVotes();
    votes.push({
      userCode: currentUser.code,
      userName: currentUser.name,
      choices: userChoices,
      votedAt: new Date().toISOString()
    });
    saveClientVotes(votes);

    const users = getClientUsers();
    const u = users.find(x => x.code === currentUser.code);
    if (u) {
      u.hasVoted = true;
      u.votedAt = new Date().toISOString();
      saveClientUsers(users);
    }

    currentUser.hasVoted = true;
    showToast('บันทึกการโหวตเรียบร้อยแล้ว!', 'success');
    showView('leaderboard');
    loadUserLeaderboard();
  }

  // --- USER LEADERBOARD (TOP 3) ---
  async function loadUserLeaderboard() {
    top3Container.innerHTML = '<p class="text-muted">กำลังโหลดผลคะแนน...</p>';

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const res = await fetch('/api/top3');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            renderTop3Leaderboard(data.results);
            return;
          }
        }
      } catch (err) {}
    }

    // Static Host calculation
    const votes = getClientVotes();
    const categories = allCategories.length ? allCategories : defaultCategoriesList;
    const results = categories.map(cat => {
      const tally = {};
      cat.candidates.forEach(cand => { tally[cand.id] = 0; });
      votes.forEach(v => {
        if (v.choices && v.choices[cat.id]) {
          const candId = v.choices[cat.id];
          tally[candId] = (tally[candId] || 0) + 1;
        }
      });

      const candList = cat.candidates.map(cand => ({
        id: cand.id,
        number: cand.number,
        name: cand.name,
        description: cand.description,
        votes: tally[cand.id] || 0
      }));

      candList.sort((a, b) => b.votes - a.votes);
      return {
        categoryId: cat.id,
        title: cat.title,
        top3: candList.slice(0, 3)
      };
    });

    renderTop3Leaderboard(results);
  }

  function renderTop3Leaderboard(results) {
    top3Container.innerHTML = '';

    const medals = ['🥇', '🥈', '🥉'];

    results.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'glass-card leaderboard-card animate-fade-in';

      const itemsHtml = cat.top3.map((cand, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : 'rank-3';
        const medalIcon = medals[index] || (index + 1);
        return `
          <div class="top3-item ${index === 0 ? 'top3-champion' : ''}">
            <div class="rank-badge ${rankClass}">${medalIcon}</div>
            <div class="candidate-name-info">
              <div class="cand-name">${cand.name} ${index === 0 ? '<span class="badge-voted" style="background:#fff8e1; color:#b78103; font-weight:700;"><i class="fa-solid fa-crown"></i> อันดับ 1</span>' : ''}</div>
              <div class="cand-votes"><i class="fa-solid fa-vote-yea"></i> ${cand.votes} คะแนน</div>
            </div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="leaderboard-card-title"><i class="fa-solid fa-trophy" style="color:var(--accent-gold);"></i> ${cat.title} (3 อันดับสูงสุด)</div>
        <div class="top3-list">
          ${itemsHtml || '<p class="text-muted">ยังไม่มีผลคะแนน</p>'}
        </div>
      `;

      top3Container.appendChild(card);
    });
  }

  // --- ADMIN DASHBOARD ---
  function loadAdminDashboardData() {
    loadAdminUserList();
    loadAdminResults();
    loadUnvotedUsers();
    loadAdminCandidatesDropdown();
  }

  async function loadAdminResults() {
    adminResultsContainer.innerHTML = '<p class="text-muted">กำลังโหลดข้อมูลคะแนน...</p>';

    try {
      const res = await fetch('/api/admin/results', {
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) {
        showToast('ดึงข้อมูลผลคะแนนล้มเหลว', 'error');
        return;
      }

      renderAdminResults(data.results);

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการโหลดผลคะแนน', 'error');
    }
  }

  function renderAdminResults(results) {
    adminResultsContainer.innerHTML = '';

    results.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'glass-card animate-fade-in margin-bottom-20';

      const rankingsHtml = cat.rankings.map((cand, idx) => {
        const isTop = idx === 0 && cand.votes > 0;
        return `
          <div class="top3-item" style="margin-bottom: 6px;">
            <div class="rank-badge ${idx < 3 ? 'rank-' + (idx + 1) : 'rank-2'}" style="width:28px; height:28px; font-size:0.8rem;">${idx + 1}</div>
            <div class="candidate-name-info">
              <div class="cand-name">${cand.name} ${isTop ? '<span class="badge-voted">นำอันดับ 1</span>' : ''}</div>
            </div>
            <div class="cand-votes">${cand.votes} คะแนน</div>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="tab-header" style="margin-bottom:12px; padding-bottom:8px;">
          <h4 style="color:var(--primary-purple);"><i class="fa-solid fa-trophy"></i> ${cat.title}</h4>
          <span class="badge-num">รวมโหวต ${cat.totalCategoryVotes} คะแนน</span>
        </div>
        <div class="top3-list">${rankingsHtml}</div>
      `;

      adminResultsContainer.appendChild(card);
    });
  }

  async function loadUnvotedUsers() {
    try {
      const res = await fetch('/api/admin/unvoted', {
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) return;

      unvotedBadgeCount.textContent = data.unvotedCount;
      unvotedSummaryText.textContent = `โหวตแล้ว ${data.votedCount} / ${data.totalVoters} คน (ยังไม่โหวต ${data.unvotedCount} คน)`;

      unvotedTableBody.innerHTML = '';
      if (data.unvotedUsers.length === 0) {
        unvotedTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">ผู้ใช้ทุกคนทำการโหวตครบถ้วนแล้ว! 🎉</td></tr>`;
        return;
      }

      data.unvotedUsers.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td><strong>${user.code}</strong></td>
          <td>${user.name}</td>
          <td><span class="badge-unvoted"><i class="fa-solid fa-clock"></i> ยังไม่ได้โหวต</span></td>
        `;
        unvotedTableBody.appendChild(tr);
      });

    } catch (err) {
      console.error(err);
    }
  }

  async function loadAdminUserList() {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) return;

      usersTableBody.innerHTML = '';
      data.users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${u.code}</strong> ${u.isAdmin ? '<span class="badge-admin">Admin</span>' : ''}</td>
          <td>${u.name}</td>
          <td>
            ${u.isAdmin ? '-' : (u.hasVoted ? '<span class="badge-voted"><i class="fa-solid fa-check"></i> โหวตแล้ว</span>' : '<span class="badge-unvoted"><i class="fa-solid fa-xmark"></i> ยังไม่โหวต</span>')}
          </td>
          <td>
            ${!u.isAdmin ? `
              <button class="btn-primary btn-sm btn-edit-user" data-code="${u.code}" data-name="${u.name}" style="margin-right: 4px;"><i class="fa-solid fa-pen-to-square"></i> แก้ไข</button>
              ${u.hasVoted ? `<button class="btn-secondary btn-sm btn-reset-user-vote" data-code="${u.code}" data-name="${u.name}" style="margin-right: 4px;"><i class="fa-solid fa-rotate-left"></i> คืนสิทธิ์โหวต</button>` : ''}
              <button class="btn-danger-light btn-sm btn-delete-user" data-code="${u.code}"><i class="fa-solid fa-trash"></i> ลบ</button>
            ` : '-'}
          </td>
        `;
        usersTableBody.appendChild(tr);
      });

      document.querySelectorAll('.btn-edit-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const code = e.currentTarget.getAttribute('data-code');
          const name = e.currentTarget.getAttribute('data-name');
          openEditUserModal(code, name);
        });
      });

      document.querySelectorAll('.btn-reset-user-vote').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const code = e.currentTarget.getAttribute('data-code');
          const name = e.currentTarget.getAttribute('data-name');
          handleResetUserVote(code, name);
        });
      });

      document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const code = e.currentTarget.getAttribute('data-code');
          handleDeleteUser(code);
        });
      });

    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddUser() {
    const code = newCodeInput.value.trim();
    const name = newNameInput.value.trim();

    if (!code || code.length !== 5 || !name) {
      showToast('กรุณากรอกรหัสประจำตัว 5 หลักและชื่อผู้ใช้งาน', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': currentUser.code
        },
        body: JSON.stringify({ code, name })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      showToast(`สร้างรหัสผู้ใช้ ${code} (${name}) สำเร็จ!`, 'success');
      newCodeInput.value = '';
      newNameInput.value = '';
      loadAdminUserList();
      loadUnvotedUsers();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างรหัสผู้ใช้', 'error');
    }
  }

  async function handleDeleteUser(code) {
    if (!confirm(`ยืนยันการลบผู้ใช้รหัส ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${code}`, {
        method: 'DELETE',
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      showToast('ลบผู้ใช้งานสำเร็จ', 'info');
      loadAdminUserList();
      loadUnvotedUsers();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบผู้ใช้', 'error');
    }
  }

  function openEditUserModal(code, name) {
    if (editOriginalCode) editOriginalCode.value = code;
    if (editUserCode) editUserCode.value = code;
    if (editUserName) editUserName.value = name;
    if (editUserModal) editUserModal.classList.remove('hidden');
  }

  async function handleSaveEditUser() {
    const originalCode = editOriginalCode ? editOriginalCode.value : '';
    const newCode = editUserCode ? editUserCode.value.trim() : '';
    const name = editUserName ? editUserName.value.trim() : '';

    if (!newCode || newCode.length !== 5 || !name) {
      showToast('กรุณากรอกรหัส 5 หลักและชื่อผู้ใช้งาน', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${originalCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': currentUser.code
        },
        body: JSON.stringify({ newCode, name })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      if (editUserModal) editUserModal.classList.add('hidden');
      showToast('แก้ไขข้อมูลสมาชิกสำเร็จเรียบร้อย!', 'success');
      loadAdminUserList();
      loadUnvotedUsers();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูลสมาชิก', 'error');
    }
  }

  async function handleResetUserVote(code, name) {
    if (!confirm(`ยืนยันการคืนสิทธิ์การโหวตให้คุณ ${name} (รหัส ${code})?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${code}/reset-vote`, {
        method: 'POST',
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      showToast(`คืนสิทธิ์การโหวตให้คุณ ${name} เรียบร้อยแล้ว!`, 'success');
      loadAdminUserList();
      loadUnvotedUsers();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการคืนสิทธิ์การโหวต', 'error');
    }
  }

  async function loadAdminCandidatesDropdown() {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();

      if (!data.success) return;

      allCategories = data.categories;
      adminCategorySelect.innerHTML = '';

      allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.group} -> ${cat.title}`;
        adminCategorySelect.appendChild(opt);
      });

      renderAdminCandidateTable();

    } catch (err) {
      console.error(err);
    }
  }

  function renderAdminCandidateTable() {
    const selectedCatId = adminCategorySelect.value;
    const cat = allCategories.find(c => c.id === selectedCatId);

    candidateAdminTableBody.innerHTML = '';
    if (!cat || !cat.candidates || cat.candidates.length === 0) {
      candidateAdminTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">ยังไม่มีรายชื่อผู้สมัครในหมวดหมู่นี้</td></tr>`;
      return;
    }

    cat.candidates.forEach(cand => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>หมายเลข ${cand.number}</strong></td>
        <td>${cand.name}</td>
        <td>${cand.description || '-'}</td>
        <td>
          <button class="btn-danger-light btn-sm btn-delete-cand" data-cat-id="${cat.id}" data-cand-id="${cand.id}">
            <i class="fa-solid fa-trash"></i> ลบ
          </button>
        </td>
      `;
      candidateAdminTableBody.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete-cand').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catId = e.currentTarget.getAttribute('data-cat-id');
        const candId = e.currentTarget.getAttribute('data-cand-id');
        handleDeleteCandidate(catId, candId);
      });
    });
  }

  async function handleAddCandidate() {
    const categoryId = adminCategorySelect.value;
    const number = candNumberInput.value;
    const name = candNameInput.value.trim();
    const description = candDescInput.value.trim();

    if (!categoryId || !name) {
      showToast('กรุณากรอกชื่อผู้ลงสมัคร', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': currentUser.code
        },
        body: JSON.stringify({ categoryId, number, name, description })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      showToast('เพิ่มผู้ลงสมัครสำเร็จ', 'success');
      candNameInput.value = '';
      candDescInput.value = '';
      candNumberInput.value = '';

      loadAdminCandidatesDropdown();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเพิ่มผู้สมัคร', 'error');
    }
  }

  async function handleDeleteCandidate(categoryId, candId) {
    if (!confirm('ยืนยันการลบผู้ลงสมัครท่านนี้?')) return;

    try {
      const res = await fetch(`/api/admin/candidates/${categoryId}/${candId}`, {
        method: 'DELETE',
        headers: { 'x-admin-code': currentUser.code }
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      showToast('ลบผู้สมัครเรียบร้อยแล้ว', 'info');
      loadAdminCandidatesDropdown();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบผู้สมัคร', 'error');
    }
  }

  async function handleConfirmReset() {
    const code = resetConfirmCode.value.trim();
    if (code !== '000001') {
      showToast('รหัสยืนยันไม่ถูกต้อง (ต้องเป็น 000001)', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': currentUser.code
        },
        body: JSON.stringify({ resetCode: code })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message, 'error');
        return;
      }

      resetModal.classList.add('hidden');
      showToast('ทำการ Reset ข้อมูลการโหวตทั้งหมดสำเร็จ!', 'success');
      loadAdminDashboardData();

    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการ Reset ข้อมูล', 'error');
    }
  }



  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} animate-pop`;

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }
});
