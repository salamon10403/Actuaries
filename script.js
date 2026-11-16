const API_BASE = "http://localhost:3000";

const subjectsByInstitute = {
  iai: [
    { code: "CA1", name: "CA1 - Actuarial Core Applications" },
    { code: "CS1", name: "CS1 - Actuarial Statistics" },
    { code: "CS2", name: "CS2 - Risk Modelling & Survival Analysis" },
    { code: "CS3", name: "CS3 - Data Science: Tools & Techniques" },
    { code: "CM1", name: "CM1 - Actuarial Mathematics" },
    { code: "CM2", name: "CM2 - Economic Modelling" },
    { code: "CB1", name: "CB1 - Business Finance" },
    { code: "CB2", name: "CB2 - Business Economics" },
    { code: "CB3", name: "CB3 - Business Management" },
    { code: "CP1", name: "CP1 - Actuarial Practice" },
    { code: "CP2", name: "CP2 - Modelling Practice" },
    { code: "CP3", name: "CP3 - Communications Practice" },
    { code: "SP1", name: "SP1 - Health and Care" },
    { code: "SP2", name: "SP2 - Life Insurance" },
    { code: "SP4", name: "SP4 - Pensions and Other Benefits" },
    { code: "SP5", name: "SP5 - Investment and Finance" },
    { code: "SP6", name: "SP6 - Financial Derivatives" },
    { code: "SP7", name: "SP7 - General Insurance Reserving" },
    { code: "SP8", name: "SP8 - General Insurance Pricing" },
    { code: "SP9", name: "SP9 - Enterprise Risk Management" },
    { code: "SA1", name: "SA1 - Health and Care (Advanced)" },
    { code: "SA2", name: "SA2 - Life Insurance (Advanced)" },
    { code: "SA3", name: "SA3 - General Insurance (Advanced)" },
    { code: "SA4", name: "SA4 - Pensions (Advanced)" },
    { code: "SA7", name: "SA7 - Investment and Finance (Advanced)" }
  ],
  ifoa: [
    { code: "CS1", name: "CS1 - Actuarial Statistics" },
    { code: "CS2", name: "CS2 - Risk Modelling & Survival Analysis" },
    { code: "CM1", name: "CM1 - Actuarial Mathematics" },
    { code: "CM2", name: "CM2 - Economic Modelling" },
    { code: "CB1", name: "CB1 - Business Finance" },
    { code: "CB2", name: "CB2 - Business Economics" },
    { code: "CB3", name: "CB3 - Business Management" },
    { code: "CP1", name: "CP1 - Actuarial Practice" },
    { code: "CP2", name: "CP2 - Modelling Practice" },
    { code: "CP3", name: "CP3 - Communications Practice" },
    { code: "SP0", name: "SP0 - Research Route" },
    { code: "SP1", name: "SP1 - Health and Care" },
    { code: "SP2", name: "SP2 - Life Insurance" },
    { code: "SP4", name: "SP4 - Pensions and Other Benefits" },
    { code: "SP5", name: "SP5 - Investment and Finance" },
    { code: "SP6", name: "SP6 - Financial Derivatives" },
    { code: "SP7", name: "SP7 - General Insurance Reserving" },
    { code: "SP8", name: "SP8 - General Insurance Pricing" },
    { code: "SP9", name: "SP9 - Enterprise Risk Management" },
    { code: "SP10", name: "SP10 - Banking" },
    { code: "SA0", name: "SA0 - Research Dissertation" },
    { code: "SA1", name: "SA1 - Health and Care (Advanced)" },
    { code: "SA2", name: "SA2 - Life Insurance (Advanced)" },
    { code: "SA3", name: "SA3 - General Insurance (Advanced)" },
    { code: "SA4", name: "SA4 - Pensions (Advanced)" },
    { code: "SA7", name: "SA7 - Investment and Finance (Advanced)" },
    { code: "SA10", name: "SA10 - Banking (Advanced)" }
  ],
  soa: [
    { code: "P", name: "Exam P - Probability" },
    { code: "FM", name: "Exam FM - Financial Mathematics" },
    { code: "FAM", name: "Exam FAM - Fundamentals of Actuarial Mathematics" },
    { code: "ALTAM", name: "Exam ALTAM - Advanced Long-Term Actuarial Mathematics" },
    { code: "ASTAM", name: "Exam ASTAM - Advanced Short-Term Actuarial Mathematics" },
    { code: "SRM", name: "Exam SRM - Statistics for Risk Modeling" },
    { code: "PA", name: "Exam PA - Predictive Analytics" },
    { code: "ATPA", name: "ATPA - Advanced Topics in Predictive Analytics" }
  ]
};

