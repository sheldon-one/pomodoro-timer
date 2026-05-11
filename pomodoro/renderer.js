const CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

const MODES = {
  WORK: { label: '专注', minutes: 25, next: 'SHORT_BREAK' },
  SHORT_BREAK: { label: '短休', minutes: 5, next: 'WORK' },
  LONG_BREAK: { label: '长休', minutes: 15, next: 'WORK' },
};

let state = 'IDLE'; // IDLE | RUNNING | PAUSED
let currentMode = 'WORK';
let timeLeft = MODES.WORK.minutes * 60;
let totalTime = MODES.WORK.minutes * 60;
let timerInterval = null;
let completedSessions = 0;
let audioCtx = null;

// DOM
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');
const timeDisplay = document.getElementById('timeDisplay');
const modeText = document.getElementById('modeText');
const ringProgress = document.getElementById('ringProgress');
const sessionDots = document.getElementById('sessionDots').children;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(timeLeft);
  const progress = (totalTime - timeLeft) / totalTime;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  updateTitle();
}

function updateTitle() {
  const label = MODES[currentMode].label;
  window.electronAPI.setTitle(`${label} - ${formatTime(timeLeft)}`);
}

function updateButtons() {
  if (state === 'IDLE') {
    btnStart.textContent = '开始';
    btnStart.disabled = false;
    btnPause.disabled = true;
  } else if (state === 'RUNNING') {
    btnStart.textContent = '开始';
    btnStart.disabled = true;
    btnPause.textContent = '暂停';
    btnPause.disabled = false;
  } else if (state === 'PAUSED') {
    btnStart.textContent = '继续';
    btnStart.disabled = false;
    btnPause.textContent = '暂停';
    btnPause.disabled = true;
  }
}

function setMode(mode) {
  currentMode = mode;
  timeLeft = MODES[mode].minutes * 60;
  totalTime = MODES[mode].minutes * 60;
  modeText.textContent = MODES[mode].label;
  updateDisplay();
}

function switchMode() {
  if (currentMode === 'WORK') {
    completedSessions++;
    updateSessionDots();
    if (completedSessions % 4 === 0) {
      setMode('LONG_BREAK');
    } else {
      setMode('SHORT_BREAK');
    }
    notify('工作时间结束', '休息一下吧 ☕');
  } else {
    setMode('WORK');
    notify('休息结束', '开始专注工作 💪');
  }
}

function updateSessionDots() {
  const idx = (completedSessions - 1) % 4;
  for (let i = 0; i < sessionDots.length; i++) {
    sessionDots[i].classList.toggle('active', i <= idx && completedSessions % 4 !== 0);
    // for a fresh round after 4+long_break, all dots should be empty
    if (completedSessions % 4 === 0) {
      sessionDots[i].classList.remove('active');
    }
  }
}

function startTimer() {
  state = 'RUNNING';
  updateButtons();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      state = 'IDLE';
      playSound();
      switchMode();
      updateDisplay();
      updateButtons();
      // Auto-start next phase
      startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  state = 'PAUSED';
  clearInterval(timerInterval);
  timerInterval = null;
  updateButtons();
}

function resetTimer() {
  state = 'IDLE';
  clearInterval(timerInterval);
  timerInterval = null;
  setMode(currentMode);
  updateButtons();
}

function notify(title, body) {
  window.electronAPI.showNotification({ title, body });
}

function playSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Play 3 beeps
  let beepCount = 0;
  function beep() {
    if (beepCount >= 3) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
    beepCount++;
    setTimeout(beep, 300);
  }
  beep();
}

btnStart.addEventListener('click', () => {
  if (state === 'IDLE' || state === 'PAUSED') {
    startTimer();
  }
});

btnPause.addEventListener('click', () => {
  if (state === 'RUNNING') {
    pauseTimer();
  }
});

btnReset.addEventListener('click', () => {
  resetTimer();
});

// Init
updateDisplay();
updateButtons();
