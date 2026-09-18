const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const targetInput = document.getElementById("targetDate");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const heroEl = document.getElementById("hero");
const contentEl = document.getElementById("content");

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const calendarMonthYear = document.getElementById("calendarMonthYear");
const calendarDays = document.getElementById("calendarDays");

let timerId = null;
let hasTriggeredFinished = false;
let currentCalDate = new Date();

function pad(number) {
  return String(number).padStart(2, "0");
}

function displayTime(totalSeconds) {
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
}

// Synthesize a completion chime using Web Audio API
function playCompletionSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playNote(523.25, 0.00, 0.35);
    playNote(659.25, 0.15, 0.35);
    playNote(783.99, 0.30, 0.40);
    playNote(1046.50, 0.45, 0.90);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

function triggerFinishAction() {
  heroEl.classList.add("finished");
  contentEl.classList.add("finished");
  playCompletionSound();
}

function resetFinishAction() {
  heroEl.classList.remove("finished");
  contentEl.classList.remove("finished");
  hasTriggeredFinished = false;
}

// Calendar UI Renderer
function renderCalendar() {
  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
  calendarDays.innerHTML = "";

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const selectedDate = targetInput.value ? new Date(targetInput.value) : null;
  const today = new Date();

  // Previous month padding cells
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day other-month";
    btn.textContent = dayNum;
    btn.dataset.year = month === 0 ? year - 1 : year;
    btn.dataset.month = month === 0 ? 11 : month - 1;
    btn.dataset.day = dayNum;
    calendarDays.appendChild(btn);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.textContent = d;
    btn.dataset.year = year;
    btn.dataset.month = month;
    btn.dataset.day = d;

    if (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    ) {
      btn.classList.add("today");
    }

    if (
      selectedDate &&
      !isNaN(selectedDate.getTime()) &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    ) {
      btn.classList.add("selected");
    }

    calendarDays.appendChild(btn);
  }

  // Next month padding cells
  const totalCells = firstDayOfMonth + daysInMonth;
  const nextDays = (7 - (totalCells % 7)) % 7;
  for (let n = 1; n <= nextDays; n++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day other-month";
    btn.textContent = n;
    btn.dataset.year = month === 11 ? year + 1 : year;
    btn.dataset.month = month === 11 ? 0 : month + 1;
    btn.dataset.day = n;
    calendarDays.appendChild(btn);
  }
}

function startCountdown() {
  if (timerId) {
    clearInterval(timerId);
  }

  resetFinishAction();

  const value = targetInput.value;

  if (!value) {
    statusEl.textContent = "Please choose a date and time.";
    displayTime(0);
    return;
  }

  const targetTime = new Date(value).getTime();

  if (Number.isNaN(targetTime)) {
    statusEl.textContent = "Please enter a valid date and time.";
    return;
  }

  function update() {
    const difference = targetTime - Date.now();
    const totalSeconds = Math.max(0, Math.floor(difference / 1000));

    displayTime(totalSeconds);

    if (difference <= 0) {
      statusEl.textContent = "TIME IS UP!";
      clearInterval(timerId);
      timerId = null;

      if (!hasTriggeredFinished) {
        hasTriggeredFinished = true;
        triggerFinishAction();
      }
    } else {
      statusEl.textContent = "";
    }
  }

  update();
  timerId = setInterval(update, 1000);
}

// Calendar Navigation and Selection Handlers
calendarDays.addEventListener("click", (e) => {
  const target = e.target.closest(".cal-day");
  if (!target) return;

  const year = parseInt(target.dataset.year, 10);
  const month = parseInt(target.dataset.month, 10);
  const day = parseInt(target.dataset.day, 10);

  let hours = 0;
  let minutes = 0;

  if (targetInput.value) {
    const existing = new Date(targetInput.value);
    if (!isNaN(existing.getTime())) {
      hours = existing.getHours();
      minutes = existing.getMinutes();
    }
  } else {
    const now = new Date();
    hours = now.getHours();
    minutes = now.getMinutes();
  }

  const newDate = new Date(year, month, day, hours, minutes);
  const localISO = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  targetInput.value = localISO;
  currentCalDate = new Date(year, month, 1);
  renderCalendar();
  startCountdown();
});

prevMonthBtn.addEventListener("click", () => {
  currentCalDate.setMonth(currentCalDate.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentCalDate.setMonth(currentCalDate.getMonth() + 1);
  renderCalendar();
});

targetInput.addEventListener("change", () => {
  if (targetInput.value) {
    const d = new Date(targetInput.value);
    if (!isNaN(d.getTime())) {
      currentCalDate = new Date(d.getFullYear(), d.getMonth(), 1);
    }
  }
  renderCalendar();
});

startBtn.addEventListener("click", startCountdown);

// Default setup: 24 hours from now
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
tomorrow.setSeconds(0, 0);
const localValue = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 16);

targetInput.value = localValue;
currentCalDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);

renderCalendar();
startCountdown();