const forgotLinks = {
  iai: "https://actuariesindia.org/member-login",
  ifoa: "https://www.actuaries.org.uk/my-account/lost-password/",
  soa: "https://www.soa.org/my-soa/"
};

const examDiets = ["April", "September"];

let authState = {
  sessionToken: null,
  authenticated: false,
  skipped: true,
  institute: null,
  memberId: null
};

const attachedFilesMap = new Map();
const activePaneBlobs = { question: null, answer: null };

function setPaneBlob(type, blob) {
  if (activePaneBlobs[type]) {
    URL.revokeObjectURL(activePaneBlobs[type]);
  }
  activePaneBlobs[type] = URL.createObjectURL(blob);
  return activePaneBlobs[type];
}

const instituteSelect      = document.getElementById("institute-select");
const subjectSelect        = document.getElementById("subject-select");
const selectorCardPopover  = document.getElementById("selector-card-popover");
const selectorToggleBtn    = document.getElementById("selector-toggle-btn");
const selectorCloseBtn     = document.getElementById("selector-close-btn");

const themeCard            = document.getElementById("theme-card");
const themeToggleBtn       = document.getElementById("theme-toggle-btn");
const themeCloseBtn        = document.getElementById("theme-close-btn");
const themeButtons         = document.querySelectorAll(".theme-btn");

const loginCard            = document.getElementById("login-card");
const verifiedCard         = document.getElementById("verified-card");
const optionsToggleBtn     = document.getElementById("options-toggle-btn");
const optionsCloseBtn      = document.getElementById("options-close-btn");
const switchAccountBtn     = document.getElementById("switch-account-btn");
const localUploadWrap      = document.getElementById("local-upload-wrap");
const localPdfInput        = document.getElementById("local-pdf-input");
const attachedCount        = document.getElementById("attached-count");
const portalBadge          = document.getElementById("portal-badge");
const loginForm            = document.getElementById("member-login-form");
const captchaSection       = document.getElementById("captcha-section");
const captchaImg           = document.getElementById("captcha-img");
const captchaStatus        = document.getElementById("captcha-status");
const captchaAnswer        = document.getElementById("captcha-answer");
const refreshCaptcha       = document.getElementById("refresh-captcha-btn");
const signInBtn            = document.getElementById("sign-in-btn");
const loginMsg             = document.getElementById("login-msg");
const forgotLink           = document.getElementById("forgot-link");
const papersSection        = document.getElementById("papers-section");
const welcomeSection       = document.getElementById("welcome-section");
const papersContainer      = document.getElementById("papers-container");
const activeSubjectBadge   = document.getElementById("active-subject-badge");
const examExpertBtn        = document.getElementById("exam-expert-btn");
const navAuthBadge         = document.getElementById("nav-auth-badge");
const navMemberLabel       = document.getElementById("nav-member-label");

const feedbackToggleBtn    = document.getElementById("feedback-toggle-btn");
const feedbackCard         = document.getElementById("feedback-card");
const feedbackCloseBtn     = document.getElementById("feedback-close-btn");
const feedbackMsgForm      = document.getElementById("feedback-msg-form");
const feedbackStatus       = document.getElementById("feedback-status");

