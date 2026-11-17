// ===== وضعیت =====
const state = {
  currentCar: null,
  favorites: JSON.parse(localStorage.getItem("favs") || "[]"),
  exploded: false
};

let isViewingSubParts = false;
let currentMainPart = null;

// ===== المان‌ها =====
const $ = (s) => document.querySelector(s);
const galleryView = $("#galleryView");
const detailView = $("#detailView");
const carGrid = $("#carGrid");
const carContainer = $("#carContainer");
const partPanel = $("#partPanel");
const favoritesView = $("#favoritesView");
const troubleshootView = $("#troubleshootView");

// ===== سیستم نوتیفیکیشن (Toast) =====
function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ===== تم تاریک/روشن =====
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
if (document.body.classList.contains("dark")) {
  const tt = $("#themeToggle");
  if(tt) tt.textContent = "☀️";
}

const themeToggle = $("#themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });
}

// ===== تابع انیمیشن =====
function replayRevealAnimation() {
  const cards = document.querySelectorAll('.reveal');
  cards.forEach(card => card.classList.remove('active'));
  
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    cards.forEach(card => observer.observe(card));
  }, 50);
}

// ===== ساخت گالری =====
function renderGallery() {
  const searchInput = $("#carSearchInput");
  const noResults = $("#noResults");
  const brandBtns = document.querySelectorAll(".brand-btn");
  const sortSelect = document.getElementById("sortSelect");
  
  let currentBrand = "all";
  let currentSort = "default";

  const initScrollReveal = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  };

  const drawCars = (query = "") => {
    carGrid.innerHTML = "";
    let found = false;
    const normalizedQuery = query.trim().toLowerCase();
    let carsToRender = [...CARS];

    if (currentSort === "high") {
      carsToRender.sort((a, b) => b.reliability - a.reliability);
    } else if (currentSort === "low") {
      carsToRender.sort((a, b) => a.reliability - b.reliability);
    }carsToRender.forEach(car => {
      const matchSearch = car.name.toLowerCase().includes(normalizedQuery);
      const matchBrand = currentBrand === "all" || car.brand === currentBrand;

      if (matchSearch && matchBrand) {
        found = true;
       const card = document.createElement("div");
card.className = "car-card reveal";

let imgHTML = '';
if (car.imgUrl) {
    imgHTML = '<img src="' + car.imgUrl + '" style="width:100%; height:140px; object-fit:cover; border-radius:12px 12px 0 0; margin-bottom:12px; display:block;">';
} else {
    imgHTML = '<span class="car-emoji">' + car.emoji + '</span>';
}

card.innerHTML = 
  imgHTML +
  '<div class="car-name">' + car.name + '</div>' +
  '<div class="car-score">قابلیت اطمینان: ' + car.reliability + '/10</div>';
  
card.addEventListener("click", () => openCar(car.id));
carGrid.appendChild(card);
      }
    });

    if (noResults) noResults.style.display = found ? "none" : "block";
    setTimeout(initScrollReveal, 50);
  };

  drawCars();

  if (searchInput) searchInput.addEventListener("input", (e) => { drawCars(e.target.value); });

  brandBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      brandBtns.forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      currentBrand = e.target.dataset.brand;
      drawCars(searchInput ? searchInput.value : "");
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      drawCars(searchInput ? searchInput.value : "");
    });
  }
}

