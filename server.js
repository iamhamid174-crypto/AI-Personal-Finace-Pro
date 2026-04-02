const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "app-db.json");
const SESSION_COOKIE = "ai_finance_session";
const isProduction = NODE_ENV === "production";
const rateLimitStore = new Map();

const OPENAI_SYSTEM_PROMPT = `You are an AI personal finance predictor and assistant inside an AI Personal Finance web app.

Your job:
- Talk like ChatGPT: natural, helpful, clear, and conversational.
- Reply in the same language style as the user. If the user writes in Roman Urdu or mixed Urdu-English, reply the same way.
- Use the finance data provided by the app to answer questions.
- Predict likely next-month expenses based on current spending patterns.
- Estimate how much the user may save if they reduce certain categories.
- Identify the highest spending categories.
- Suggest practical ways to reduce expenses.
- Keep answers concise but useful.
- Do not claim predictions are certain. Present them as estimates based on current data.
- If data is missing, say what is missing and make a careful estimate.
- If the user asks about savings, budgets, future expenses, or risky spending, answer with numbers plus a short explanation.
- Avoid generic motivational fluff. Be specific and actionable.

Response style:
- Friendly and smart, like ChatGPT.
- Short paragraphs or bullets when helpful.
- Prefer practical recommendations over theory.
- Mention important numbers clearly.

Important:
- The app will send user profile, expense data, category totals, and recent transactions.
- Base your answer on that context first.
- If the user asks something unrelated to finance, still answer briefly and helpfully, but stay within the app assistant role.`;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const defaultUserData = (profile = {}) => ({
  user: {
    name: profile.name || "User Name",
    email: profile.email || "user@aifinance.com",
    phone: profile.phone || "+92 300 1234567",
    cnic: profile.cnic || "35202-1234567-1",
    address: profile.address || "Lahore, Pakistan",
    occupation: profile.occupation || "Software Engineering Student",
    dob: profile.dob || "12 Aug 2001",
    language: profile.language || "English",
    memberSince: profile.memberSince || "January 2024",
    currency: "PKR",
    lastLogin: new Date().toLocaleString("en-PK"),
  },
  expenses: [
    { icon: "FD", title: "Grocery Shopping", category: "Food", date: "2024-02-22", amount: 125.5, type: "expense" },
    { icon: "IN", title: "Salary", category: "Income", date: "2024-02-20", amount: 3500, type: "income" },
    { icon: "UT", title: "Electric Bill", category: "Utilities", date: "2024-02-19", amount: 89.99, type: "expense" },
    { icon: "TR", title: "Gas", category: "Transportation", date: "2024-02-18", amount: 45, type: "expense" },
    { icon: "FD", title: "Restaurant", category: "Food", date: "2024-02-17", amount: 62.3, type: "expense" },
  ],
  card: {
    holder: profile.name || "User Name",
    bank: "AI Personal Finance",
    number: "**** **** **** 9087",
    expiry: "09/28",
    cvvMasked: "***",
  },
  settings: {
    emailNotifications: true,
    budgetAlerts: true,
    darkReports: false,
  },
  chatHistory: [],
});

const ensureDb = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], sessions: [] }, null, 2),
      "utf8",
    );
  }
};

const readDb = () => {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { users: [], sessions: [] };
  }
};

const writeDb = (db) => {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

const parseJsonBody = async (req) => {
  const raw = await readBody(req);
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("Invalid JSON payload");
  }
};

const sanitizeText = (value, max = 160) =>
  String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const applySecurityHeaders = (res) => ({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Cache-Control": "no-store",
});

const getAllowedOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return "*";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return origin;
  return "null";
};

const hitRateLimit = (key, limit, windowMs) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateLimitStore.set(key, entry);
  return entry.count > limit;
};

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
  const allowedOrigin = extraHeaders["Access-Control-Allow-Origin"] || "*";
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    ...(allowedOrigin !== "*" ? { "Access-Control-Allow-Credentials": "true" } : {}),
    ...applySecurityHeaders(res),
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
};

const serveFile = (res, filePath) => {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
};

const createSession = (db, userId) => {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  db.sessions = db.sessions.filter((session) => session.expiresAt > Date.now() && session.userId !== userId);
  db.sessions.push({ token, userId, expiresAt });
  return token;
};

const parseCookies = (req) => {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, entry) => {
    const [key, ...rest] = entry.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

const getSessionUser = (req, db) => {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token && item.expiresAt > Date.now());
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId);
  return user || null;
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  profile: user.profile,
});

