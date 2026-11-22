(() => {
  const currentUser = window.AppAuth.requireAuth('/index.html');
  if (!currentUser) return;

  const isSam = currentUser.username === 'sam';
  const socket = io();

  const messagesList = document.getElementById('messages-list');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const attachBtn = document.getElementById('attach-btn');
  const mediaInput = document.getElementById('media-input');
  const uploadProgressText = document.getElementById('upload-progress-text');
  const activeModeIndicator = document.getElementById('active-mode-indicator');

  const partnerNameEl = document.getElementById('partner-name');
  const partnerAvatarEl = document.getElementById('partner-avatar');
  const partnerStatusEl = document.getElementById('partner-status');
  const roleSwitcherBox = document.getElementById('sam-role-switcher');
  const activeSenderSelect = document.getElementById('active-sender-select');

  const voicePanel = document.getElementById('voice-panel');
  const recIndicator = document.getElementById('recording-indicator');
  const recStateLabel = document.getElementById('rec-state-label');
  const recTimerEl = document.getElementById('rec-timer');
  const startRecBtn = document.getElementById('start-rec-btn');
  const pauseResumeRecBtn = document.getElementById('pause-resume-rec-btn');
  const stopRecBtn = document.getElementById('stop-rec-btn');
  const cancelRecBtn = document.getElementById('cancel-rec-btn');
  const voicePreviewBox = document.getElementById('voice-preview-box');
  const voicePreviewAudio = document.getElementById('voice-preview-audio');
  const sendVoiceBtn = document.getElementById('send-voice-btn');
  const discardVoiceBtn = document.getElementById('discard-voice-btn');

  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let activeStream = null;
  let timerInterval = null;
  let secondsElapsed = 0;
  let isPaused = false;
  let typingTimeout = null;

  function cleanupVoiceRecording() {
    clearInterval(timerInterval);
    timerInterval = null;
    secondsElapsed = 0;
    isPaused = false;
    recordedBlob = null;
    audioChunks = [];

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }

    if (voicePreviewAudio) {
      voicePreviewAudio.pause();
      voicePreviewAudio.removeAttribute('src');
    }

    if (recTimerEl) recTimerEl.textContent = '00:00';
    if (recStateLabel) recStateLabel.textContent = 'ভয়েস রেকর্ড হচ্ছে...';
    if (pauseResumeRecBtn) pauseResumeRecBtn.textContent = '⏸ থামান';
    if (recIndicator) recIndicator.style.display = 'none';
    if (voicePreviewBox) voicePreviewBox.style.display = 'none';
    if (voicePanel) voicePanel.style.display = 'none';
  }

  window.AppAuth.bindLogout('logout-btn', () => {
    cleanupVoiceRecording();
  });

  function updatePostModeBadge() {
    if (!isSam || !activeModeIndicator || !activeSenderSelect) return;
    const chosen = activeSenderSelect.value === 'mim' ? 'mim' : 'sam';
    activeModeIndicator.style.display = 'inline-flex';
    activeModeIndicator.textContent =
      chosen === 'mim' ? 'বর্তমান মোড: Mim হিসেবে পাঠানো হবে' : 'বর্তমান মোড: Sam হিসেবে পাঠানো হবে';
    activeModeIndicator.className = `active-mode-pill mode-${chosen}`;
  }

  if (isSam) {
    partnerNameEl.textContent = 'Mim';
    partnerAvatarEl.textContent = 'M';
    roleSwitcherBox.style.display = 'flex';
    updatePostModeBadge();
    activeSenderSelect?.addEventListener('change', updatePostModeBadge);
  } else {
    partnerNameEl.textContent = 'Sam';
    partnerAvatarEl.textContent = 'S';
    roleSwitcherBox.style.display = 'none';
    if (activeModeIndicator) activeModeIndicator.style.display = 'none';
  }

  function getEffectiveSender() {
    if (isSam && activeSenderSelect) {
      return activeSenderSelect.value === 'mim' ? 'mim' : 'sam';
    }
    return 'mim';
  }

  messageInput.addEventListener('input', () => {
    socket.emit('typing_status', {
      actor: getEffectiveSender(),
      isTyping: messageInput.value.trim().length > 0
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing_status', {
        actor: getEffectiveSender(),
        isTyping: false
      });
    }, 1400);
  });

  socket.on('peer_typing', ({ actor, isTyping }) => {
    if (actor === currentUser.username) return;
    if (isTyping) {
      const label = actor === 'sam' ? 'Sam' : 'Mim';
      partnerStatusEl.textContent = `${label} লিখছেন...`;
    } else {
      partnerStatusEl.textContent = 'তোমাকে না বলা কথাগুলো আজ বলবো';
    }
  });

  attachBtn.addEventListener('click', () => {
    mediaInput.click();
  });

  async function uploadFileToServer(file, customName) {
    if (uploadProgressText) uploadProgressText.textContent = 'আপলোড হচ্ছে...';
    const formData = new FormData();
    if (customName) {
      formData.append('media', file, customName);
    } else {
      formData.append('media', file);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (uploadProgressText) uploadProgressText.textContent = '';

      if (!res.ok || !data || !data.success) {
        alert(data?.message || 'ফাইল আপলোড করা যায়নি।');
        return null;
      }
      return data;
    } catch (_err) {
      if (uploadProgressText) uploadProgressText.textContent = '';
      alert('ফাইল আপলোডে নেটওয়ার্ক সমস্যা হয়েছে।');
      return null;
    }
  }

  mediaInput.addEventListener('change', async () => {
    const file = mediaInput.files && mediaInput.files[0];
    if (!file) return;

    const uploaded = await uploadFileToServer(file);
    if (uploaded) {
      socket.emit('send_message', {
        sender: getEffectiveSender(),
        loggedInUser: currentUser.username,
        type: 'media',
        text: '',
        mediaUrl: uploaded.fileUrl,
        mediaName: uploaded.fileName,
        mimeType: uploaded.mimeType
      });
    }
    mediaInput.value = '';
  });

  function formatTimer(totalSec) {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function startTimerInterval() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isPaused) {
        secondsElapsed += 1;
        recTimerEl.textContent = formatTimer(secondsElapsed);
      }
    }, 1000);
  }

  startRecBtn.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') return;
    cleanupVoiceRecording();

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(activeStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearInterval(timerInterval);
        if (activeStream) {
          activeStream.getTracks().forEach((t) => t.stop());
          activeStream = null;
        }

        if (audioChunks.length === 0) {
          cleanupVoiceRecording();
          return;
        }

        recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
        voicePreviewAudio.src = URL.createObjectURL(recordedBlob);
        recIndicator.style.display = 'none';
        voicePreviewBox.style.display = 'flex';
      };

      mediaRecorder.start();
      isPaused = false;
      secondsElapsed = 0;
      recTimerEl.textContent = '00:00';
      recStateLabel.textContent = 'ভয়েস রেকর্ড হচ্ছে...';
      pauseResumeRecBtn.textContent = '⏸ থামান';

      voicePanel.style.display = 'block';
      recIndicator.style.display = 'flex';
      voicePreviewBox.style.display = 'none';
      startTimerInterval();
    } catch (_err) {
      alert('মাইক্রোফোন অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংস চেক করুন।');
    }
  });

  pauseResumeRecBtn.addEventListener('click', () => {
    if (!mediaRecorder) return;
    if (!isPaused && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      isPaused = true;
      recStateLabel.textContent = 'ভয়েস বিরতিতে আছে';
      pauseResumeRecBtn.textContent = '▶ চালিয়ে যান';
    } else if (isPaused && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      isPaused = false;
      recStateLabel.textContent = 'ভয়েস রেকর্ড হচ্ছে...';
      pauseResumeRecBtn.textContent = '⏸ থামান';
    }
  });

  stopRecBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
      mediaRecorder.stop();
    }
  });

  cancelRecBtn.addEventListener('click', () => {
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    cleanupVoiceRecording();
  });

  discardVoiceBtn.addEventListener('click', cleanupVoiceRecording);

  sendVoiceBtn.addEventListener('click', async () => {
    if (!recordedBlob) return;
    const uploaded = await uploadFileToServer(recordedBlob, `voice-${Date.now()}.webm`);
    if (uploaded) {
      socket.emit('send_message', {
        sender: getEffectiveSender(),
        loggedInUser: currentUser.username,
        type: 'media',
        text: '',
        mediaUrl: uploaded.fileUrl,
        mediaName: 'ভয়েস মেসেজ',
        mimeType: 'audio/webm'
      });
      cleanupVoiceRecording();
    }
  });

  function renderMessage(msg) {
    const existing = document.getElementById(`msg-${msg.id}`);
    if (existing) existing.remove();

    const isMine = msg.sender === currentUser.username;
    const wrapper = document.createElement('div');
    wrapper.id = `msg-${msg.id}`;
    wrapper.className = `msg-row ${isMine ? 'align-right' : 'align-left'}`;

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${msg.sender === 'sam' ? 'bubble-sam' : 'bubble-mim'}`;

    const header = document.createElement('div');
    header.className = 'msg-header';
    const senderLabel = msg.sender === 'sam' ? 'Sam' : 'Mim';
    const editedTag = msg.edited ? ' • এডিট করা' : '';
    header.innerHTML = `<strong>${senderLabel}</strong> <span>${msg.time || ''}${editedTag}</span>`;
    bubble.appendChild(header);

    if (msg.type === 'text') {
      const textEl = document.createElement('div');
      textEl.className = 'msg-text';
      textEl.textContent = msg.text;
      bubble.appendChild(textEl);
    } else if (msg.mediaUrl) {
      const mime = String(msg.mimeType || '').toLowerCase();
      if (mime.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = msg.mediaUrl;
        img.alt = msg.mediaName || 'ছবি';
        img.className = 'msg-media-img';
        bubble.appendChild(img);
      } else if (mime.startsWith('video/')) {
        const vid = document.createElement('video');
        vid.src = msg.mediaUrl;
        vid.controls = true;
        vid.className = 'msg-media-vid';
        bubble.appendChild(vid);
      } else if (mime.startsWith('audio/')) {
        const aud = document.createElement('audio');
        aud.src = msg.mediaUrl;
        aud.controls = true;
        aud.className = 'msg-media-aud';
        bubble.appendChild(aud);
      } else {
        const fileBox = document.createElement('div');
        fileBox.className = 'msg-file-box';
        fileBox.textContent = `📄 ${msg.mediaName || 'সংযুক্ত ফাইল'}`;
        bubble.appendChild(fileBox);
      }
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'msg-toolbar';

    if (msg.type === 'text') {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.textContent = '📋 কপি';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(msg.text);
        copyBtn.textContent = '✔ কপি হয়েছে';
        setTimeout(() => {
          copyBtn.textContent = '📋 কপি';
        }, 1500);
      });
      toolbar.appendChild(copyBtn);

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = '✏️ এডিট';
      editBtn.addEventListener('click', () => {
        const updated = prompt('মেসেজটি পরিবর্তন করুন:', msg.text);
        if (updated && updated.trim()) {
          socket.emit('edit_message', { id: msg.id, newText: updated.trim() });
        }
      });
      toolbar.appendChild(editBtn);
    } else if (msg.mediaUrl) {
      const dlLink = document.createElement('a');
      dlLink.href = msg.mediaUrl;
      dlLink.download = msg.mediaName || 'download';
      dlLink.textContent = '⬇ ডাউনলোড';
      dlLink.className = 'toolbar-link';
      toolbar.appendChild(dlLink);
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '🗑 ডিলিট';
    delBtn.addEventListener('click', () => {
      socket.emit('delete_message', msg.id);
    });
    toolbar.appendChild(delBtn);

    bubble.appendChild(toolbar);
    wrapper.appendChild(bubble);
    messagesList.appendChild(wrapper);
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit('send_message', {
      sender: getEffectiveSender(),
      loggedInUser: currentUser.username,
      type: 'text',
      text
    });

    socket.emit('typing_status', {
      actor: getEffectiveSender(),
      isTyping: false
    });

    messageInput.value = '';
    messageInput.focus();
  });

  socket.on('init_messages', (list) => {
    messagesList.innerHTML = '';
    if (Array.isArray(list)) {
      list.forEach(renderMessage);
    }
  });

  socket.on('new_message', (msg) => {
    renderMessage(msg);
  });

  socket.on('message_edited', (msg) => {
    renderMessage(msg);
  });

  socket.on('message_deleted', (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.remove();
  });
})();