// ===== باز کردن خودرو =====
function openCar(id) {
  const car = CARS.find(c => c.id === id);
  if (!car) return;
  state.currentCar = car;
  state.exploded = false;
  // مخفی کردن دکمه بازگشت در هنگام ورود به ماشین جدید
const backBtnEl = document.getElementById("backToCarBtn");
if (backBtnEl) backBtnEl.style.display = "none";

  $("#carTitle").textContent = car.name;
  $("#reliabilityBadge").textContent = "نمره‌ی کلی: " + car.reliability + "/10";

  // 👇 نمایش مشخصات فنی 👇
const specsContainer = document.getElementById("carSpecs");
if (specsContainer) {
  if (car.specs) {
    specsContainer.innerHTML = 
      '<div class="spec-card"><span class="spec-icon">⚙️</span><div class="spec-label">حجم موتور</div><div class="spec-value">' + car.specs.engine + '</div></div>' +
      '<div class="spec-card"><span class="spec-icon">🐎</span><div class="spec-label">قدرت</div><div class="spec-value">' + car.specs.power + '</div></div>' +
      '<div class="spec-card"><span class="spec-icon">⏱️</span><div class="spec-label">شتاب ۰ تا ۱۰۰</div><div class="spec-value">' + car.specs.accel + '</div></div>' +
      '<div class="spec-card"><span class="spec-icon">🚀</span><div class="spec-label">حداکثر سرعت</div><div class="spec-value">' + car.specs.topSpeed + '</div></div>' +
      '<div class="spec-card"><span class="spec-icon">⛽</span><div class="spec-label">مصرف سوخت ترکیبی</div><div class="spec-value">' + car.specs.fuel + '</div></div>';
  } else {
    specsContainer.innerHTML = '<p style="color:var(--text-muted)">مشخصات فنی برای این خودرو ثبت نشده است.</p>';
  }
}

  carContainer.innerHTML = "";
  car.parts.forEach(part => {
    const el = document.createElement("div");
    el.className = "part-piece cursor-wrench";
    
    if (part.image) {
      const img = document.createElement("img");
      img.src = part.image;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";
      img.style.pointerEvents = "none";
      el.appendChild(img);
    } else {
      el.textContent = part.icon;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.fontSize = "1.8rem";
    }

    el.style.left = part.x + "%";
    el.style.top = part.y + "%";
    el.dataset.partId = part.id;
    
    if (part.score >= 7) el.dataset.score = "high";
    else if (part.score >= 5) el.dataset.score = "medium";
    else el.dataset.score = "low";

    const angle = Math.atan2(part.y - 50, part.x - 50);
    const dist = window.innerWidth < 768 ? 75 : 160 ;
    el.style.setProperty("--tx", Math.cos(angle) * dist + "px");
    el.style.setProperty("--ty", Math.sin(angle) * dist + "px");
    
    el.title = part.name;
    el.addEventListener("click", () => selectPart(part, el));
    
    carContainer.appendChild(el);
  });

  setTimeout(() => {
    state.exploded = true;
    document.querySelectorAll(".part-piece").forEach(el => el.classList.add("exploded"));
    
    const stage = document.getElementById("explodeStage");
    if (stage) {
      stage.classList.add("shake-stage");
      setTimeout(() => stage.classList.remove("shake-stage"), 400);
    }
    spawnParticles();
  }, 500);

  resetPanel();
  renderChart(car);
  renderSearchFilter(car);

  galleryView.classList.remove("active");
  detailView.classList.add("active");
  window.scrollTo(0, 0);
}

// ===== انتخاب قطعه =====
function selectPart(part, el) {
  const gameSection = document.getElementById("gameSection");
  if (gameSection && gameSection.style.display === "block") {
    checkGameAnswer(part, el);
    return;
  }

  document.querySelectorAll(".part-piece").forEach(p => p.classList.remove("selected"));
  el.classList.add("selected");
  
  partPanel.querySelector(".panel-empty").hidden = true;
  const content = partPanel.querySelector(".panel-content");
  content.hidden = false;

  // هایلایت نمودار
  document.querySelectorAll(".bar-row").forEach(r => r.classList.remove("active-bar"));
  const targetBar = document.querySelector('.bar-row[data-part-id="' + part.id + '"]');
  if (targetBar) {
    targetBar.classList.add("active-bar");
  }

  $("#partName").textContent = part.name;
  $("#partDesc").textContent = part.desc;
  
  $("#partIssues").innerHTML = part.issues.map(function(i) {
    return "<li>" + i + "</li>";
  }).join("");

  const favBtn = $("#favBtn");
  const key = state.currentCar.id + ":" + part.id;
  const isFav = state.favorites.includes(key);
  
  favBtn.style.display = "block"; // 👈 دکمه علاقه‌مندی رو دوباره نمایان می‌کنیم
  favBtn.textContent = isFav ? "✅ در علاقه‌مندی‌ها" : "⭐ افزودن به علاقه‌مندی";
  favBtn.classList.toggle("active", isFav);
  favBtn.onclick = () => toggleFavorite(key, favBtn);

  // 👇 این بخش برای نمایش دکمه مشاهده قطعات داخلیه 👇
  const viewSubPartsBtn = document.getElementById("viewSubPartsBtn");
  if (part.subParts && part.subParts.length > 0) {
    viewSubPartsBtn.style.display = "block";
    viewSubPartsBtn.onclick = () => openSubParts(part);
  } else {
    viewSubPartsBtn.style.display = "none";
  }
}

