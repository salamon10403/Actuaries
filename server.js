const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { chromium } = require("playwright");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ALLOWED_STATIC = new Set(["/index.html", "/style.css", "/script.js", "/"]);
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (ALLOWED_STATIC.has(req.path)) return express.static(__dirname)(req, res, next);
  return res.status(404).end();
});

["IAI", "IFOA", "SOA"].forEach(inst => {
  const dir = path.join(__dirname, "pdfs", inst);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const CACHE_DIR = path.join(__dirname, "cached_papers");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const MESSAGES_FILE = path.join(__dirname, "messages.json");

const PORTALS = {
  iai: {
    name: "IAI (India)",
    loginUrl: "https://actuariesindia.org/member-login",
    verifyUrl: "https://actuariesindia.org/member-dashboard",
    papersPage: "https://actuariesindia.org/examinations/past-question-papers",
    userSelector: 'input[type="text"], input[name*="member"], input[name*="user"], input[name="name"]',
    passSelector: 'input[type="password"]',
    captchaImgSelector: 'img[src*="captcha"], .captcha img',
    captchaInputSelector: 'input[name*="captcha"], input[placeholder*="answer" i]',
    submitSelector: 'button[type="submit"], input[type="submit"], button:has-text("SIGN IN")'
  },
  ifoa: {
    name: "IFoA (UK)",
    loginUrl: "https://www.actuaries.org.uk/my-account/",
    verifyUrl: "https://www.actuaries.org.uk/my-account/",
    papersPage: "https://www.actuaries.org.uk/studying/prepare-your-exams/past-exam-papers-and-examiners-reports",
    userSelector: 'input[type="email"], input[name*="user"], input[name*="email"]',
    passSelector: 'input[type="password"]',
    captchaImgSelector: 'img[src*="captcha"]',
    captchaInputSelector: 'input[name*="captcha"]',
    submitSelector: 'button[type="submit"], input[type="submit"]'
  },
  soa: {
    name: "SOA (US)",
    loginUrl: "https://www.soa.org/my-soa/",
    verifyUrl: "https://www.soa.org/my-soa/",
    papersPage: "https://www.soa.org/education/exam-req/syllabus-study-queries/",
    userSelector: 'input[type="email"], input[name*="user"], input[name*="login"]',
    passSelector: 'input[type="password"]',
    captchaImgSelector: 'img[src*="captcha"]',
    captchaInputSelector: 'input[name*="captcha"]',
    submitSelector: 'button[type="submit"], input[type="submit"]'
  }
};

const sessions = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000;

function withSessionLock(session, fn) {
  const next = (session.lock || Promise.resolve()).then(fn, fn);
  session.lock = next.catch(() => {});
  session.lastActive = Date.now();
  return next;
}

async function closeSession(token) {
  const s = sessions.get(token);
  if (!s) return;
  try { await s.browser.close(); } catch (_) {}
  sessions.delete(token);
}

setInterval(async () => {
  const now = Date.now();
  for (const [token, s] of sessions.entries()) {
    if (now - (s.lastActive || 0) > SESSION_TTL_MS) {
      await closeSession(token);
    }
  }
}, 2 * 60 * 1000);

process.on("SIGINT", async () => {
  for (const token of sessions.keys()) {
    await closeSession(token);
  }
  process.exit(0);
});

app.post(
  "/api/upload-local-pdfs",
  express.raw({ 
    type: [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
      "application/vnd.ms-excel", 
      "text/csv", 
      "application/octet-stream"
    ], 
    limit: "50mb" 
  }),
  (req, res) => {
    const instClean = String(req.query.institute || "IAI").toUpperCase().replace(/[^A-Z]/g, "");
    const rawName = path.basename(String(req.query.filename || "file.pdf"));
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const validExts = [".pdf", ".xlsx", ".xls", ".csv"];
    const isValid = validExts.some(ext => safeName.toLowerCase().endsWith(ext));

    if (!isValid || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Invalid file upload or unsupported extension." });
    }

    const folder = path.join(__dirname, "pdfs", instClean);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const targetPath = path.join(folder, safeName);
    fs.writeFileSync(targetPath, req.body);
    res.json({ ok: true, savedAs: `pdfs/${instClean}/${safeName}` });
  }
);

app.post("/api/feedback", (req, res) => {
  const { name, email, category, message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  let existing = [];
  if (fs.existsSync(MESSAGES_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8")); } catch (_) {}
  }

  existing.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    name: String(name || "Anonymous Student").trim(),
    email: String(email || "").trim(),
    category: String(category || "Website Idea").trim(),
    message: String(message).trim()
  });

  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(existing, null, 2));
  res.json({ ok: true });
});

app.get("/api/local-paper-list", (req, res) => {
  const instClean = String(req.query.institute || "").toUpperCase().replace(/[^A-Z]/g, "");
  const subClean  = String(req.query.subject || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const folder = path.join(__dirname, "pdfs", instClean);

  if (!fs.existsSync(folder)) {
    return res.json({ years: [] });
  }

  const validExts = [".pdf", ".xlsx", ".xls", ".csv"];
  const files = fs.readdirSync(folder).filter(f => validExts.some(ext => f.toLowerCase().endsWith(ext)));
  const matchingFiles = files.filter(f => f.toLowerCase().includes(subClean));
  const yearSet = new Set();

  matchingFiles.forEach(f => {
    const match = f.match(/(20\d{2}|19\d{2})/);
    if (match) {
      yearSet.add(parseInt(match[1], 10));
    }
  });

  const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
  res.json({ years: sortedYears });
});

app.get("/api/local-paper", (req, res) => {
  const instClean = String(req.query.institute || "").toUpperCase().replace(/[^A-Z]/g, "");
  const sub       = String(req.query.subject || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const yr        = String(req.query.year || "").replace(/[^0-9]/g, "");
  const yrShort   = yr.slice(-2);
  const monPrefix = String(req.query.month || "").toLowerCase().slice(0, 3);
  const isAnswer  = req.query.type === "answer";

  const folder = path.join(__dirname, "pdfs", instClean);
  if (!fs.existsSync(folder)) {
    return res.status(404).json({ error: `Folder pdfs/${instClean} does not exist.` });
  }

  const validExts = [".pdf", ".xlsx", ".xls", ".csv"];
  const files = fs.readdirSync(folder).filter(f => validExts.some(ext => f.toLowerCase().endsWith(ext)));
  const candidates = files.filter(f => {
    const lower = f.toLowerCase();
    return lower.includes(sub) && (lower.includes(yr) || lower.includes(yrShort));
  });

  const isSolName = (n) => /sol|ans|examiner|report|marking|key|er\b|_s\.|_s_|_a\.|_a_|-s\.|-a\.|templ|_s$|_ans/i.test(n);
  const byType = candidates.filter(f => isAnswer ? isSolName(f.toLowerCase()) : !isSolName(f.toLowerCase()));
  const typePool = byType.length > 0 ? byType : candidates;

  const sessionMatches = typePool.filter(f => {
    const lower = f.toLowerCase();
    const isFirstHalf = /apr|may|jun|spring|[_-]?0[3456][_-]?|s1/i.test(lower);
    const isSecondHalf = /sep|oct|nov|dec|autumn|fall|[_-]?(09|10|11|12)[_-]?|s2/i.test(lower);
    return monPrefix === "apr" ? isFirstHalf : isSecondHalf;
  });

  const matchedFile = sessionMatches.length > 0 ? sessionMatches[0] : (typePool[0] || null);

  if (!matchedFile) {
    return res.status(404).json({
      error: `No matching file found in pdfs/${instClean} for ${sub.toUpperCase()} (${req.query.month} ${yr}).`
    });
  }

  const ext = path.extname(matchedFile).toLowerCase();
  let contentType = "application/pdf";
  if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  else if (ext === ".xls") contentType = "application/vnd.ms-excel";
  else if (ext === ".csv") contentType = "text/csv";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `inline; filename="${matchedFile}"`);
  fs.createReadStream(path.join(folder, matchedFile)).pipe(res);
});

app.post("/api/auth/init", async (req, res) => {
  const institute = (req.body.institute || "").toLowerCase();
  const portal = PORTALS[institute];
  if (!portal) return res.status(400).json({ error: "Unsupported institute." });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    await page.goto(portal.loginUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForSelector(portal.passSelector, { timeout: 10000 }).catch(() => {});

    let captchaBase64 = null;
    const captchaEl = await page.$(portal.captchaImgSelector);
    if (captchaEl) {
      const buf = await captchaEl.screenshot();
      captchaBase64 = `data:image/png;base64,${buf.toString("base64")}`;
    }

    const sessionToken = crypto.randomBytes(24).toString("hex");
    sessions.set(sessionToken, {
      institute,
      portal,
      browser,
      context,
      page,
      authenticated: false,
      memberId: null,
      lastActive: Date.now(),
      lock: Promise.resolve()
    });

    res.json({
      sessionToken,
      portalName: portal.name,
      hasCaptcha: Boolean(captchaBase64),
      captchaImage: captchaBase64
    });
  } catch (err) {
    if (browser) try { await browser.close(); } catch (_) {}
    res.status(502).json({ error: `Could not reach ${portal.name}: ${err.message}` });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { sessionToken, memberId, password, captcha } = req.body;
  const session = sessions.get(sessionToken);

  if (!session) {
    return res.status(401).json({ authenticated: false, error: "Session expired. Click refresh to reload portal." });
  }

  const { page, portal } = session;
  try {
    const userField = await page.$(portal.userSelector);
    const passField = await page.$(portal.passSelector);

    if (!userField || !passField) {
      await closeSession(sessionToken);
      return res.status(502).json({ authenticated: false, error: "Official login fields not found on portal." });
    }

    await userField.fill(String(memberId || "").trim());
    await passField.fill(String(password || ""));

    const captchaField = await page.$(portal.captchaInputSelector);
    if (captchaField && captcha !== undefined) {
      await captchaField.fill(String(captcha).trim());
    }

    const submitBtn = await page.$(portal.submitSelector);

    await Promise.all([
      Promise.race([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 7000 }),
        page.waitForSelector(".messages--error, .alert-danger, .error-message, .toast-error, [role='alert']", { timeout: 7000 }),
        page.waitForFunction(() => !document.querySelector('input[type="password"]'), { timeout: 7000 })
      ]).catch(() => {}),
      submitBtn ? submitBtn.click() : passField.press("Enter")
    ]);

    const result = await page.evaluate(() => {
      const errEl = document.querySelector(".messages--error, .alert-danger, .error-message, .toast-error, [role='alert']");
      const errorText = errEl ? errEl.innerText.trim() : "";
      const hasPass = Boolean(document.querySelector('input[type="password"]'));
      return { errorText, hasPass, currentUrl: window.location.href };
    });

    if (result.errorText || result.hasPass) {
      await closeSession(sessionToken);
      return res.status(401).json({
        authenticated: false,
        error: result.errorText || `Official ${portal.name} portal rejected the login credentials or CAPTCHA.`
      });
    }

    session.authenticated = true;
    session.memberId = memberId;
    session.lastActive = Date.now();

    res.json({
      authenticated: true,
      memberId,
      portalName: portal.name
    });
  } catch (err) {
    await closeSession(sessionToken);
    res.status(500).json({ authenticated: false, error: `Verification error: ${err.message}` });
  }
});

app.get("/api/paper", async (req, res) => {
  const { sessionToken, institute, subject, year, month, type } = req.query;
  const session = sessions.get(sessionToken);

  if (!session || !session.authenticated) {
    return res.status(401).json({ error: "Not authenticated with official institute portal." });
  }

  const instUpper = String(institute || "").toUpperCase().replace(/[^A-Z]/g, "");
  const subUpper  = String(subject || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const yr        = String(year || "").replace(/[^0-9]/g, "");
  const mon       = String(month || "").toLowerCase().replace(/[^a-z]/g, "");
  const kind      = type === "answer" ? "answer" : "question";

  const fileName  = `${subUpper}_${yr}_${mon}_${kind}.pdf`;
  const cacheFile = path.join(CACHE_DIR, `${instUpper}_${fileName}`);
  const localArchiveFile = path.join(__dirname, "pdfs", instUpper, fileName);

  if (fs.existsSync(cacheFile)) {
    res.setHeader("Content-Type", "application/pdf");
    return fs.createReadStream(cacheFile).pipe(res);
  }

  await withSessionLock(session, async () => {
    try {
      const { page, portal } = session;

      if (!page.url().startsWith(portal.papersPage)) {
        await page.goto(portal.papersPage, { waitUntil: "domcontentloaded", timeout: 25000 });
        await page.waitForTimeout(1000);
      }

      const pdfHref = await page.evaluate(({ subUpper, yr, mon, kind }) => {
        const links = Array.from(document.querySelectorAll("a[href]"));
        const subRegex = new RegExp(`\\b${subUpper}\\b|${subUpper}`, "i");
        const yrRegex  = new RegExp(`\\b${yr}\\b|${yr}`);
        const monRegex = new RegExp(mon.slice(0, 3), "i");
        const isSol    = kind === "answer";

        const candidates = links
          .map(a => ({ href: a.href, text: `${a.innerText} ${a.href}`.toLowerCase() }))
          .filter(l => {
            if (!l.href.toLowerCase().includes(".pdf")) return false;
            if (!subRegex.test(l.text) || !yrRegex.test(l.text)) return false;
            const hasSolWord = /sol|ans|examiner|report|marking|key|_s\.|_a\./i.test(l.text);
            return isSol ? hasSolWord : !hasSolWord;
          });

        const exactMonth = candidates.find(l => monRegex.test(l.text));
        return exactMonth ? exactMonth.href : (candidates[0] ? candidates[0].href : null);
      }, { subUpper, yr, mon, kind });

      if (!pdfHref) {
        return res.status(404).json({
          error: `No ${kind} PDF link found on ${portal.name} for ${subUpper} (${month} ${yr}).`
        });
      }

      const apiResp = await page.context().request.get(pdfHref);
      if (!apiResp.ok()) {
        return res.status(502).json({ error: `Institute server returned HTTP ${apiResp.status()}` });
      }

      const pdfBuffer = await apiResp.body();
      fs.writeFileSync(cacheFile, pdfBuffer);

      if (fs.existsSync(path.dirname(localArchiveFile))) {
        fs.writeFileSync(localArchiveFile, pdfBuffer);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    } catch (err) {
      res.status(500).json({ error: `Failed to fetch PDF from portal: ${err.message}` });
    }
  });
});

app.post("/api/auth/logout", async (req, res) => {
  if (req.body.sessionToken) await closeSession(req.body.sessionToken);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Real-Time Actuarial Auth & File Server running at http://localhost:${PORT}`);
});