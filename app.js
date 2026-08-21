// Honorifics Lab - Main Application Logic

const state = {
  view: "home",          // home | language | level | lesson | quiz
  language: null,
  level: null,
  lessonIndex: 0,
  quizIndex: 0,
  quizAnswers: [],
  progress: JSON.parse(localStorage.getItem("honorifics-lab-progress") || "{}")
};

function saveProgress() {
  localStorage.setItem("honorifics-lab-progress", JSON.stringify(state.progress));
}

function markComplete(lang, level, lessonId) {
  if (!state.progress[lang]) state.progress[lang] = {};
  if (!state.progress[lang][level]) state.progress[lang][level] = [];
  if (!state.progress[lang][level].includes(lessonId)) {
    state.progress[lang][level].push(lessonId);
    saveProgress();
  }
}

function isComplete(lang, level, lessonId) {
  return state.progress[lang]?.[level]?.includes(lessonId) || false;
}

function getCompletionCount(lang, level) {
  return state.progress[lang]?.[level]?.length || 0;
}

// ============ RENDER FUNCTIONS ============

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  app.classList.add("fade-in");

  switch (state.view) {
    case "home":
      renderHome(app);
      break;
    case "language":
      renderLanguage(app);
      break;
    case "level":
      renderLevel(app);
      break;
    case "lesson":
      renderLesson(app);
      break;
    case "quiz":
      renderQuiz(app);
      break;
    case "quiz-result":
      renderQuizResult(app);
      break;
  }

  // Scroll to top
  window.scrollTo(0, 0);
}

function renderHome(app) {
  app.innerHTML = `
    <header class="mb-10 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 text-brand-300 text-xs font-medium mb-4">
        Free • No subscription • Progress saved locally
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
        Honorifics Lab
      </h1>
      <p class="text-gray-400 text-lg max-w-md mx-auto">
        Master the politeness systems of Korean & Japanese — the part most apps skip.
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 mb-10">
      ${APP_DATA.languages.map(lang => `
        <button onclick="selectLanguage('${lang.id}')"
          class="card-hover group text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6">
          <div class="flex items-start justify-between mb-4">
            <span class="text-4xl">${lang.flag}</span>
            <span class="text-xs text-gray-500 group-hover:text-gray-400">Start →</span>
          </div>
          <h2 class="text-xl font-semibold mb-1">${lang.name}</h2>
          <p class="text-sm text-gray-500 mb-3">${lang.native}</p>
          <p class="text-sm text-gray-400">${lang.description}</p>
        </button>
      `).join("")}
    </div>

    <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400">
      <p class="font-medium text-gray-300 mb-2">Why this exists</p>
      <p>Most language apps teach one polite form and move on. Real Korean and Japanese require constant social judgment about speech levels and honorifics. This app focuses only on that skill.</p>
    </div>
  `;
}

function selectLanguage(id) {
  state.language = id;
  state.view = "language";
  render();
}