function resetPanel() {
  partPanel.querySelector(".panel-empty").hidden = false;
  partPanel.querySelector(".panel-content").hidden = true;
}

// ===== علاقه‌مندی =====
function toggleFavorite(key, btn) {
  const idx = state.favorites.indexOf(key);
  if (idx > -1) state.favorites.splice(idx, 1);
  else state.favorites.push(key);
  
  localStorage.setItem("favs", JSON.stringify(state.favorites));
  const isFav = state.favorites.includes(key);
  
  btn.textContent = isFav ? "✅ در علاقه‌مندی‌ها" : "⭐ افزودن به علاقه‌مندی";
  btn.classList.toggle("active", isFav);

  if (isFav) showToast("به علاقه‌مندی‌ها اضافه شد ✅");
  else showToast("از علاقه‌مندی‌ها حذف شد ❌");
}

// ===== نمودار =====
function renderChart(car) {
  const chart = $("#chart");
  chart.innerHTML = "";
  car.parts.forEach(part => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.dataset.partId = part.id;
    
    row.innerHTML = 
      '<span class="bar-label">' + part.name + '</span>' +
      '<div class="bar-track"><div class="bar-fill" data-score="' + part.score + '"></div></div>' +
      '<span class="bar-value">' + part.score + '</span>';
      
    chart.appendChild(row);
  });
  setTimeout(() => {
    chart.querySelectorAll(".bar-fill").forEach(bar => {
      bar.style.width = (bar.dataset.score * 10) + "%";
    });
  }, 100);
}

// ===== جستجوی قطعات =====
function renderSearchFilter(car) {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.value = "";

  input.oninput = function() {
    const q = this.value.trim().toLowerCase();
    const parts = document.querySelectorAll(".part-piece");
    
    parts.forEach(el => {
      const partId = el.dataset.partId;
      const part = car.parts.find(p => p.id === partId);
      
      if (part) {
        const matchQ = !q || part.name.toLowerCase().includes(q);
        el.style.opacity = matchQ ? "1" : "0.2";
        el.style.pointerEvents = matchQ ? "auto" : "none";
      }
    });
  };
}

// ===== دکمه بازگشت از صفحه ماشین =====
$("#backBtn").addEventListener("click", () => {
  detailView.classList.remove("active");
  galleryView.classList.add("active");
  resetPanel();
  replayRevealAnimation();
});

// ===== ذرات انفجار =====
function spawnParticles() {
  const canvas = $("#particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const stage = $("#explodeStage");
  canvas.width = stage.clientWidth;
  canvas.height = stage.clientHeight;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  
  const colors = ["#f59e0b", "#4f46e5", "#10b981", "#fbbf24", "#ffffff"];
  const particles = Array.from({ length: 100 }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 12,
    vy: (Math.random() - 0.5) * 12,
    life: 1,
    size: Math.random() * 4 + 1,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.life <= 0) return;alive = true;
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95;
      p.life -= 0.02;
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    if (alive) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ===== مودال مقایسه =====
$("#compareBtn").addEventListener("click", () => {
  const modal = $("#compareModal");
  modal.hidden = false;
  const selA = $("#compareA"), selB = $("#compareB");
  
  const optionsHTML = CARS.map(function(c) {
    return '<option value="' + c.id + '">' + c.name + '</option>';
  }).join("");
  
  selA.innerHTML = optionsHTML;
  selB.innerHTML = optionsHTML;
  selB.selectedIndex = 1;
  renderCompare();
});

$("#closeCompare").addEventListener("click", () => $("#compareModal").hidden = true);

function renderCompare() {
  const a = CARS.find(c => c.id === $("#compareA").value);
  const b = CARS.find(c => c.id === $("#compareB").value);
  
  const col = function(car) {
    return '<div class="compare-col">' +
      '<h4>' + car.emoji + ' ' + car.name + '</h4>' +
      '<div class="score-big">' + car.reliability + '/10</div>' +
      '<div class="compare-parts-list">' +
        car.parts.map(function(p) {
          return '<button class="compare-part-btn" data-car="'+car.id+'" data-part="'+p.id+'">' +
            '<span>' + p.name + '</span>' +
            '<span>' + p.score + '/10</span>' +
          '</button>';
        }).join("") +
      '</div>' +
    '</div>';
  };
  
  const detailsBox = 
    '<div id="compareDetails" class="compare-details-box">' +
      '<div class="cd-header" id="cdTitle"></div>' +
      '<div class="cd-grid">' +
        '<div class="cd-item" id="cdCarA"></div>' +
        '<div class="cd-item" id="cdCarB"></div>' +
      '</div>' +
    '</div>';

  $("#compareResult").innerHTML = col(a) + col(b) + detailsBox;

  document.querySelectorAll(".compare-part-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      document.querySelectorAll(".compare-part-btn").forEach(b => {
        if (b.dataset.part === this.dataset.part) b.classList.add("active");
        else b.classList.remove("active");
      });
      showCompareDetails(this.dataset.part, a, b);
    });
  });
}

