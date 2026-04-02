const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3001);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "app-db.json");
const SESSION_COOKIE = "ai_finance_session";

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

const sendJson = (res, statusCode, payload, extraHeaders = {}) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
  const cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
  return { "Set-Cookie": cookie };
};

const clearSessionCookie = () => ({
  "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
});

const handleAuthSignup = async (req, res) => {
  const body = JSON.parse((await readBody(req)) || "{}");
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name || !email || password.length < 6) {
    sendJson(res, 400, { ok: false, error: "Name, email, and a 6+ character password are required." });
    return;
  }

  const db = readDb();
  if (db.users.some((item) => item.email === email)) {
    sendJson(res, 409, { ok: false, error: "An account with this email already exists." });
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
    setSessionCookie(res, token),
  );
};

const handleAuthLogin = async (req, res) => {
  const body = JSON.parse((await readBody(req)) || "{}");
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const db = readDb();
  const user = db.users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    sendJson(res, 401, { ok: false, error: "Invalid email or password." });
    return;
  }

  user.profile.lastLogin = new Date().toLocaleString("en-PK");
  user.data.user = { ...user.data.user, ...user.profile };
  const token = createSession(db, user.id);
  writeDb(db);

  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data }, setSessionCookie(res, token));
};

const handleAuthGoogle = async (req, res) => {
  const body = JSON.parse((await readBody(req)) || "{}");
  const name = String(body.name || "Google User").trim();
  const email = String(body.email || "googleuser@aifinance.com").trim().toLowerCase();
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
  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data }, setSessionCookie(res, token));
};

const handleAuthLogout = (req, res) => {
  const db = readDb();
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  db.sessions = db.sessions.filter((session) => session.token !== token);
  writeDb(db);
  sendJson(res, 200, { ok: true }, clearSessionCookie());
};

const handleAuthMe = (req, res) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Not authenticated" });
    return;
  }
  sendJson(res, 200, { ok: true, user: sanitizeUser(user), data: user.data });
};

const handleGetData = (req, res) => {
  const db = readDb();
  const user = getSessionUser(req, db);
  if (!user) {
    sendJson(res, 401, { ok: false, error: "Not authenticated" });
    return;
  }
  sendJson(res, 200, { ok: true, data: user.data });
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
    sendJson(res, 401, { ok: false, error: "Not authenticated" });
    return;
  }

  const body = JSON.parse((await readBody(req)) || "{}");
  user.data = normalizeClientData(body, user.profile);
  user.profile = { ...user.profile, ...user.data.user, currency: "PKR" };
  user.data.user = user.profile;
  writeDb(db);
  sendJson(res, 200, { ok: true, data: user.data });
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    });
    res.end();
    return;
  }

  try {
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/signup") return void (await handleAuthSignup(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/login") return void (await handleAuthLogin(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/google") return void (await handleAuthGoogle(req, res));
    if (req.method === "POST" && reqUrl.pathname === "/api/auth/logout") return void handleAuthLogout(req, res);
    if (req.method === "GET" && reqUrl.pathname === "/api/auth/me") return void handleAuthMe(req, res);
    if (req.method === "GET" && reqUrl.pathname === "/api/data") return void handleGetData(req, res);
    if (req.method === "PUT" && reqUrl.pathname === "/api/data") return void (await handlePutData(req, res));

    if (req.method === "POST" && reqUrl.pathname === "/api/chat") {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const message = String(payload.message || "").trim();
      if (!message) return void sendJson(res, 400, { ok: false, error: "Message is required" });

      const result = await askOpenAI(message, payload);
      return void sendJson(res, result.ok ? 200 : 500, result);
    }
  } catch (error) {
    return void sendJson(res, 500, { ok: false, error: error.message || "Server error" });
  }

  const requestedPath = reqUrl.pathname === "/" ? "/index.html" : reqUrl.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`AI Personal Finance running at http://localhost:${PORT}`);
  console.log("Local auth + per-user finance data enabled");
  console.log(OPENAI_API_KEY ? `OpenAI chat enabled with model ${OPENAI_MODEL}` : "OpenAI chat disabled. Set OPENAI_API_KEY to enable real AI replies.");
});