function renderLanguage(app) {
  const lang = APP_DATA.languages.find(l => l.id === state.language);
  const content = APP_DATA.content[state.language];

  app.innerHTML = `
    <button onclick="goHome()" class="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
      ← All languages
    </button>

    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">${lang.flag}</span>
        <div>
          <h1 class="text-2xl font-bold">${lang.name}</h1>
          <p class="text-gray-400 text-sm">${lang.native}</p>
        </div>
      </div>
      <p class="text-gray-400">${lang.description}</p>
    </div>

    <div class="space-y-3">
      ${["beginner", "intermediate", "advanced"].map(level => {
        const levelData = content[level];
        const total = levelData.lessons.length;
        const done = getCompletionCount(state.language, level);
        const isAdvancedPlaceholder = level === "advanced";

        return `
          <button onclick="selectLevel('${level}')"
            class="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 card-hover">
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-semibold capitalize">${level}</h3>
              ${!isAdvancedPlaceholder ? `
                <span class="text-xs text-gray-500">${done}/${total} complete</span>
              ` : `
                <span class="text-xs text-amber-500/80">Coming soon</span>
              `}
            </div>
            <p class="text-sm text-gray-400">${levelData.description}</p>
            ${!isAdvancedPlaceholder && total > 0 ? `
              <div class="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-brand-500 rounded-full transition-all" style="width: ${(done/total)*100}%"></div>
              </div>
            ` : ""}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function selectLevel(level) {
  state.level = level;
  state.view = "level";
  state.lessonIndex = 0;
  render();
}

function renderLevel(app) {
  const lang = APP_DATA.languages.find(l => l.id === state.language);
  const levelData = APP_DATA.content[state.language][state.level];

  app.innerHTML = `
    <button onclick="state.view='language'; render()" class="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
      ← ${lang.name}
    </button>

    <div class="mb-8">
      <p class="text-sm text-brand-400 font-medium mb-1 capitalize">${state.level}</p>
      <h1 class="text-2xl font-bold mb-2">${levelData.title}</h1>
      <p class="text-gray-400">${levelData.description}</p>
    </div>

    <div class="space-y-3">
      ${levelData.lessons.map((lesson, idx) => {
        const done = isComplete(state.language, state.level, lesson.id);
        return `
          <button onclick="openLesson(${idx})"
            class="w-full text-left bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 card-hover flex items-center gap-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
              ${done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}">
              ${done ? '✓' : idx + 1}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">${lesson.title}</div>
              <div class="text-xs text-gray-500 capitalize">${lesson.type}</div>
            </div>
            <span class="text-gray-600">→</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function openLesson(index) {
  state.lessonIndex = index;
  const lesson = APP_DATA.content[state.language][state.level].lessons[index];
  
  if (lesson.type === "quiz") {
    state.view = "quiz";
    state.quizIndex = 0;
    state.quizAnswers = [];
  } else {
    state.view = "lesson";
  }
  render();
}

function renderLesson(app) {
  const lang = APP_DATA.languages.find(l => l.id === state.language);
  const levelData = APP_DATA.content[state.language][state.level];
  const lesson = levelData.lessons[state.lessonIndex];
  const isLast = state.lessonIndex === levelData.lessons.length - 1;

  app.innerHTML = `
    <button onclick="state.view='level'; render()" class="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
      ← Back to lessons
    </button>

    <div class="mb-6">
      <p class="text-xs text-gray-500 mb-1">${lang.name} · ${state.level}</p>
      <h1 class="text-xl font-bold">${lesson.title}</h1>
    </div>

    <div class="prose prose-invert max-w-none mb-10">
      ${lesson.content}
    </div>

    <div class="flex gap-3">
      <button onclick="completeAndNext()"
        class="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-4 rounded-xl transition">
        ${isLast ? "Complete Section" : "Next Lesson"}
      </button>
    </div>
  `;
}

function completeAndNext() {
  const levelData = APP_DATA.content[state.language][state.level];
  const lesson = levelData.lessons[state.lessonIndex];
  
  markComplete(state.language, state.level, lesson.id);

  if (state.lessonIndex < levelData.lessons.length - 1) {
    openLesson(state.lessonIndex + 1);
  } else {
    state.view = "level";
    render();
  }
}

function renderQuiz(app) {
  const lang = APP_DATA.languages.find(l => l.id === state.language);
  const levelData = APP_DATA.content[state.language][state.level];
  const lesson = levelData.lessons[state.lessonIndex];
  const q = lesson.questions[state.quizIndex];
  const progress = ((state.quizIndex) / lesson.questions.length) * 100;

  app.innerHTML = `
    <button onclick="state.view='level'; render()" class="text-sm text-gray-500 hover:text-gray-300 mb-6 flex items-center gap-1">
      ← Back
    </button>

    <div class="mb-6">
      <div class="flex justify-between text-xs text-gray-500 mb-2">
        <span>${lang.name} · Quiz</span>
        <span>${state.quizIndex + 1} / ${lesson.questions.length}</span>
      </div>
      <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div class="h-full bg-brand-500 rounded-full transition-all" style="width: ${progress}%"></div>
      </div>
      <h2 class="text-lg font-semibold leading-snug">${q.q}</h2>
    </div>

    <div class="space-y-3 mb-8">
      ${q.options.map((opt, i) => `
        <button onclick="answerQuiz(${i})"
          class="quiz-option w-full text-left bg-gray-900 border border-gray-800 hover:border-brand-500 hover:bg-gray-900/80 rounded-xl p-4">
          <span class="text-gray-500 mr-3">${String.fromCharCode(65 + i)}.</span>
          ${opt}
        </button>
      `).join("")}
    </div>
  `;
}

function answerQuiz(selected) {
  const lesson = APP_DATA.content[state.language][state.level].lessons[state.lessonIndex];
  const q = lesson.questions[state.quizIndex];
  
  state.quizAnswers.push({
    selected,
    correct: selected === q.answer,
    explanation: q.explanation
  });

  if (state.quizIndex < lesson.questions.length - 1) {
    state.quizIndex++;
    render();
  } else {
    // Mark quiz complete
    markComplete(state.language, state.level, lesson.id);
    state.view = "quiz-result";
    render();
  }
}

function renderQuizResult(app) {
  const lesson = APP_DATA.content[state.language][state.level].lessons[state.lessonIndex];
  const correctCount = state.quizAnswers.filter(a => a.correct).length;
  const total = lesson.questions.length;
  const percent = Math.round((correctCount / total) * 100);

  app.innerHTML = `
    <div class="text-center mb-8">
      <div class="text-5xl mb-4">${percent >= 70 ? "🎉" : "📚"}</div>
      <h1 class="text-2xl font-bold mb-2">Quiz Complete</h1>
      <p class="text-gray-400">You got <span class="text-white font-medium">${correctCount}/${total}</span> correct (${percent}%)</p>
    </div>

    <div class="space-y-4 mb-10">
      ${lesson.questions.map((q, i) => {
        const ans = state.quizAnswers[i];
        return `
          <div class="bg-gray-900 border ${ans.correct ? 'border-emerald-800' : 'border-rose-900'} rounded-xl p-4">
            <div class="flex items-start gap-2 mb-2">
              <span class="${ans.correct ? 'text-emerald-400' : 'text-rose-400'} font-medium">
                ${ans.correct ? "✓" : "✗"}
              </span>
              <p class="text-sm font-medium">${q.q}</p>
            </div>
            <p class="text-xs text-gray-400 ml-6">${ans.explanation}</p>
          </div>
        `;
      }).join("")}
    </div>

    <button onclick="state.view='level'; render()"
      class="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 px-4 rounded-xl transition">
      Back to Lessons
    </button>
  `;
}

function goHome() {
  state.view = "home";
  state.language = null;
  state.level = null;
  render();
}

// Start the app
render();