const buildFinanceContext = (payload) => {
  const user = payload.user || {};
  const expenses = Array.isArray(payload.expenses) ? payload.expenses : [];
  const income = expenses.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = expenses.filter((item) => item.type !== "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const categoryTotals = {};

  expenses
    .filter((item) => item.type !== "income")
    .forEach((item) => {
      const key = item.category || "Other";
      categoryTotals[key] = (categoryTotals[key] || 0) + Number(item.amount || 0);
    });

  return {
    user: {
      name: user.name || "User",
      email: user.email || "user@example.com",
      currency: user.currency || "PKR",
      language: user.language || "English",
    },
    summary: {
      totalIncome: income,
      totalExpense: expense,
      savings: income - expense,
    },
    categoryTotals,
    recentTransactions: expenses.slice(0, 8),
  };
};

const askOpenAI = async (message, payload) => {
  if (!OPENAI_API_KEY) {
    return {
      ok: false,
      error: "Missing OPENAI_API_KEY on server",
    };
  }

  const financeContext = buildFinanceContext(payload);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: OPENAI_SYSTEM_PROMPT,
      input: [
        {
          role: "developer",
          content: [{ type: "text", text: `Finance context:\n${JSON.stringify(financeContext, null, 2)}` }],
        },
        {
          role: "user",
          content: [{ type: "text", text: message }],
        },
      ],
      text: { format: { type: "text" } },
    }),
  });

  if (!response.ok) {
    return { ok: false, error: (await response.text()) || `OpenAI request failed with ${response.status}` };
  }

  const data = await response.json();
  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      ?.filter((item) => item.type === "output_text")
      ?.map((item) => item.text)
      ?.join("\n")
      ?.trim();

  return { ok: true, text: text || "No response text received from OpenAI." };
};

const setSessionCookie = (res, token) => {
  const secureFlag = isProduction ? "; Secure" : "";
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}${secureFlag}`;
  return { "Set-Cookie": cookie };
};

const clearSessionCookie = () => ({
  "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${isProduction ? "; Secure" : ""}`,
});