function showCompareDetails(partId, carA, carB) {
  const partA = carA.parts.find(p => p.id === partId);
  const partB = carB.parts.find(p => p.id === partId);
  if (!partA || !partB) return;

  $("#compareDetails").classList.add("active");
  $("#cdTitle").textContent = "مقایسه قطعه: " + partA.name;

  $("#cdCarA").innerHTML = 
    '<h4 style="color:var(--primary)">' + carA.name + '</h4>' +
    '<p>' + partA.desc + '</p>' +
    '<h5>ایرادات:</h5>' +
    '<ul>' + partA.issues.map(i => '<li>' + i + '</li>').join("") + '</ul>';

  $("#cdCarB").innerHTML = 
    '<h4 style="color:var(--accent)">' + carB.name + '</h4>' +
    '<p>' + partB.desc + '</p>' +
    '<h5>ایرادات:</h5>' +
    '<ul>' + partB.issues.map(i => '<li>' + i + '</li>').join("") + '</ul>';
}

$("#compareA").addEventListener("change", renderCompare);
$("#compareB").addEventListener("change", renderCompare);

// ===== نمایش علاقه‌مندی‌ها =====
const favViewBtn = document.getElementById("favViewBtn");
const backFromFavBtn = document.getElementById("backFromFavBtn");
const favoritesList = document.getElementById("favoritesList");

if (favViewBtn) {
  favViewBtn.addEventListener("click", () => {
    galleryView.classList.remove("active");
    detailView.classList.remove("active");
    if(troubleshootView) troubleshootView.classList.remove("active");
    favoritesView.classList.add("active");
    window.scrollTo(0, 0);

    favoritesList.innerHTML = "";
    const favs = JSON.parse(localStorage.getItem("favs") || "[]");
    
    if (favs.length === 0) {
      favoritesList.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">هنوز هیچ قطعه‌ای را ذخیره نکرده‌اید!</p>';
      return;
    }favs.forEach(key => {
      const [carId, partId] = key.split(":");
      const car = CARS.find(c => c.id === carId);
      if (!car) return;
      const part = car.parts.find(p => p.id === partId);
      if (!part) return;

      const card = document.createElement("div");
      card.className = "car-card";
      card.style.cursor = "pointer";
      card.innerHTML = 
        '<span class="car-emoji">' + (part.icon || '⚙️') + '</span>' +
        '<div class="car-name">' + part.name + '</div>' +
        '<div class="car-score" style="color: var(--primary);">' + car.name + '</div>' +
        '<div class="car-score">نمره قطعه: ' + part.score + '/10</div>';
      
      card.addEventListener("click", () => {
        favoritesView.classList.remove("active");
        openCar(carId);
      });
      favoritesList.appendChild(card);
    });
  });
}

if (backFromFavBtn) {
  backFromFavBtn.addEventListener("click", () => {
    favoritesView.classList.remove("active");
    galleryView.classList.add("active");
    replayRevealAnimation();
  });
}

// ===== دکمه بازگشت به صفحه اصلی (Home) =====
const homeBtn = document.getElementById("homeBtn");
if (homeBtn) {
  homeBtn.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    galleryView.classList.add("active");
    $("#compareModal").hidden = true;
    
    const gameSection = document.getElementById("gameSection");
    if (gameSection) {
      gameSection.style.display = "none";
    }
    resetPanel();
    window.scrollTo(0, 0);
    replayRevealAnimation();
  });
}

// ===== مینی گیم عیب‌یابی =====
let gameActive = false;
let currentTargetPart = null;