themeToggleBtn.addEventListener("click", () => {
  selectorCardPopover.style.display = "none";
  verifiedCard.style.display = "none";
  feedbackCard.style.display = "none";
  themeCard.style.display = themeCard.style.display === "none" ? "block" : "none";
});

themeCloseBtn.addEventListener("click", () => {
  themeCard.style.display = "none";
});

themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const themeName = btn.dataset.theme;
    document.body.className = `theme-${themeName}`;
    themeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    localStorage.setItem("actuary_theme", themeName);
    themeCard.style.display = "none";
  });
});

const savedTheme = localStorage.getItem("actuary_theme") || "black";
document.body.className = `theme-${savedTheme}`;
themeButtons.forEach(b => {
  if (b.dataset.theme === savedTheme) b.classList.add("active");
  else b.classList.remove("active");
});

selectorToggleBtn.addEventListener("click", () => {
  themeCard.style.display = "none";
  verifiedCard.style.display = "none";
  feedbackCard.style.display = "none";
  selectorCardPopover.style.display = selectorCardPopover.style.display === "none" ? "block" : "none";
});

selectorCloseBtn.addEventListener("click", () => {
  selectorCardPopover.style.display = "none";
});

instituteSelect.addEventListener("change", async () => {
  const inst = instituteSelect.value;
  await resetAuthSession();

  authState.institute = inst;
  authState.skipped = true;
  authState.authenticated = false;

  loginCard.style.display = "none";
  localUploadWrap.style.display = "flex";
  switchAccountBtn.textContent = "Verify Login";
  optionsToggleBtn.classList.add("has-active-mode");
  selectorToggleBtn.classList.add("has-active-mode");
  forgotLink.href = forgotLinks[inst] || "#";

  document.getElementById("verified-title").textContent = "Local Folder Mode";
  document.getElementById("verified-sub").textContent = `Loading & saving files directly in pdfs/${inst.toUpperCase()}/`;

  populateSubjects(inst);
  subjectSelect.focus();
});

optionsToggleBtn.addEventListener("click", () => {
  themeCard.style.display = "none";
  selectorCardPopover.style.display = "none";
  feedbackCard.style.display = "none";
  verifiedCard.style.display = verifiedCard.style.display === "none" ? "block" : "none";
});

optionsCloseBtn.addEventListener("click", () => {
  verifiedCard.style.display = "none";
});

switchAccountBtn.addEventListener("click", async () => {
  const currentInst = authState.institute || instituteSelect.value || "iai";
  authState.institute = currentInst;

  if (loginCard.style.display === "none") {
    loginCard.style.display = "block";
    switchAccountBtn.textContent = "Hide Login";
    forgotLink.href = forgotLinks[currentInst] || "#";
    await initPortalSession(currentInst);
  } else {
    loginCard.style.display = "none";
    switchAccountBtn.textContent = "Verify Login";
  }
});