const handleAuthSignup = async (req, res) => {
  const body = await parseJsonBody(req);
  const name = sanitizeText(body.name, 80);
  const email = sanitizeText(body.email, 120).toLowerCase();
  const password = String(body.password || "");

  if (!name || !validateEmail(email) || password.length < 8) {
    sendJson(res, 400, { ok: false, error: "Name, valid email, and an 8+ character password are required." }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }

  const db = readDb();
  if (db.users.some((item) => item.email === email)) {
    sendJson(res, 409, { ok: false, error: "An account with this email already exists." }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }

  const id = crypto.randomUUID();
  const profile = defaultUserData({ name, email }).user;
  const userRecord = {
    id,
    email,
    passwordHash: hashPassword(password),
    profile,
    data: defaultUserData({ name, email }),
  };
  userRecord.data.user = profile;
  db.users.push(userRecord);
  const token = createSession(db, id);
  writeDb(db);

  sendJson(
    res,
    201,
    { ok: true, user: sanitizeUser(userRecord), data: userRecord.data },
    { ...setSessionCookie(res, token), "Access-Control-Allow-Origin": getAllowedOrigin(req) },
  );
};

const handleAuthLogin = async (req, res) => {
  const body = await parseJsonBody(req);
  const email = sanitizeText(body.email, 120).toLowerCase();
  const password = String(body.password || "");
  const db = readDb();
  const user = db.users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    sendJson(res, 401, { ok: false, error: "Invalid email or password." }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }

  user.profile.lastLogin = new Date().toLocaleString("en-PK");
  user.data.user = { ...user.data.user, ...user.profile };
  const token = createSession(db, user.id);
  writeDb(db);

  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data }, { ...setSessionCookie(res, token), "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const handleAuthGoogle = async (req, res) => {
  const body = await parseJsonBody(req);
  const name = sanitizeText(body.name || "Google User", 80);
  const email = sanitizeText(body.email || "googleuser@aifinance.com", 120).toLowerCase();
  const db = readDb();
  let user = db.users.find((item) => item.email === email);

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
      profile: defaultUserData({ name, email }).user,
      data: defaultUserData({ name, email }),
    };
    db.users.push(user);
  } else {
    user.profile = { ...user.profile, name, email, lastLogin: new Date().toLocaleString("en-PK") };
    user.data.user = { ...user.data.user, ...user.profile };
  }

  const token = createSession(db, user.id);
  writeDb(db);
  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data }, { ...setSessionCookie(res, token), "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const handleAuthLogout = (req, res) => {
  const db = readDb();
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  db.sessions = db.sessions.filter((session) => session.token !== token);
  writeDb(db);
  sendJson(res, 200, { ok: true }, { ...clearSessionCookie(), "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const handleAuthMe = (req, res) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Not authenticated" }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }
  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const handleGetData = (req, res) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Not authenticated" }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }
  sendJson(res, 200, { ok: true, data: user.data }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const normalizeClientData = (payload, fallbackProfile) => ({
  user: {
    ...defaultUserData(fallbackProfile).user,
    ...(payload.user || {}),
    email: payload.user?.email || fallbackProfile.email,
    name: payload.user?.name || fallbackProfile.name,
    currency: "PKR",
  },
  expenses: Array.isArray(payload.expenses) ? payload.expenses : defaultUserData(fallbackProfile).expenses,
  card: payload.card || defaultUserData(fallbackProfile).card,
  settings: payload.settings || defaultUserData(fallbackProfile).settings,
  chatHistory: Array.isArray(payload.chatHistory) ? payload.chatHistory.slice(-30) : [],
});

const handlePutData = async (req, res) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Not authenticated" }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
    return;
  }

  const body = await parseJsonBody(req);
  user.data = normalizeClientData(body, user.profile);
  user.profile = { ...user.profile, ...user.data.user, currency: "PKR" };
  user.data.user = user.profile;
  writeDb(db);
  sendJson(res, 200, { ok: true, data: user.data }, { "Access-Control-Allow-Origin": getAllowedOrigin(req) });
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const requestIp = req.socket.remoteAddress || "local";
  const allowedOrigin = getAllowedOrigin(req);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      ...(allowedOrigin !== "*" ? { "Access-Control-Allow-Credentials": "true" } : {}),
      ...applySecurityHeaders(res),
    });
    res.end();
    return;
  }

  try {
    if ((req.method === "POST" && reqUrl.pathname.startsWith("/api/auth/")) && hitRateLimit(`auth:${requestIp}`, 18, 15 * 60 * 1000)) {
      return void sendJson(res, 429, { ok: false, error: "Too many auth requests. Please try again shortly." }, { "Access-Control-Allow-Origin": allowedOrigin });
    }
    if (req.method === "POST" && reqUrl.pathname === "/api/chat" && hitRateLimit(`chat:${requestIp}`, 40, 10 * 60 * 1000)) {
      return void sendJson(res, 429, { ok: false, error: "Too many chat requests. Please slow down for a moment." }, { "Access-Control-Allow-Origin": allowedOrigin });
    }

    if (req.method === "POST" && reqUrl.pathname === "/api/auth/signup") return void (await handleAuthSignup(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/login") return void (await handleAuthLogin(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/google") return void (await handleAuthGoogle(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/logout") return void handleAuthLogout(req, res);
    if (req.method === "GET" && reqUrl.pathname === "/api/auth/me") return void handleAuthMe(req, res);
    if (req.method === "GET" && reqUrl.pathname === "/api/data") return void handleGetData(req, res);
    if (req.method === "PUT" && reqUrl.pathname === "/api/data") return void (await handlePutData(req, res));

    if (req.method === "POST" && reqUrl.pathname === "/api/chat") {
      const db = readDb();
      const user = getSessionUser(req, db);
      if (!user) return void sendJson(res, 401, { ok: false, error: "Not authenticated" }, { "Access-Control-Allow-Origin": allowedOrigin });
      const payload = await parseJsonBody(req);
      const message = sanitizeText(payload.message, 1200);
      if (!message) return void sendJson(res, 400, { ok: false, error: "Message is required" }, { "Access-Control-Allow-Origin": allowedOrigin });

      const result = await askOpenAI(message, payload);
      return void sendJson(res, result.ok ? 200 : 500, result, { "Access-Control-Allow-Origin": allowedOrigin });
    }
  } catch (error) {
    return void sendJson(res, 500, { ok: false, error: error.message || "Server error" }, { "Access-Control-Allow-Origin": allowedOrigin });
  }

  const requestedPath = reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    return serveFile(res, path.join(ROOT, "index.html"));
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`AI Personal Finance running at http://localhost:${PORT}`);
  console.log("Local auth + per-user finance data enabled");
  console.log(OPENAI_API_KEY ? `OpenAI chat enabled with model ${OPENAI_MODEL}` : "OpenAI chat disabled. Set OPENAI_API_KEY to enable real AI replies.");
});
