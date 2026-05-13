const CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

const MODES = {
  WORK: { label: '专注', minutes: 25, next: 'SHORT_BREAK', cssClass: 'mode-work' },
  SHORT_BREAK: { label: '短休', minutes: 5, next: 'WORK', cssClass: 'mode-short_break' },
  LONG_BREAK: { label: '长休', minutes: 15, next: 'WORK', cssClass: 'mode-long_break' },
};

let state = 'IDLE'; // IDLE | RUNNING | PAUSED
let currentMode = 'WORK';
let timeLeft = MODES.WORK.minutes * 60;
let totalTime = MODES.WORK.minutes * 60;
let timerInterval = null;
let completedSessions = 0;
let audioCtx = null;

// DOM
const body = document.body;
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnReset = document.getElementById('btnReset');
const timeDisplay = document.getElementById('timeDisplay');
const modeText = document.getElementById('modeText');
const ringProgress = document.getElementById('ringProgress');
const sessionLabel = document.getElementById('sessionLabel');
const sessionDots = document.getElementById('sessionDots').children;

function applyModeClass(mode) {
  body.classList.remove(...Object.values(MODES).map(m => m.cssClass));
  body.classList.add(MODES[mode].cssClass);
}

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
  applyModeClass(mode);
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
  const round = Math.floor((completedSessions - 1) / 4) * 4;
  const newLabel = `第 ${round + 1} 轮`;

  if (completedSessions % 4 === 0) {
    for (let i = 0; i < sessionDots.length; i++) {
      sessionDots[i].classList.remove('filled');
    }
  } else {
    for (let i = 0; i < sessionDots.length; i++) {
      sessionDots[i].classList.toggle('filled', i < completedSessions - round);
    }
  }

  if (sessionLabel.textContent !== newLabel) {
    sessionLabel.textContent = newLabel;
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
  if (state === 'IDLE' || state === 'PAUSED') startTimer();
});

btnPause.addEventListener('click', () => {
  if (state === 'RUNNING') pauseTimer();
});

btnReset.addEventListener('click', () => {
  resetTimer();
});

// Init
applyModeClass('WORK');
updateDisplay();
updateButtons();