async function handleLocalFilesSelected(fileList) {
  const validExts = [".pdf", ".xlsx", ".xls", ".csv"];
  const files = Array.from(fileList || []).filter(f => validExts.some(ext => f.name.toLowerCase().endsWith(ext)));
  if (files.length === 0) return;

  const instUpper = (authState.institute || instituteSelect.value || "IAI").toUpperCase();
  attachedCount.textContent = `Saving ${files.length} file(s) to pdfs/${instUpper}/...`;

  let savedToDisk = 0;

  for (const file of files) {
    const key = file.name.toLowerCase();
    if (attachedFilesMap.has(key)) {
      URL.revokeObjectURL(attachedFilesMap.get(key));
    }
    attachedFilesMap.set(key, URL.createObjectURL(file));

    try {
      const params = new URLSearchParams({
        institute: instUpper,
        filename: file.name
      });
      const resp = await fetch(`${API_BASE}/api/upload-local-pdfs?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });
      if (resp.ok) savedToDisk++;
    } catch (_) {}
  }

  if (savedToDisk > 0) {
    attachedCount.textContent = `${savedToDisk} file(s) saved permanently to pdfs/${instUpper}/`;
  } else {
    attachedCount.textContent = `${attachedFilesMap.size} file(s) attached in memory`;
  }

  if (authState.skipped && authState.institute && subjectSelect.value) {
    await renderAvailableYears(instUpper, subjectSelect.value);
  }
}

localPdfInput.addEventListener("change", async (e) => {
  await handleLocalFilesSelected(e.target.files);
});

verifiedCard.addEventListener("dragover", (e) => {
  e.preventDefault();
  verifiedCard.classList.add("drag-active");
});

verifiedCard.addEventListener("dragleave", () => {
  verifiedCard.classList.remove("drag-active");
});

verifiedCard.addEventListener("drop", async (e) => {
  e.preventDefault();
  verifiedCard.classList.remove("drag-active");
  if (e.dataTransfer && e.dataTransfer.files) {
    await handleLocalFilesSelected(e.dataTransfer.files);
  }
});

async function initPortalSession(inst) {
  loginMsg.textContent = "";
  captchaAnswer.value = "";
  captchaImg.style.display = "none";
  captchaStatus.style.display = "inline";
  captchaStatus.textContent = "Connecting...";
  signInBtn.disabled = true;

  try {
    const resp = await fetch(`${API_BASE}/api/auth/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institute: inst })
    });
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.error || "Could not connect to portal.");

    authState.sessionToken = data.sessionToken;
    portalBadge.textContent = `${data.portalName} Portal`;

    if (data.hasCaptcha && data.captchaImage) {
      captchaSection.style.display = "flex";
      captchaImg.src = data.captchaImage;
      captchaImg.style.display = "block";
      captchaStatus.style.display = "none";
      captchaAnswer.required = true;
    } else {
      captchaSection.style.display = "none";
      captchaAnswer.required = false;
    }

    signInBtn.disabled = false;
  } catch (err) {
    captchaStatus.textContent = "Offline";
    loginMsg.textContent = `${err.message} (Local files mode remains active)`;
  }
}

refreshCaptcha.addEventListener("click", () => {
  if (authState.institute) initPortalSession(authState.institute);
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!authState.sessionToken) return;

  const memberId = document.getElementById("member-id").value.trim();
  const password = document.getElementById("member-pass").value;
  const captcha  = captchaAnswer.value.trim();

  signInBtn.disabled = true;
  signInBtn.textContent = "VERIFYING WITH PORTAL...";
  loginMsg.textContent = "";

  try {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: authState.sessionToken,
        memberId,
        password,
        captcha
      })
    });
    const data = await resp.json();

    if (!resp.ok || !data.authenticated) {
      loginMsg.textContent = data.error || "Official portal rejected login.";
      signInBtn.textContent = "SIGN IN";
      await initPortalSession(authState.institute);
      return;
    }

    authState.authenticated = true;
    authState.skipped = false;
    authState.memberId = data.memberId;

    loginCard.style.display = "none";
    switchAccountBtn.textContent = "Switch Account";
    verifiedCard.style.display = "none";
    optionsToggleBtn.classList.add("has-active-mode");

    document.getElementById("verified-title").textContent = `Verified: ${data.portalName} (${data.memberId})`;
    document.getElementById("verified-sub").textContent = "Streaming live papers directly from the official portal.";

    navAuthBadge.style.display = "flex";
    navMemberLabel.textContent = `${data.portalName} • ID: ${data.memberId}`;

    if (instituteSelect.value !== authState.institute) {
      instituteSelect.value = authState.institute;
      populateSubjects(authState.institute);
    }
    if (subjectSelect.value) {
      await renderAvailableYears(authState.institute.toUpperCase(), subjectSelect.value);
    }
  } catch (err) {
    loginMsg.textContent = `Verification failed: ${err.message}`;
    signInBtn.disabled = false;
  } finally {
    signInBtn.textContent = "SIGN IN";
  }
});