const SCENARIOS = [
  { issue: "صدای تق تق شدید و فلزی از داخل موتور میاد و سطح روغن کم شده.", target: "engine", hint: "به قطعه اصلی تولید قدرت نگاه کن." },
  { issue: "پدال ترمز تا ته فرو میره و ماشین به سختی متوقف میشه.", target: "brake", hint: "نشتی در سیستم هیدرولیک این قطعه رخ داده است." },
  { issue: "ماشین صبح‌ها استارت نمی‌خوره اما با باتری‌به‌باتری روشن میشه.", target: "battery", hint: "قطعه‌ای که وظیفه ذخیره انرژی اولیه رو داره." },
  { issue: "هنگام دور زدن، صدای تق تق از سمت چرخ‌های جلو میاد.", target: "driveshaft", hint: "انتقال قدرت به چرخ‌ها مختل شده است." },
  { issue: "دور موتور بالا میره اما ماشین شتاب نمی‌گیره و بوی سوختگی میده.", target: "clutch", hint: "قطعه‌ای که نیرو رو از موتور به گیربکس منتقل می‌کنه." },
  { issue: "چراغ‌های ماشین کم‌نور شدن و صدای سوت (جیر جیر) از کاپوت میاد.", target: "electrical", hint: "دینام و تسمه آن را بررسی کن." },
  { issue: "دمای آب به شدت بالا رفته اما فن خنک‌کننده روشن نمیشه.", target: "radiator", hint: "سیستم خنک‌کننده موتور مشکل داره." },
  { issue: "ماشین در سرعت بالا (بالای ۸۰) دچار لرزش شدید میشه.", target: "suspension", hint: "تعادل و پایداری خودرو به هم خورده است." },
  { issue: "فرمان ماشین در سرعت پایین خیلی سنگین شده و روغن کم میکنه.", target: "steering", hint: "سیستم هیدرولیک یا برقی چرخش چرخ‌ها مشکل داره." },
  { issue: "چراغ چک روشنه و ماشین موقع گاز دادن دود سیاه میکنه.", target: "ecu", hint: "کامپیوتر خودرو و سنسورهای آن را بررسی کن." },
  { issue: "ماشین در ترافیک ناگهان خاموش میشه و بعد از چند دقیقه دوباره روشن میشه.", target: "fuel_system", hint: "رسیدن سوخت به موتور مختل شده است." },
  { issue: "باد کولر سرد نیست و صدای غیرعادی از زیر داشبورد میاد.", target: "ac_system", hint: "سیستم سرمایش کابین را بررسی کن." },
  { issue: "صدای غرش بسیار بلند از زیر ماشین میاد و دود از عقب زیاد شده.", target: "exhaust", hint: "مسیر خروج گازهای سوخته مشکل داره." },
  { issue: "دنده ۲ به سختی جا میره و هنگام تعویض دنده صدای خِرخِر میاد.", target: "gearbox", hint: "چرخ‌دنده‌ها و سینکروها را بررسی کن." },
  { issue: "آب زیر پای سرنشینان جمع میشه و کف ماشین نمناکه.", target: "chassis", hint: "نشتی از لوله کولر یا بدنه رخ داده است." }
];const gameBtn = document.getElementById("gameBtn");
if (gameBtn) {
  gameBtn.addEventListener("click", () => {
    const gameSection = document.getElementById("gameSection");
    const isHidden = gameSection.style.display === "none" || gameSection.style.display === "";
    
    if (isHidden) {
      gameSection.style.display = "block";
      if (!state.currentCar) openCar(CARS[0].id);
      startNewGame();
    } else {
      gameSection.style.display = "none";
      gameActive = false;
      document.querySelectorAll(".part-piece").forEach(p => {
        p.classList.remove("correct-glow", "shake", "selected", "hint-glow");
      });
    }
  });
}

function startNewGame() {
  gameActive = true;
  const feedback = document.getElementById("gameFeedback");
  if (!feedback) return;
  
  feedback.textContent = "";
  feedback.className = "feedback";
  
  const availablePartIds = state.currentCar.parts.map(p => p.id);
  const validScenarios = SCENARIOS.filter(s => availablePartIds.includes(s.target));
  
  const pool = validScenarios.length > 0 ? validScenarios : SCENARIOS;
  const randomScenario = pool[Math.floor(Math.random() * pool.length)];
  
  currentTargetPart = randomScenario.target;
  
  document.getElementById("gameQuestion").textContent = "🤔 سناریو: " + randomScenario.issue;
  feedback.textContent = "روی قطعه‌ی خراب روی ماشین کلیک کن!";
  
  document.querySelectorAll(".part-piece").forEach(p => {
    p.classList.remove("selected", "correct-glow", "shake", "hint-glow");
  });
}

