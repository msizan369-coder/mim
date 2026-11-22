(() => {
  const user = window.AppAuth.requireAuth('/index.html');
  if (!user) return;

  const container = document.getElementById('scene-container');
  const storyHud = document.getElementById('story-hud');
  const captionBox = document.getElementById('caption-box');
  const sceneArchivedList = document.getElementById('scene-archived-list');
  const startBtn = document.getElementById('start-story-btn');
  const pauseResumeBtn = document.getElementById('pause-resume-story-btn');
  const toggleTtsBtn = document.getElementById('toggle-tts-btn');
  const soundBtn = document.getElementById('toggle-sound-btn');
  const openLetterNowBtn = document.getElementById('open-letter-now-btn');
  const closeLetterBtn = document.getElementById('close-letter-btn');
  const voiceVideo = document.getElementById('voice-video');
  const letterModal = document.getElementById('final-letter-modal');
  const letterSpotlight = document.getElementById('letter-spotlight');
  const letterContent = document.getElementById('letter-content');
  const letterArchivedList = document.getElementById('letter-archived-list');
  const replayBtn = document.getElementById('replay-story-btn');

  const FULL_LETTER_HTML = `
    <p><strong>হাই মিম,</strong></p>
    <p>কেমন আছো? আশা করি তুমি ভালো আছো। আমি চাই তুমি সারাজীবন এভাবেই ভালো থাকো, সুখে থাকো—তোমার আনন্দে আমার সুখ।</p>
    <p>তুমি হয়তো আশ্চর্য হচ্ছ—আমি কে, আমার পরিচয় কী, এতদিন কোথায় ছিলাম, আর হঠাৎ করেই বা কেন তোমার সামনে এভাবে এলাম! আমি জানি তুমি অন্য আরেকজনকে অনেক ভালোবাসো। তাই এটাও জানি যে, আমি তোমাকে কখনোই পাবো না। আর সব ভালোবাসা যে পেতেই হবে, এমনটা তো কোথাও লেখা নেই। আমি শুধু চাই তুমি ভালো থেকো, আর কিছু না।</p>
    <p>আমি চাই না তুমি আমাকে জানো, আর আমি কখনো তোমার সামনে আসতেও পারবো না। হয়তোবা তুমি আমাকে চেনো—এমন একটা সিচুয়েশনে আমরা দুজন ছিলাম, যেখানে আমি তোমার থেকে মাত্র <strong>৫ সেন্টিমিটার</strong> দূরে ছিলাম; কিন্তু তখন আমি তোমাকে আমার মনের কথাটা বলতে পারিনি। তাই তো আর কখনো বলতেও পারবো না, কারণ আর কখনো এতটা কাছাকাছি আসা হবে না আমাদের।</p>
    <p>তবে তোমার যখনই কোনো হেল্প লাগবে, নিঃসংকোচে আমাকে বলতে পারো। আমি তোমার সব বিষয়ে হেল্প করবো—যদি তুমি চাও, একজন বন্ধু হয়ে ☺️☺️☺️।</p>
    <p>তোমার যদি আমাকে কিছু বলার থাকে, তাহলে নিচে যে <strong>চ্যাট অপশন</strong> দেখতে পাচ্ছ, ওখানে ক্লিক করে আমার সাথে যোগাযোগ করতে পারবে—শুধুমাত্র আজকেই সারাদিনের মধ্যে। কারণ এরপর আর কখনো তোমার সাথে আমার যোগাযোগ সম্ভব হবে না; এই পেজটা শুধু আজকের দিনের জন্যই থাকবে।</p>
    <p>তোমার সাথে শুধু একটিবার কথা বলার জন্য আমি এত কিছু করলাম, কারণ আমি চাই না আমাদের বিষয়টা বাইরে কোথাও যাক—আমি নিজের দায়িত্বে সবকিছু করেছি। আজ আমার মনের কথাটা তোমাকে জানালাম, না হলে সারাটা জীবন আমাকে এভাবেই আফসোস করে যেতে হতো।</p>
    <p class="letter-quote">“পৃথিবীতে এমন অনেক ভালোবাসা আছে, যার কোনো সম্পর্ক নেই—আমারটাও ধরো ঠিক এরকমই। সবসময় ভালো থেকো মিম। ❤️”</p>
  `;

  const sequentialLines = [
    'হাই মিম, কেমন আছো? আশা করি তুমি ভালো আছো। আমি চাই তুমি সারাজীবন এভাবেই ভালো থাকো।',
    'তুমি হয়তো আশ্চর্য হচ্ছ আমি কে, আমার পরিচয় কি, আমি কোথায় ছিলাম এতদিন এবং আমি হঠাৎ করে কেন তোমার সামনে এভাবে এলাম।',
    'আমি জানি তুমি অন্য আরেকজনকে অনেক ভালোবাসো। তাই আমি জানি আমি তোমাকে কখনোই পাবো না, সব ভালোবাসা যে পেতেই হবে এটা কোথাও লেখা নেই।',
    'আমি চাই তুমি ভালো থেকো আর কিছু না। আর আমি চাইনা তুমি আমাকে জানো, আমি আর কখনো তোমার সামনে আসতেও পারবো না।',
    'হয়তোবা তুমি আমাকে চেনো, এমন একটা সিচুয়েশনে আমরা দুজন ছিলাম যেখানে আমি তোমার থেকে মাত্র ৫ সেন্টিমিটার দূরে ছিলাম, কিন্তু তখন আমি তোমাকে আমার মনের কথাটা বলতে পারিনি।',
    'তবে তোমার যখনই কোন হেল্প লাগবে আমাকে বলতে পারো। আমি তোমার সব বিষয়ে হেল্প করবো যদি তুমি চাও একজন বন্ধু হয়ে ☺️☺️☺️।',
    'তোমার যদি আমাকে কিছু বলার থাকে তাহলে নিচে যে চ্যাট অপশন দেখতে পাচ্ছ ওখানে ক্লিক করে আমার সাথে যোগাযোগ করতে পারবে শুধু আজকেই সারাদিনের মধ্যে।',
    'তোমার সাথে শুধু একটা বার কথা বলার জন্য আমি এত কিছু করলাম, কারণ আমি চাইনা আমাদের বিষয়টা বাইরে কোথাও যাক। আজ আমার মনের কথাটা তোমাকে জানালাম—ভালো থেকো।'
  ];

  letterContent.innerHTML = FULL_LETTER_HTML;

  // প্রথম পেজ: জন্মদিনের উইশ + প্রপোজের স্পষ্ট ও গোছালো কথা
  const sceneLines = [
    {
      at: 0,
      text: 'শুভ জন্মদিন, মিম। আজকে তোমার জন্মদিনে তোমাকে জানাই অনেক অনেক শুভেচ্ছা। তোমার হাসি আর ভালো থাকাই সারাজীবন অটুট থাকুক।'
    },
    {
      at: 7000,
      text: 'তোমার জন্মদিনটা সুন্দর আর আনন্দে ভরে উঠুক। তোমার হাসি আর ভালো থাকাটাই আমার কাছে সবচেয়ে বড় আনন্দ।'
    },
    {
      at: 14000,
      text: 'আজ হাঁটু গেড়ে মনের গভীর থেকে বলতে চাই—মিম, আমি তোমাকে অনেক ভালোবাসি। হয়তো পূর্ণতা না পেলেও তোমার প্রতি এই অনুভূতিটুকু চিরকাল পবিত্র হয়ে থাকবে।'
    },
    {
      at: 21000,
      text: 'আমি তোমাকে কখনো পাবো না জেনেও মন থেকে চেয়েছি তুমি সবসময় ভালো থেকো। শুভ জন্মদিন মিম, ভালো থেকো, বিদায়।'
    }
  ];

  // true = ভয়েস সক্রিয়, false = ভয়েস মিউট করা (কিন্তু টেক্সট চলতে থাকবে)
  let ttsEnabled = true;
  let letterTimers = [];
  let activeSceneIdx = -1;
  let sceneLineBusy = false;
  let revealTimer = null;
  let speechFallbackTimer = null;
  let activeSpeechToken = 0;

  // বর্তমান চলমান লাইনের ভয়েস ও টেক্সট স্টেট (মিউট/আনমিউটের সময় টেক্সট না থামানোর জন্য)
  let currentLineState = null;

  function updateTtsButtonLabel() {
    toggleTtsBtn.textContent = ttsEnabled ? '🔇 ভয়েস মিউট' : '🔊 ভয়েস আনমিউট';
  }
  updateTtsButtonLabel();

  function clearRevealTimers() {
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    if (speechFallbackTimer) {
      clearTimeout(speechFallbackTimer);
      speechFallbackTimer = null;
    }
  }

  function cancelUtteranceOnly() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_e) {}
    }
  }

  function stopSpeech() {
    activeSpeechToken += 1;
    cancelUtteranceOnly();
  }

  function speakUtteranceForLine(state) {
    if (!ttsEnabled || !state || state.finished || !('speechSynthesis' in window)) return;
    try {
      const remainingChars = Array.from(state.text).slice(state.charIdx).join('');
      const textToSpeak = remainingChars.trim() ? remainingChars : state.text;
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = 'bn-BD';
      utter.rate = 0.88;

      utter.onend = () => {
        if (state.token !== activeSpeechToken || state.finished) return;
        state.speechFinished = true;
        if (state.typingFinished) {
          state.finishBoth();
        }
      };

      utter.onerror = () => {
        if (state.token !== activeSpeechToken || state.finished) return;
        state.speechFinished = true;
        if (state.typingFinished) {
          state.finishBoth();
        }
      };

      window.speechSynthesis.speak(utter);
    } catch (_e) {}
  }

  // আগে ভয়েস শুরু হবে, তারপর লেখা শুরু হবে; ভয়েস মিউট করলেও লেখা চলতে থাকবে
  function speakAndRevealSlowly(text, targetEl, onComplete) {
    clearRevealTimers();
    stopSpeech();

    const token = ++activeSpeechToken;
    const chars = Array.from(text);
    const totalChars = Math.max(chars.length, 1);

    // কথা বলার আনুমানিক সময় (স্লো টাইমিং)
    const estimatedSpeechMs = Math.max(4200, totalChars * 105);
    const stepDelay = Math.max(105, Math.floor((estimatedSpeechMs * 0.92) / totalChars));

    const state = {
      token,
      text,
      chars,
      targetEl,
      charIdx: 0,
      speechFinished: false,
      typingFinished: false,
      finished: false,
      finishBoth: null
    };

    currentLineState = state;

    state.finishBoth = () => {
      if (state.finished || token !== activeSpeechToken) return;
      state.finished = true;
      clearRevealTimers();
      targetEl.textContent = text;
      if (currentLineState === state) {
        currentLineState = null;
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    };

    function typeNextChar() {
      if (state.finished || token !== activeSpeechToken) return;
      if (state.charIdx < chars.length) {
        state.charIdx += 1;
        targetEl.textContent = chars.slice(0, state.charIdx).join('');
        revealTimer = setTimeout(typeNextChar, stepDelay);
      } else {
        state.typingFinished = true;
        if (state.speechFinished || !ttsEnabled) {
          state.finishBoth();
        }
      }
    }

    targetEl.textContent = '';

    // আগে ভয়েস শুরু হবে, তারপর লেখা শুরু হবে
    if (ttsEnabled && 'speechSynthesis' in window) {
      speakUtteranceForLine(state);
      revealTimer = setTimeout(typeNextChar, 220);
      speechFallbackTimer = setTimeout(() => {
        if (state.finished || token !== activeSpeechToken) return;
        state.speechFinished = true;
        if (state.typingFinished) {
          state.finishBoth();
        }
      }, estimatedSpeechMs + 900);
    } else {
      // ভয়েস মিউট থাকলেও লেখা চলতে থাকবে
      state.speechFinished = true;
      revealTimer = setTimeout(typeNextChar, 140);
      speechFallbackTimer = setTimeout(() => {
        if (state.finished || token !== activeSpeechToken) return;
        state.typingFinished = true;
        state.finishBoth();
      }, estimatedSpeechMs + 600);
    }
  }

  function appendArchivedItem(containerEl, text) {
    if (!text || !containerEl) return;
    const item = document.createElement('div');
    item.className = 'archived-line-item';
    item.textContent = text;
    containerEl.appendChild(item);
    containerEl.scrollTop = containerEl.scrollHeight;
  }

  function clearLetterTimers() {
    letterTimers.forEach((id) => clearTimeout(id));
    letterTimers = [];
  }

  window.AppAuth.bindLogout('logout-btn', () => {
    clearRevealTimers();
    stopSpeech();
    clearLetterTimers();
    if (voiceVideo && voiceVideo.src) {
      voiceVideo.pause();
    }
  });

  // মিউট করলে ভয়েস মিউট হবে, কিন্তু চলমান টেক্সট বন্ধ হবে না; আনমিউট করলে বাকি/চলমান ভয়েস চালু হবে
  toggleTtsBtn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    updateTtsButtonLabel();

    if (!ttsEnabled) {
      cancelUtteranceOnly();
    } else if (currentLineState && !currentLineState.finished) {
      speakUtteranceForLine(currentLineState);
    }
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x11081b);
  scene.fog = new THREE.FogExp2(0x11081b, 0.036);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0, 2.25, 6.6);
  camera.lookAt(0, 1.35, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffe6f0, 0.9);
  scene.add(ambientLight);

  const keySpotLight = new THREE.SpotLight(0xff8fa3, 1.85);
  keySpotLight.position.set(2.5, 6.8, 5.2);
  keySpotLight.castShadow = true;
  scene.add(keySpotLight);

  const fillLight = new THREE.DirectionalLight(0x72efdd, 0.72);
  fillLight.position.set(-4.5, 4.0, -3.0);
  scene.add(fillLight);

  const stageFloor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshStandardMaterial({ color: 0x1d102c, roughness: 0.78 })
  );
  stageFloor.rotation.x = -Math.PI / 2;
  stageFloor.receiveShadow = true;
  scene.add(stageFloor);

  // চারিদিকে আকাশে ওড়া রঙিন বার্থডে বেলুন (Floating Birthday Balloons)
  const balloonGroup = new THREE.Group();
  const balloonCount = 22;
  const balloonItems = [];
  const balloonColors = [0xff4d6d, 0xffbe0b, 0x4cc9f0, 0xc77dff, 0xff7eb6, 0x06d6a0];
  const stringMat = new THREE.LineBasicMaterial({ color: 0xf8f5ff, transparent: true, opacity: 0.55 });

  for (let i = 0; i < balloonCount; i++) {
    const singleBalloon = new THREE.Group();
    const bColor = balloonColors[i % balloonColors.length];

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 18),
      new THREE.MeshStandardMaterial({
        color: bColor,
        roughness: 0.35,
        metalness: 0.1
      })
    );
    dome.scale.set(0.95, 1.18, 0.95);

    const knot = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.06, 10),
      new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.5 })
    );
    knot.position.y = -0.22;

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.25, 0),
      new THREE.Vector3(0, -0.85, 0)
    ]);
    const stringLine = new THREE.Line(lineGeo, stringMat);

    singleBalloon.add(dome, knot, stringLine);

    const startX = (Math.random() - 0.5) * 9.5;
    const startY = -1.5 + Math.random() * 5.2;
    const startZ = -3.8 + Math.random() * 5.2;
    singleBalloon.position.set(startX, startY, startZ);

    balloonGroup.add(singleBalloon);
    balloonItems.push({
      mesh: singleBalloon,
      riseSpeed: 0.008 + Math.random() * 0.011,
      driftFreq: 0.0018 + Math.random() * 0.0022,
      driftAmp: 0.0025 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2,
      baseX: startX
    });
  }
  balloonGroup.visible = false;
  scene.add(balloonGroup);

  // মাথার ওপর থেকে Mim-এর ওপর ঝরে পড়া ফুলের পাপড়ি (Falling Flower Petals)
  const petalGroup = new THREE.Group();
  const petalCount = 75;
  const petalItems = [];
  const petalColors = [0xff4d6d, 0xff85a1, 0xffccd5, 0xff7eb6];

  for (let i = 0; i < petalCount; i++) {
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColors[i % petalColors.length],
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    const petalMesh = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10), petalMat);

    petalMesh.position.set(
      1.3 + (Math.random() - 0.5) * 1.45,
      2.6 + Math.random() * 2.8,
      (Math.random() - 0.5) * 1.25
    );
    petalMesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    petalGroup.add(petalMesh);

    petalItems.push({
      mesh: petalMesh,
      fallSpeed: 0.008 + Math.random() * 0.012,
      swayFreq: 0.003 + Math.random() * 0.003,
      swayAmp: 0.002 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2,
      spinSpeed: 0.02 + Math.random() * 0.03
    });
  }
  petalGroup.visible = false;
  scene.add(petalGroup);

  const particleCount = 110;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 14;
    particlePositions[i * 3 + 1] = Math.random() * 4.5 + 0.3;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffb3c6,
    size: 0.055,
    transparent: true,
    opacity: 0.72
  });
  const ambientParticles = new THREE.Points(particleGeo, particleMat);
  scene.add(ambientParticles);

  function makeNameSprite(label, accentColor = '#ff4d6d') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(18, 9, 28, 0.86)';
    ctx.beginPath();
    ctx.roundRect(22, 16, 212, 64, 18);
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 49);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.96, 0.36, 1);
    sprite.position.set(0, 2.42, 0);
    return sprite;
  }

  function buildCharacter({ shirtColor, pantsColor, nameText, accentColor, isGirl }) {
    const root = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6c9a6, roughness: 0.52 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.55 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.72 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x15101a, roughness: 0.65 });

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(isGirl ? 0.21 : 0.25, isGirl ? 0.29 : 0.22, 0.72, 20),
      shirtMat
    );
    torso.position.y = 1.24;
    torso.castShadow = true;
    root.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.82, 0);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 24), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeMat);
    leftEye.position.set(-0.065, 0.03, 0.175);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeMat);
    rightEye.position.set(0.065, 0.03, 0.175);

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 8, 16, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xb5173c })
    );
    mouth.position.set(0, -0.05, 0.18);
    mouth.rotation.x = Math.PI;

    headGroup.add(leftEye, rightEye, mouth);

    if (isGirl) {
      const crownHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.205, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.66),
        hairMat
      );
      crownHair.position.set(0, 0.02, -0.01);
      headGroup.add(crownHair);

      const longBackHair = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.24, 1.0, 18),
        hairMat
      );
      longBackHair.position.set(0, -0.46, -0.11);
      longBackHair.rotation.x = 0.08;
      longBackHair.castShadow = true;
      headGroup.add(longBackHair);

      const leftStrand = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.76, 12), hairMat);
      leftStrand.position.set(-0.17, -0.32, 0.05);
      const rightStrand = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.76, 12), hairMat);
      rightStrand.position.set(0.17, -0.32, 0.05);
      headGroup.add(leftStrand, rightStrand);
    } else {
      const shortHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.202, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.54),
        hairMat
      );
      shortHair.position.set(0, 0.02, -0.01);
      headGroup.add(shortHair);
    }

    root.add(headGroup);
    root.add(makeNameSprite(nameText, accentColor));

    function makeLimb(x, y, radius, length, mat) {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.85, length, 14),
        mat
      );
      mesh.position.y = -length / 2;
      mesh.castShadow = true;
      pivot.add(mesh);
      return pivot;
    }

    const leftArm = makeLimb(-0.32, 1.54, 0.055, 0.56, skinMat);
    const rightArm = makeLimb(0.32, 1.54, 0.055, 0.56, skinMat);
    root.add(leftArm, rightArm);

    const leftThigh = makeLimb(-0.12, 0.88, 0.075, 0.44, pantsMat);
    const leftShin = makeLimb(0, -0.44, 0.062, 0.44, skinMat);
    leftThigh.add(leftShin);

    const rightThigh = makeLimb(0.12, 0.88, 0.075, 0.44, pantsMat);
    const rightShin = makeLimb(0, -0.44, 0.062, 0.44, skinMat);
    rightThigh.add(rightShin);

    root.add(leftThigh, rightThigh);

    return {
      root,
      torso,
      headGroup,
      leftArm,
      rightArm,
      leftThigh,
      leftShin,
      rightThigh,
      rightShin
    };
  }

  const mim = buildCharacter({
    shirtColor: 0xff4d6d,
    pantsColor: 0x2b2d42,
    nameText: 'Mim',
    accentColor: '#ff7eb6',
    isGirl: true
  });
  mim.root.position.set(1.3, 0, 0);
  mim.root.rotation.y = -Math.PI / 2;
  scene.add(mim.root);

  const sam = buildCharacter({
    shirtColor: 0x4ea8de,
    pantsColor: 0x1b263b,
    nameText: 'Sam',
    accentColor: '#4cc9f0',
    isGirl: false
  });
  sam.root.position.set(-3.8, 0, 0);
  sam.root.rotation.y = Math.PI / 2;
  scene.add(sam.root);

  function createRose() {
    const roseGroup = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a9d8f })
    );
    stem.position.y = 0.14;

    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.4 })
    );
    bloom.position.y = 0.3;

    roseGroup.add(stem, bloom);
    return roseGroup;
  }

  const samRose = createRose();
  samRose.position.set(0, -0.52, 0.05);
  samRose.rotation.x = Math.PI / 3;
  samRose.visible = false;
  sam.rightArm.add(samRose);

  const mimRose = createRose();
  mimRose.position.set(0, -0.48, 0.06);
  mimRose.rotation.x = Math.PI / 4;
  mimRose.visible = false;
  mim.leftArm.add(mimRose);

  let hasAudioFile = false;
  async function initBackgroundAudio() {
    try {
      const res = await fetch('/api/get-media');
      const data = await res.json();
      if (data && data.found && data.file) {
        voiceVideo.src = data.file;
        voiceVideo.loop = false;
        hasAudioFile = true;
        soundBtn.style.display = 'inline-flex';
      }
    } catch (_err) {
      hasAudioFile = false;
    }
  }
  initBackgroundAudio();

  soundBtn.addEventListener('click', () => {
    if (!hasAudioFile) return;
    voiceVideo.muted = !voiceVideo.muted;
    soundBtn.textContent = voiceVideo.muted ? '🔇 অডিও মিউট' : '🔊 অডিও চালু';
  });

  // দ্বিতীয় পেজ (চিঠি): প্রথম দৃশ্যের কথা ও লেখা শেষ হওয়ার পর আলাদাভাবে শুরু হবে
  function startLetterSequence() {
    clearLetterTimers();
    clearRevealTimers();
    stopSpeech();
    currentLineState = null;
    letterSpotlight.textContent = '';
    letterArchivedList.innerHTML = '';

    let idx = 0;

    function runNextLetterLine() {
      if (letterModal.style.display !== 'flex') return;
      if (idx >= sequentialLines.length) {
        letterSpotlight.textContent = 'শুভ জন্মদিন মিম—সব কথা ও অনুভূতি এখানেই রইল।';
        return;
      }

      const currentLine = sequentialLines[idx];
      idx += 1;

      letterSpotlight.style.opacity = '0.2';
      const fadeId = setTimeout(() => {
        if (letterModal.style.display !== 'flex') return;
        letterSpotlight.style.opacity = '1';
        speakAndRevealSlowly(currentLine, letterSpotlight, () => {
          appendArchivedItem(letterArchivedList, currentLine);
          const nextId = setTimeout(runNextLetterLine, 700);
          letterTimers.push(nextId);
        });
      }, 250);
      letterTimers.push(fadeId);
    }

    runNextLetterLine();
  }

  function openLetterModal() {
    clearRevealTimers();
    stopSpeech();
    currentLineState = null;
    sceneLineBusy = false;
    letterModal.style.display = 'flex';
    startLetterSequence();
  }

  openLetterNowBtn.addEventListener('click', () => {
    storyStarted = false;
    storyPaused = false;
    petalGroup.visible = false;
    balloonGroup.visible = false;
    pauseResumeBtn.style.display = 'none';
    openLetterModal();
  });

  closeLetterBtn.addEventListener('click', () => {
    clearLetterTimers();
    clearRevealTimers();
    stopSpeech();
    currentLineState = null;
    letterModal.style.display = 'none';
    storyHud.style.display = 'block';
    startBtn.style.display = 'inline-flex';
  });

  let storyStarted = false;
  let storyPaused = false;
  let elapsedStoryMs = 0;
  let lastFrameNow = performance.now();

  function resetPetals() {
    petalGroup.visible = false;
    petalItems.forEach((p, idx) => {
      p.mesh.position.set(
        1.3 + (((idx % 9) - 4) * 0.16),
        2.5 + (idx % 7) * 0.42,
        (((idx % 5) - 2) * 0.24)
      );
    });
  }

  function resetBalloons() {
    balloonGroup.visible = false;
    balloonItems.forEach((b, idx) => {
      const bx = ((idx % 11) - 5) * 0.9;
      b.baseX = bx;
      b.mesh.position.set(bx, -1.4 + (idx % 6) * 0.9, -3.5 + (idx % 4) * 1.3);
    });
  }

  function resetCharacterPose() {
    sam.root.visible = true;
    sam.root.position.set(-3.8, 0, 0);
    sam.root.rotation.set(0, Math.PI / 2, 0);
    sam.leftThigh.rotation.set(0, 0, 0);
    sam.leftShin.rotation.set(0, 0, 0);
    sam.rightThigh.rotation.set(0, 0, 0);
    sam.rightShin.rotation.set(0, 0, 0);
    sam.leftArm.rotation.set(0, 0, 0);
    sam.rightArm.rotation.set(0, 0, 0);

    mim.root.position.set(1.3, 0, 0);
    mim.root.rotation.set(0, -Math.PI / 2, 0);
    mim.leftArm.rotation.set(0, 0, 0);
    mim.headGroup.rotation.set(0, 0, 0);

    samRose.visible = false;
    mimRose.visible = false;
    resetPetals();
    resetBalloons();
  }

  function resetScene() {
    clearRevealTimers();
    clearLetterTimers();
    stopSpeech();
    currentLineState = null;
    activeSceneIdx = -1;
    sceneLineBusy = false;
    elapsedStoryMs = 0;
    storyPaused = false;
    sceneArchivedList.innerHTML = '';
    letterArchivedList.innerHTML = '';
    resetCharacterPose();
    letterModal.style.display = 'none';
    storyHud.style.display = 'block';
    pauseResumeBtn.style.display = 'none';
    pauseResumeBtn.textContent = '⏸ বিরতি';
    captionBox.textContent = 'শুভ জন্মদিন, মিম। আজকে তোমার জন্মদিনে তোমাকে জানাই অনেক অনেক শুভেচ্ছা...';
  }

  function beginStory() {
    resetScene();
    startBtn.style.display = 'none';
    pauseResumeBtn.style.display = 'inline-flex';
    balloonGroup.visible = true;
    storyStarted = true;
    lastFrameNow = performance.now();

    if (hasAudioFile && voiceVideo.src) {
      voiceVideo.currentTime = 0;
      voiceVideo.play().catch(() => {});
    }
  }

  pauseResumeBtn.addEventListener('click', () => {
    if (!storyStarted) return;
    storyPaused = !storyPaused;
    lastFrameNow = performance.now();

    if (storyPaused) {
      pauseResumeBtn.textContent = '▶ চালিয়ে যান';
      clearRevealTimers();
      cancelUtteranceOnly();
      if (hasAudioFile && !voiceVideo.paused) voiceVideo.pause();
    } else {
      pauseResumeBtn.textContent = '⏸ বিরতি';
      if (currentLineState && !currentLineState.finished) {
        const resumeState = currentLineState;
        speakUtteranceForLine(resumeState);
        const stepDelay = 120;
        const stepFn = () => {
          if (resumeState.finished || resumeState.token !== activeSpeechToken || storyPaused) return;
          if (resumeState.charIdx < resumeState.chars.length) {
            resumeState.charIdx += 1;
            resumeState.targetEl.textContent = resumeState.chars.slice(0, resumeState.charIdx).join('');
            revealTimer = setTimeout(stepFn, stepDelay);
          } else {
            resumeState.typingFinished = true;
            if (resumeState.speechFinished || !ttsEnabled) {
              resumeState.finishBoth();
            }
          }
        };
        revealTimer = setTimeout(stepFn, stepDelay);
      }
      if (hasAudioFile && voiceVideo.paused) voiceVideo.play().catch(() => {});
    }
  });

  startBtn.addEventListener('click', beginStory);
  replayBtn.addEventListener('click', beginStory);

  function animateBalloons(now) {
    if (!balloonGroup.visible) return;
    balloonItems.forEach((b) => {
      b.mesh.position.y += b.riseSpeed;
      b.mesh.position.x = b.baseX + Math.sin(now * b.driftFreq + b.phase) * 0.45;
      b.mesh.rotation.z = Math.sin(now * b.driftFreq + b.phase) * 0.12;

      if (b.mesh.position.y > 5.2) {
        b.mesh.position.y = -1.6;
      }
    });
  }

  function animatePetals(now) {
    if (!petalGroup.visible) return;
    petalItems.forEach((p) => {
      p.mesh.position.y -= p.fallSpeed;
      p.mesh.position.x += Math.sin(now * p.swayFreq + p.phase) * p.swayAmp;
      p.mesh.rotation.x += p.spinSpeed;
      p.mesh.rotation.y += p.spinSpeed * 0.8;

      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 2.8 + Math.random() * 1.4;
        p.mesh.position.x = 1.3 + (Math.random() - 0.5) * 1.4;
      }
    });
  }

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min(now - lastFrameNow, 100);
    lastFrameNow = now;

    if (storyStarted && !storyPaused) {
      elapsedStoryMs += delta;
      animateBalloons(now);
      animatePetals(now);
    }

    mim.torso.position.y = 1.24 + Math.sin(now * 0.003) * 0.012;
    ambientParticles.rotation.y = now * 0.00008;

    if (storyStarted) {
      const elapsed = elapsedStoryMs;

      for (let i = 0; i < sceneLines.length; i++) {
        if (!sceneLineBusy && elapsed >= sceneLines[i].at && activeSceneIdx < i) {
          activeSceneIdx = i;
          sceneLineBusy = true;
          const lineText = sceneLines[i].text;
          speakAndRevealSlowly(lineText, captionBox, () => {
            appendArchivedItem(sceneArchivedList, lineText);
            sceneLineBusy = false;
          });
          break;
        }
      }

      // ১. (০ - ৫.৫ সেকেন্ড): Sam এগিয়ে আসবে
      if (elapsed < 5500) {
        petalGroup.visible = false;
        const p = elapsed / 5500;
        sam.root.position.x = -3.8 + p * 3.9;
        const swing = Math.sin(elapsed * 0.011);
        sam.leftThigh.rotation.x = swing * 0.45;
        sam.rightThigh.rotation.x = -swing * 0.45;
        sam.leftArm.rotation.x = -swing * 0.35;
        sam.rightArm.rotation.x = swing * 0.35;
        sam.root.position.y = Math.abs(Math.cos(elapsed * 0.011)) * 0.04;
      }
      // ২. (৫.৫ - ১৪ সেকেন্ড): কাছে এলে পাপড়ি ঝরা ও হাঁটু গেড়ে ফুল/শুভেচ্ছা
      else if (elapsed < 14000) {
        petalGroup.visible = true;
        sam.root.position.set(0.1, -0.26, 0);
        sam.leftThigh.rotation.x = -1.15;
        sam.leftShin.rotation.x = 1.45;
        sam.rightThigh.rotation.x = 0.25;
        sam.rightShin.rotation.x = 0;

        sam.rightArm.rotation.x = -1.45;
        sam.rightArm.rotation.z = -0.15;
        samRose.visible = true;
      }
      // ৩. (১৪ - ১৭.৫ সেকেন্ড): ফুলটি Mim-এর হাতে চলে যাওয়া
      else if (elapsed < 17500) {
        petalGroup.visible = true;
        sam.root.position.set(0.1, -0.26, 0);
        samRose.visible = false;
        mimRose.visible = true;
        mim.leftArm.rotation.x = -0.65;
      }
      // ৪. (১৭.৫ - ২০ সেকেন্ড): উঠে দাঁড়ানো
      else if (elapsed < 20000) {
        sam.root.position.set(0.1, 0, 0);
        sam.leftThigh.rotation.set(0, 0, 0);
        sam.leftShin.rotation.set(0, 0, 0);
        sam.rightThigh.rotation.set(0, 0, 0);
        sam.rightShin.rotation.set(0, 0, 0);
        sam.rightArm.rotation.set(0, 0, 0);
        mim.leftArm.rotation.x = -0.45;
      }
      // ৫. (২০ - ৩২ সেকেন্ড): সরে যাওয়া ও কথা/লেখা শেষ হওয়ার অপেক্ষা
      else if (elapsed < 32000) {
        const backP = Math.min(1, (elapsed - 20000) / 8000);
        sam.root.position.x = 0.1 - backP * 4.4;
        const step = Math.sin(elapsed * 0.0085);
        sam.leftThigh.rotation.x = -step * 0.35;
        sam.rightThigh.rotation.x = step * 0.35;
        sam.leftArm.rotation.x = step * 0.25;
        sam.rightArm.rotation.x = -step * 0.25;
        sam.root.position.y = Math.abs(Math.cos(elapsed * 0.0085)) * 0.03;

        if (backP > 0.72) {
          petalGroup.visible = false;
        }
        if (backP > 0.94) {
          sam.root.visible = false;
        }
      }
      // ৬. প্রথম পেজের কথা ও লেখা পুরোপুরি শেষ হওয়ার পর দ্বিতীয় পেজ (চিঠি) খুলবে
      else if (!sceneLineBusy && activeSceneIdx >= sceneLines.length - 1) {
        storyStarted = false;
        petalGroup.visible = false;
        balloonGroup.visible = false;
        pauseResumeBtn.style.display = 'none';
        if (hasAudioFile && voiceVideo.src) {
          voiceVideo.pause();
          voiceVideo.currentTime = 0;
        }
        storyHud.style.display = 'none';
        openLetterModal();
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();