function populateSubjects(inst) {
  const subjects = subjectsByInstitute[inst] || [];
  subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject</option>';
  subjects.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub.code;
    opt.textContent = sub.name;
    subjectSelect.appendChild(opt);
  });
  subjectSelect.disabled = false;
}

subjectSelect.addEventListener("change", async () => {
  const subject = subjectSelect.value;
  if (!subject || !authState.institute) return;

  selectorCardPopover.style.display = "none";
  await renderAvailableYears(authState.institute.toUpperCase(), subject);
});

async function renderAvailableYears(institute, subject) {
  papersContainer.innerHTML = "";
  activeSubjectBadge.textContent = `${institute} • ${subject}`;
  examExpertBtn.style.display = "inline-flex";

  welcomeSection.style.display = "none";
  papersSection.style.display = "flex";

  let availableYears = [];

  if (authState.skipped) {
    const yearSet = new Set();
    try {
      const resp = await fetch(`${API_BASE}/api/local-paper-list?institute=${institute}&subject=${subject}`);
      const data = await resp.json();
      (data.years || []).forEach(y => yearSet.add(Number(y)));
    } catch (_) {}

    const subLower = subject.toLowerCase();
    for (const fileName of attachedFilesMap.keys()) {
      if (fileName.includes(subLower)) {
        const match = fileName.match(/(20\d{2}|19\d{2})/);
        if (match) yearSet.add(Number(match[1]));
      }
    }
    availableYears = Array.from(yearSet).sort((a, b) => b - a);
  } else {
    const currYear = new Date().getFullYear();
    for (let y = currYear; y >= currYear - 12; y--) availableYears.push(y);
  }

  if (availableYears.length === 0) {
    papersContainer.innerHTML = `<div class="pane-status welcome-banner">No downloaded files found for <strong>${subject}</strong> in <code>pdfs/${institute}/</code>. Click the <strong>Local PDFs</strong> button at the bottom-right to attach files.</div>`;
    return;
  }

  availableYears.forEach(year => {
    const yearGroup = document.createElement("div");
    yearGroup.className = "year-group";

    const heading = document.createElement("div");
    heading.className = "year-heading";
    heading.textContent = `${year} Examination Series`;
    yearGroup.appendChild(heading);

    const row = document.createElement("div");
    row.className = "session-row";

    examDiets.forEach(month => {
      const box = document.createElement("button");
      box.type = "button";
      box.className = "month-box";
      box.innerHTML = `<span>${month}</span>`;
      box.addEventListener("click", () => openSplitViewer(institute, subject, year, month));
      row.appendChild(box);
    });

    yearGroup.appendChild(row);
    papersContainer.appendChild(yearGroup);
  });
}

const splitModal = document.getElementById("split-modal");

async function openSplitViewer(institute, subject, year, month) {
  document.getElementById("split-badge").textContent = `${institute} • ${subject}`;
  document.getElementById("split-session-title").textContent = `${year} Examination Series — ${month}`;
  splitModal.style.display = "flex";

  await Promise.all([
    loadPdfPane("question", institute, subject, year, month),
    loadPdfPane("answer", institute, subject, year, month)
  ]);
}

function findAttachedPdf(subject, year, month, type) {
  const sub = subject.toLowerCase();
  const yr = String(year);
  const yrShort = yr.slice(-2);
  const monPrefix = month.toLowerCase().slice(0, 3);
  const isAnswer = type === "answer";

  const entries = Array.from(attachedFilesMap.entries()).map(([name, url]) => ({
    name: name.toLowerCase(),
    url
  }));

  const subAndYear = entries.filter(e =>
    e.name.includes(sub) && (e.name.includes(yr) || e.name.includes(yrShort))
  );
  if (subAndYear.length === 0) return null;

  const isSolName = (n) => /sol|ans|examiner|report|marking|key|er\b|_s\.|_s_|_a\.|_a_|-s\.|-a\.|templ|_s$|_ans/i.test(n);
  const byType = subAndYear.filter(e => isAnswer ? isSolName(e.name) : !isSolName(e.name));
  const typePool = byType.length > 0 ? byType : subAndYear;

  const byMonth = typePool.filter(e => {
    const isFirstDiet = /apr|may|jun|spring|[_-]?0[3456][_-]?|s1/i.test(e.name);
    const isSecondDiet = /sep|oct|nov|dec|autumn|fall|[_-]?(09|10|11|12)[_-]?|s2/i.test(e.name);
    return monPrefix === "apr" ? isFirstDiet : isSecondDiet;
  });

  if (byMonth.length > 0) return byMonth[0].url;
  return typePool[0] ? typePool[0].url : null;
}