function checkGameAnswer(part, el) {
  const feedback = document.getElementById("gameFeedback");
  
  if (part.id === currentTargetPart) {
    feedback.textContent = "✅ آفرین! کاملاً درسته. شما یک مکانیک حرفه‌ای هستید!";
    feedback.className = "feedback success";
    el.classList.add("correct-glow");
    gameActive = false;
    
    setTimeout(() => {
      el.classList.remove("correct-glow");
      startNewGame(); 
    }, 2500);
  } else {
    feedback.textContent = "❌ اشتباهه! دوباره تلاش کن. راهنمایی: " + SCENARIOS.find(s => s.target === currentTargetPart).hint;
    feedback.className = "feedback error";
    el.classList.add("shake");
    setTimeout(() => el.classList.remove("shake"), 300);

    document.querySelectorAll(".part-piece").forEach(p => {
      if (p.dataset.partId === currentTargetPart) {
        p.classList.add("hint-glow");
        setTimeout(() => p.classList.remove("hint-glow"), 2000);
      }
    });
  }
}

// ===== سیستم عیب‌یابی =====
const troubleshootBtn = document.getElementById("troubleshootBtn");
const backFromTroubleshootBtn = document.getElementById("backFromTroubleshootBtn");
const troubleshootSearchInput = document.getElementById("troubleshootSearchInput");
const troubleshootResults = document.getElementById("troubleshootResults");
const noTroubleshootResults = document.getElementById("noTroubleshootResults");

if (troubleshootBtn) {
  troubleshootBtn.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    if (troubleshootView) troubleshootView.classList.add("active");
    window.scrollTo(0, 0);
    if (troubleshootSearchInput) troubleshootSearchInput.value = "";
    renderTroubleshoot(""); 
  });
}

if (backFromTroubleshootBtn) {
  backFromTroubleshootBtn.addEventListener("click", () => {
    if (troubleshootView) troubleshootView.classList.remove("active");
    if (galleryView) galleryView.classList.add("active");
    replayRevealAnimation();
  });
}

function renderTroubleshoot(query) {
  if (!troubleshootResults || typeof TROUBLESHOOTING_DB === 'undefined') return;
  
  troubleshootResults.innerHTML = "";
  const q = query.trim().toLowerCase();
  let found = false;

  TROUBLESHOOTING_DB.forEach((item) => {
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchKeywords = item.keywords.some(k => k.toLowerCase().includes(q));if (matchTitle||matchKeywords||q === "") {
      found = true;
      const card = document.createElement("div");
      card.className = "ts-card";
      
      card.innerHTML = 
        '<div class="ts-header">' + item.title + '</div>' +
        '<div class="ts-body">' +
          '<div class="ts-section ts-cause">' +
            '<h4>⚠️ علت مشکل:</h4>' +
            '<p>' + item.cause + '</p>' +
          '</div>' +
          '<div class="ts-section ts-solution">' +
            '<h4>🛠️ راه‌حل:</h4>' +
            '<p>' + item.solution + '</p>' +
          '</div>' +
        '</div>';

      const header = card.querySelector(".ts-header");
      if(header) {
        header.addEventListener("click", () => {
          card.classList.toggle("open");
        });
      }
      troubleshootResults.appendChild(card);
    }
  });

  if (noTroubleshootResults) {
    noTroubleshootResults.style.display = found ? "none" : "block";
  }
}

if (troubleshootSearchInput) {
  troubleshootSearchInput.addEventListener("input", (e) => {
    renderTroubleshoot(e.target.value);
  });
}

// ===== مدیریت مودال‌ها (درباره پروژه، Esc و کلیک بیرون) =====
const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
const closeAbout = document.getElementById("closeAbout");

if (aboutBtn && aboutModal) {
  aboutBtn.addEventListener("click", () => {
    aboutModal.hidden = false;
  });

}