async function loadPdfPane(type, institute, subject, year, month) {
  const bodyEl = document.getElementById(`body-${type}`);
  const dlTopBtn = document.getElementById(`dl-${type}`);
  dlTopBtn.style.display = "none";

  const instUpper = institute.toUpperCase();
  const subUpper  = subject.toUpperCase();
  const monLower  = month.toLowerCase();

  if (authState.skipped) {
    const attachedUrl = findAttachedPdf(subUpper, year, monLower, type);
    if (attachedUrl) {
      const isSpreadsheet = /\.(xlsx|xls|csv)$/i.test(attachedUrl);
      if (isSpreadsheet) {
        bodyEl.innerHTML = `<div class="pane-status"><strong>Spreadsheet Attached</strong><br><br>Excel and CSV files can be downloaded directly for modeling.<br><br><a href="${attachedUrl}" download class="attach-btn" style="margin-top:12px; display:inline-block;">Download File</a></div>`;
      } else {
        bodyEl.innerHTML = `<iframe src="${attachedUrl}#toolbar=1&view=FitH" title="${type} file"></iframe>`;
      }
      dlTopBtn.href = attachedUrl;
      dlTopBtn.download = `${subUpper}_${year}_${monLower}_${type}`;
      dlTopBtn.style.display = "inline-block";
      return;
    }

    const params = new URLSearchParams({
      institute: instUpper,
      subject: subUpper,
      year,
      month: monLower,
      type
    });
    const localApiUrl = `${API_BASE}/api/local-paper?${params.toString()}`;
    bodyEl.innerHTML = `<div class="pane-status">Searching <code>pdfs/${instUpper}/</code> for ${subUpper} ${month} ${year}...</div>`;

    try {
      const resp = await fetch(localApiUrl);
      if (!resp.ok) throw new Error("File not found.");

      const contentType = resp.headers.get("content-type") || "";
      const blob = await resp.blob();
      const blobUrl = setPaneBlob(type, blob);

      if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("csv")) {
        bodyEl.innerHTML = `<div class="pane-status"><strong>Spreadsheet Loaded</strong><br><br>Click below to download and open in Excel / LibreOffice.<br><br><a href="${blobUrl}" download="${subUpper}_${year}_${monLower}" class="attach-btn" style="margin-top:12px; display:inline-block;">Download File</a></div>`;
      } else {
        bodyEl.innerHTML = `<iframe src="${blobUrl}#toolbar=1&view=FitH" title="${type} PDF"></iframe>`;
      }

      dlTopBtn.href = blobUrl;
      dlTopBtn.download = `${subUpper}_${year}_${monLower}`;
      dlTopBtn.style.display = "inline-block";
    } catch (_) {
      bodyEl.innerHTML = `<div class="pane-status"><strong>File Not Found</strong><br><br>No matching file found for ${subUpper} (${month} ${year}) in <code>pdfs/${instUpper}/</code>.</div>`;
    }
    return;
  }

  bodyEl.innerHTML = `<div class="pane-status">Downloading real ${type} file from ${instUpper} portal...</div>`;

  try {
    const params = new URLSearchParams({
      sessionToken: authState.sessionToken,
      institute: instUpper,
      subject: subUpper,
      year,
      month: monLower,
      type
    });

    const resp = await fetch(`${API_BASE}/api/paper?${params.toString()}`);
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${resp.status}`);
    }

    const blob = await resp.blob();
    const blobUrl = setPaneBlob(type, blob);

    bodyEl.innerHTML = `<iframe src="${blobUrl}#toolbar=1&view=FitH" title="${type} PDF"></iframe>`;
    dlTopBtn.href = blobUrl;
    dlTopBtn.download = `${subUpper}_${year}_${monLower}`;
    dlTopBtn.style.display = "inline-block";
  } catch (err) {
    bodyEl.innerHTML = `<div class="pane-status"><strong>Could not load file:</strong><br>${err.message}</div>`;
  }
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.dataset.mode;
    const qPane = document.getElementById("pane-question");
    const aPane = document.getElementById("pane-answer");
    const resizer = document.getElementById("split-resizer");

    if (mode === "split") {
      qPane.style.display = "flex";
      aPane.style.display = "flex";
      resizer.style.display = "block";
      qPane.style.flex = "0 0 50%";
    } else if (mode === "question") {
      qPane.style.display = "flex";
      aPane.style.display = "none";
      resizer.style.display = "none";
      qPane.style.flex = "1";
    } else {
      qPane.style.display = "none";
      aPane.style.display = "flex";
      resizer.style.display = "none";
    }
  });
});

const resizer = document.getElementById("split-resizer");
const leftPane = document.getElementById("pane-question");
const rightPane = document.getElementById("pane-answer");
let isDragging = false;

resizer.addEventListener("mousedown", (e) => {
  e.preventDefault();
  isDragging = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  leftPane.style.pointerEvents = "none";
  rightPane.style.pointerEvents = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const pct = (e.clientX / window.innerWidth) * 100;
  if (pct > 15 && pct < 85) {
    leftPane.style.flex = `0 0 ${pct}%`;
  }
});

document.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
  leftPane.style.pointerEvents = "auto";
  rightPane.style.pointerEvents = "auto";
});

document.getElementById("close-split-btn").addEventListener("click", () => {
  splitModal.style.display = "none";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && splitModal.style.display === "flex") {
    splitModal.style.display = "none";
  }
});

async function resetAuthSession() {
  if (authState.sessionToken) {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: authState.sessionToken })
    }).catch(() => {});
  }
  authState = { sessionToken: null, authenticated: false, skipped: true, institute: null, memberId: null };
  navAuthBadge.style.display = "none";
}

document.getElementById("nav-logout-btn").addEventListener("click", async () => {
  const currentInst = instituteSelect.value;
  await resetAuthSession();
  authState.institute = currentInst;
  authState.skipped = true;
  loginCard.style.display = "none";
  verifiedCard.style.display = "none";
  switchAccountBtn.textContent = "Verify Login";
  if (currentInst && subjectSelect.value) {
    await renderAvailableYears(currentInst.toUpperCase(), subjectSelect.value);
  }
});

feedbackToggleBtn.addEventListener("click", () => {
  themeCard.style.display = "none";
  selectorCardPopover.style.display = "none";
  verifiedCard.style.display = "none";
  feedbackCard.style.display = feedbackCard.style.display === "none" ? "block" : "none";
});

feedbackCloseBtn.addEventListener("click", () => {
  feedbackCard.style.display = "none";
});

feedbackMsgForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const sendBtn = document.getElementById("feedback-send-btn");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  feedbackStatus.textContent = "";

  try {
    const resp = await fetch(`${API_BASE}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: document.getElementById("feedback-category").value,
        name: document.getElementById("feedback-sender").value,
        message: document.getElementById("feedback-text").value
      })
    });
    if (!resp.ok) throw new Error("Could not send message.");

    document.getElementById("feedback-text").value = "";
    feedbackStatus.style.color = "#4df095";
    feedbackStatus.textContent = "Message sent to Salamon! Thank you.";
  } catch (err) {
    feedbackStatus.style.color = "#ff9494";
    feedbackStatus.textContent = err.message;
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send Message";
  }
});