// بستن مودال درباره پروژه
if (closeAbout && aboutModal) {
  closeAbout.addEventListener("click", () => {
    aboutModal.hidden = true;
  });
}

// بستن مودال‌ها با کلید Esc
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (aboutModal) aboutModal.hidden = true;
    const compareModal = document.getElementById("compareModal");
    if (compareModal) compareModal.hidden = true;
  }
});

// بستن مودال‌ها با کلیک بیرون از کادر سفید
window.addEventListener("click", (e) => {
  // اگر روی خود پس‌زمینه تیره مودال (کلاس modal) کلیک شد
  if (e.target.classList.contains("modal")) {
    e.target.hidden = true;
  }
});

// ===== دانلود کارت مقایسه =====
const downloadCompareBtn = document.getElementById("downloadCompareBtn");
if (downloadCompareBtn) {
  downloadCompareBtn.addEventListener("click", () => {
    const captureArea = document.getElementById("compareResult");
    const originalText = downloadCompareBtn.textContent;
    downloadCompareBtn.textContent = "در حال آماده‌سازی... ⏳";

    html2canvas(captureArea, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg'),
      scale: 2
    }).then(canvas => {
      const link = document.createElement("a");
      link.download = "AutoLab-Compare.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      downloadCompareBtn.textContent = "✅ دانلود شد!";
      setTimeout(() => { downloadCompareBtn.textContent = originalText; }, 3000);
    }).catch(err => {
      console.error("خطا در عکس گرفتن:", err);
      downloadCompareBtn.textContent = "❌ خطا در دانلود";
      setTimeout(() => { downloadCompareBtn.textContent = originalText; }, 3000);
    });
  });
}

// ===== سیستم قطعات تو در تو (Drill-down) =====
function openSubParts(mainPart) {
  isViewingSubParts = true;
  currentMainPart = mainPart;
  
  document.getElementById("backToCarBtn").style.display = "block";
  document.getElementById("viewSubPartsBtn").style.display = "none";
  
  carContainer.innerHTML = "";
  
  mainPart.subParts.forEach((subPart, index) => {
    const el = document.createElement("div");
    el.className = "part-piece cursor-wrench";
    el.textContent = subPart.icon;
    el.style.display = "flex"; el.style.alignItems = "center"; el.style.justifyContent = "center"; el.style.fontSize = "1.5rem";
    el.style.background = "var(--surface)"; el.style.border = "2px solid var(--accent)"; 
    
    const angle = (index / mainPart.subParts.length) * (2 * Math.PI);
    const dist = 120;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    
    el.style.left = "50%"; el.style.top = "50%";
    el.style.setProperty("--tx", tx + "px");
    el.style.setProperty("--ty", ty + "px");
    
    el.dataset.partId = subPart.id;
    el.title = subPart.name;
    
    // 👇 این بخش اصلاح شد 👇
    el.addEventListener("click", () => {
      document.querySelectorAll(".part-piece").forEach(p => p.classList.remove("selected"));
      el.classList.add("selected");
      
      // نمایش پنل توضیحات (بخش فراموش شده!)
      partPanel.querySelector(".panel-empty").hidden = true;
      partPanel.querySelector(".panel-content").hidden = false;
      
      partPanel.querySelector(".panel-empty").hidden = true;
partPanel.querySelector(".panel-content").hidden = false;
      $("#partName").textContent = subPart.name;
      $("#partDesc").textContent = subPart.desc;
      $("#partIssues").innerHTML = subPart.issues.map(i => "<li>" + i + "</li>").join("");
      
      // مخفی کردن دکمه علاقه‌مندی برای قطعات ریز
      $("#favBtn").style.display = "none"; 
    });
    
    carContainer.appendChild(el);
  });
  
  setTimeout(() => {
    document.querySelectorAll(".part-piece").forEach(el => el.classList.add("exploded"));
    spawnParticles();
  }, 100);
  
  resetPanel();
}

// ===== دکمه بازگشت از قطعات داخلی به کل ماشین =====
const backToCarBtn = document.getElementById("backToCarBtn");
if (backToCarBtn) {
  backToCarBtn.addEventListener("click", () => {
    isViewingSubParts = false;
    currentMainPart = null;
    backToCarBtn.style.display = "none";
    
    // بازسازی مجدد کل ماشین
    if (state.currentCar) {
      openCar(state.currentCar.id); 
    }
  });
}

// ===== شروع =====
renderGallery();