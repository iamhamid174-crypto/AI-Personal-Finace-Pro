import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

const STORAGE_KEYS = {
  user: "ai_finance_user",
  expenses: "ai_finance_expenses",
  card: "ai_finance_card",
  settings: "ai_finance_settings",
  chat: "ai_finance_chat",
};

const defaultUser = {
  name: "User Name",
  email: "user@aifinance.com",
  phone: "+92 300 1234567",
  cnic: "35202-1234567-1",
  address: "Lahore, Pakistan",
  occupation: "Software Engineering Student",
  dob: "12 Aug 2001",
  language: "English",
  memberSince: "January 2024",
  currency: "PKR",
  lastLogin: "2026-03-25 03:35 PM",
};

const defaultExpenses = [
  { icon: "FD", title: "Grocery Shopping", category: "Food", date: "2024-02-22", amount: 125.5, type: "expense" },
  { icon: "IN", title: "Salary", category: "Income", date: "2024-02-20", amount: 3500, type: "income" },
  { icon: "UT", title: "Electric Bill", category: "Utilities", date: "2024-02-19", amount: 89.99, type: "expense" },
  { icon: "TR", title: "Gas", category: "Transportation", date: "2024-02-18", amount: 45, type: "expense" },
  { icon: "FD", title: "Restaurant", category: "Food", date: "2024-02-17", amount: 62.3, type: "expense" },
];

const defaultCard = {
  holder: "User Name",
  bank: "AI Personal Finance",
  number: "**** **** **** 9087",
  expiry: "09/28",
  cvvMasked: "***",
};

const defaultSettings = {
  emailNotifications: true,
  budgetAlerts: true,
  darkReports: false,
};

const iconByCategory = {
  Food: "FD",
  Utilities: "UT",
  Transportation: "TR",
  Shopping: "SH",
  Health: "HL",
  Other: "OT",
  Income: "IN",
};

const features = [
  { icon: "AI", title: "AI Insights", text: "Understand spending behavior using AI analysis." },
  { icon: "EX", title: "Expense Tracking", text: "Automatically categorize and monitor expenses." },
  { icon: "SC", title: "Secure System", text: "Protected dashboard with authenticated access." },
];

const steps = [
  { icon: "01", title: "Sign Up", text: "Create your secure account." },
  { icon: "02", title: "Add Data", text: "Enter income & expenses." },
  { icon: "03", title: "AI Analysis", text: "System analyzes your finance." },
  { icon: "04", title: "Get Insights", text: "Receive smart suggestions." },
];

const team = [
  { initials: "WA", name: "Waqar Ali", role: "Python Developer" },
  { initials: "MH", name: "M Hamid", role: "Front-End Developer" },
  { initials: "ZG", name: "Zohaib Gulzar", role: "Software Engineer" },
];

const authSlides = [
  {
    eyebrow: "Smart Tracking",
    title: "Watch your monthly spending like a live finance studio.",
    text: "Monitor expenses, compare categories, and stay clear about where your money is going.",
    theme: "expenses",
    stat: "PKR 24,359",
    note: "Current balance",
  },
  {
    eyebrow: "AI Prediction",
    title: "Get forecast-style insights before your next month starts.",
    text: "Predict future expense trends, spot risky categories, and improve savings planning faster.",
    theme: "prediction",
    stat: "82%",
    note: "Budget accuracy",
  },
  {
    eyebrow: "Secure Finance",
    title: "Keep accounts, cards, and reports in one secure personal dashboard.",
    text: "From login to report download and chatbot guidance, everything stays connected in one flow.",
    theme: "security",
    stat: "01 Linked",
    note: "Protected ATM card",
  },
];

const chatbotLanguages = [
  { label: "Roman Urdu", value: "roman-ur" },
  { label: "English", value: "en-US" },
  { label: "Urdu", value: "ur-PK" },
];

function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return parsed;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => getStored(key, fallback));
  useEffect(() => {
    setStored(key, state);
  }, [key, state]);
  return [state, setState];
}

function usePageMeta(title, bodyClass) {
  useEffect(() => {
    document.title = title;
    document.body.className = bodyClass;
    return () => {
      document.body.className = "";
    };
  }, [title, bodyClass]);
}

function formatCurrency(value, symbol = "PKR") {
  return `${symbol} ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function maskCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 16);
  return `**** **** **** ${digits.slice(-4).padStart(4, "*")}`;
}

function buildPrediction(expenses) {
  const income = expenses.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = expenses.filter((item) => item.type !== "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const categoryTotals = {};

  expenses.filter((item) => item.type !== "income").forEach((item) => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
  });

  const topEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["General", 0];
  const projectedExpense = expense * 1.08;
  const possibleSaving = Math.max(topEntry[1] * 0.18, expense * 0.09 || 0);

  return {
    income,
    expense,
    savings: income - expense,
    topCategory: topEntry[0],
    topCategoryAmount: topEntry[1],
    projectedExpense,
    possibleSaving,
    safeBudget: Math.max(projectedExpense - possibleSaving, 0),
  };
}

function buildLocalReply(message, prediction, user, expenses, settings, languageMode = "roman-ur") {
  const prompt = message.toLowerCase();
  const recentExpenseCount = expenses.filter((item) => item.type !== "income").length;
  const alerts = [];
  const english = languageMode === "en-US";
  const urdu = languageMode === "ur-PK";

  if (settings.budgetAlerts) alerts.push("budget alerts on hain");
  if (settings.emailNotifications) alerts.push("email notifications active hain");

  if (english) {
    if (/save|saving/.test(prompt)) return `Based on your current pattern, you could save about ${formatCurrency(prediction.possibleSaving)} next month if you reduce ${prediction.topCategory} spending and follow a weekly limit.`;
    if (/predict|forecast|next|expense/.test(prompt)) return `Based on your latest ${recentExpenseCount} expense records, your next month expense may land around ${formatCurrency(prediction.projectedExpense)}. With tighter ${prediction.topCategory} control, you may bring it closer to ${formatCurrency(prediction.safeBudget)}.`;
    if (/category|most|highest/.test(prompt)) return `${prediction.topCategory} is currently your highest spending category at around ${formatCurrency(prediction.topCategoryAmount)}. That is the best place to cut costs first.`;
    if (/budget|plan|limit/.test(prompt)) return `A practical next-month budget would be around ${formatCurrency(prediction.safeBudget)}. Set a strict cap for ${prediction.topCategory} and review spending weekly.`;
    if (/settings|alerts|notification/.test(prompt)) return `Your current app setup shows ${alerts.join(" and ") || "basic alerts turned off"}. Keeping budget alerts on will help your predictions stay useful.`;
    if (/hello|hi/.test(prompt)) return `Hi ${user.name}. I'm your finance predictor chatbot. You can ask me about next month expense, savings, budget planning, or your top spending category.`;
    return `Your current total expense is ${formatCurrency(prediction.expense)} and your projected next month expense is around ${formatCurrency(prediction.projectedExpense)}.`;
  }

  if (urdu) {
    if (/save|saving|bacha/.test(prompt)) return `Aap ke current pattern ke mutabiq agar aap ${prediction.topCategory} category ko kam karein to aglay mahinay takreeban ${formatCurrency(prediction.possibleSaving)} bacha saktay hain.`;
    if (/predict|forecast|next|agla|expense/.test(prompt)) return `Aap ke recent ${recentExpenseCount} expense records ko dekh kar andaza hai ke aglay mahinay aap ka kharcha ${formatCurrency(prediction.projectedExpense)} ke qareeb ho sakta hai.`;
    if (/category|most|highest|sab se zyada/.test(prompt)) return `Filhal sab se zyada kharcha ${prediction.topCategory} category mein ho raha hai, jo taqreeban ${formatCurrency(prediction.topCategoryAmount)} hai.`;
    if (/budget|plan|limit/.test(prompt)) return `Aap ke liye ek munaasib working budget ${formatCurrency(prediction.safeBudget)} ho sakta hai. ${prediction.topCategory} par sakht limit lagana behtar rahega.`;
    if (/hello|hi|salam|assalam/.test(prompt)) return `Assalam o Alaikum ${user.name}. Main aap ka finance predictor chatbot hoon. Aap mujh se budget, savings aur future expenses ke bare mein pooch saktay hain.`;
    return `Aap ka mojooda total expense ${formatCurrency(prediction.expense)} hai aur aglay mahinay ka projected expense ${formatCurrency(prediction.projectedExpense)} ke qareeb hai.`;
  }

  if (/save|saving|bacha/.test(prompt)) {
    return `Estimate ke mutabiq aap aglay month takreeban ${formatCurrency(prediction.possibleSaving)} bacha saktay hain agar ${prediction.topCategory} category ko tighten karein. Mera honest suggestion hai ke is category ke liye hard cap set karein, har 3 din baad review karein, aur impulsive spending ko thora delay karein.`;
  }

  if (/predict|forecast|next|agla|expense/.test(prompt)) {
    return `Current ${recentExpenseCount} expense records ko dekh kar lagta hai ke aglay month aap ka total expense ${formatCurrency(prediction.projectedExpense)} ke qareeb ja sakta hai. Agar aap unnecessary ${prediction.topCategory} spend ko kam karein to isay ${formatCurrency(prediction.safeBudget)} ke qareeb laya ja sakta hai. Yani abhi situation control mein hai, bas top category ko discipline chahiye.`;
  }

  if (/category|most|highest|sab se zyada/.test(prompt)) {
    return `Abhi sab se zyada spending ${prediction.topCategory} mein ho rahi hai, around ${formatCurrency(prediction.topCategoryAmount)}. Saving start karni ho to isi category se karna best rahega.`;
  }

  if (/budget|plan|limit/.test(prompt)) {
    return `Aap ke current pattern ke hisaab se recommended working budget ${formatCurrency(prediction.safeBudget)} hai. Is budget ke saath ${prediction.topCategory} ke liye strict limit aur baqi categories ke liye soft limit rakhna useful hoga. Agar aap chahein to main is budget ko weekly breakdown mein bhi convert kar sakta hoon.`;
  }

  if (/settings|alerts|notification/.test(prompt)) {
    return `Aap ki app settings ke mutabiq ${alerts.join(" aur ") || "basic alerts off hain"}. Agar aap prediction follow karna chahte hain to monthly budget alerts on rehna better hai.`;
  }

  if (/hello|hi|salam|assalam/.test(prompt)) {
    return `Salam ${user.name}. Main aap ka free local finance predictor hoon. Aap mujh se next month expense, possible saving, top spending category, ya budget plan pooch saktay hain.`;
  }

  return `Aap ka current total expense ${formatCurrency(prediction.expense)} hai aur projected next month expense ${formatCurrency(prediction.projectedExpense)} ke qareeb hai. Agar chahein to poochhein: "aglay month kitna expense hoga?" ya "kitna bacha sakta hoon?"`;
}

async function apiRequest(url, options = {}) {
  const requestOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  const targets = [url];
  if (url.startsWith("/api/")) {
    targets.push(`http://localhost:3001${url}`);
  }

  let lastError = null;

  for (const target of targets) {
    try {
      const response = await fetch(target, requestOptions);
      const text = await response.text();
      const payload = text ? JSON.parse(text) : {};
      if (!response.ok) {
        throw new Error(payload.error || "Request failed");
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof TypeError) {
    throw new Error("Backend server connect nahi ho raha. `npm run server` chalao aur phir dobara try karo.");
  }

  throw new Error(lastError?.message || "Request failed");
}

function getWelcomeChat(user, expenses) {
  const prediction = buildPrediction(expenses);
  return [
    {
      role: "bot",
      text: `Salam ${user.name}. Main aap ka free local AI-style finance predictor hoon. Current data ke mutabiq next month projected expense ${formatCurrency(prediction.projectedExpense)} hai.`,
    },
  ];
}

function App() {
  const [user, setUser] = usePersistentState(STORAGE_KEYS.user, defaultUser);
  const [expenses, setExpenses] = usePersistentState(STORAGE_KEYS.expenses, defaultExpenses);
  const [card, setCard] = usePersistentState(STORAGE_KEYS.card, defaultCard);
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, defaultSettings);
  const [chatHistory, setChatHistory] = usePersistentState(STORAGE_KEYS.chat, []);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    apiRequest("/api/auth/me")
      .then((payload) => {
        if (!mounted) return;
        const data = payload.data || {};
        setUser(data.user || defaultUser);
        setExpenses(data.expenses || defaultExpenses);
        setCard(data.card || defaultCard);
        setSettings(data.settings || defaultSettings);
        setChatHistory(data.chatHistory?.length ? data.chatHistory : getWelcomeChat(data.user || defaultUser, data.expenses || defaultExpenses));
        setIsAuthenticated(true);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (mounted) setAuthChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, [setCard, setChatHistory, setExpenses, setSettings, setUser]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return undefined;
    const timer = window.setTimeout(() => {
      apiRequest("/api/data", {
        method: "PUT",
        body: JSON.stringify({ user, expenses, card, settings, chatHistory }),
      }).catch(() => {});
    }, 500);

    return () => window.clearTimeout(timer);
  }, [authChecked, isAuthenticated, user, expenses, card, settings, chatHistory]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated || chatHistory.length) return;
    setChatHistory(getWelcomeChat(user, expenses));
  }, [authChecked, isAuthenticated, chatHistory.length, user, expenses, setChatHistory]);

  if (!authChecked) {
    return <div className="app-loading-screen"><div className="app-loading-card"><strong>Loading AI Personal Finance...</strong><p>Preparing your secure dashboard session.</p></div></div>;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" user={user} setUser={setUser} setExpenses={setExpenses} setCard={setCard} setSettings={setSettings} setChatHistory={setChatHistory} setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/signup" element={<AuthPage mode="signup" user={user} setUser={setUser} setExpenses={setExpenses} setCard={setCard} setSettings={setSettings} setChatHistory={setChatHistory} setIsAuthenticated={setIsAuthenticated} />} />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardPage
              user={user}
              setUser={setUser}
              expenses={expenses}
              setExpenses={setExpenses}
              card={card}
              setCard={setCard}
              settings={settings}
              setSettings={setSettings}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              setIsAuthenticated={setIsAuthenticated}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LandingPage() {
  usePageMeta("AI Personal Finance | Smart Decisions", "landing-page");
  return (
    <div className="page-shell">
      <header className="finance-nav">
        <a className="brand finance-brand" href="#home"><span className="brand-mark"><span className="brand-mark-ring"></span><span className="brand-mark-core">AI</span></span><span>Personal Finance</span></a>
        <nav className="nav-links finance-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">About</a><a href="#team">Team</a><a href="#contact">Contact</a></nav>
        <div className="nav-actions"><Link className="btn btn-finance-ghost" to="/login">Login</Link><Link className="btn btn-finance-primary" to="/signup">Create Account</Link></div>
      </header>

      <main className="finance-landing">
        <section className="finance-hero" id="home">
          <div className="finance-hero-copy">
            <p className="finance-tag">AI Powered Personal Finance</p>
            <h1>See where your money goes before it disappears.</h1>
            <p>Track expenses, manage cards, download reports, and chat with an AI predictor that helps you plan your next month more confidently.</p>
            <div className="hero-actions">
              <Link className="btn btn-finance-primary" to="/signup">Start Free</Link>
              <Link className="btn btn-finance-ghost" to="/login">Open Dashboard</Link>
            </div>
            <div className="finance-hero-metrics">
              <div><strong>82%</strong><span>Budget visibility</span></div>
              <div><strong>24/7</strong><span>AI assistant access</span></div>
              <div><strong>1 App</strong><span>All finance tools</span></div>
            </div>
          </div>
          <div className="finance-hero-visual" aria-hidden="true">
            <div className="finance-screen">
              <div className="finance-screen-head">
                <span></span><span></span><span></span>
              </div>
              <div className="finance-screen-body">
                <div className="finance-balance-card">
                  <small>Total balance</small>
                  <strong>PKR 50,000</strong>
                  <p>Updated from wallet + cards</p>
                </div>
                <div className="finance-chart-card">
                  <div className="finance-bars"><span></span><span></span><span></span><span></span><span></span></div>
                  <div className="finance-line"></div>
                </div>
                <div className="finance-mini-grid">
                  <div className="finance-mini-card">
                    <small>Food</small>
                    <strong>37%</strong>
                  </div>
                  <div className="finance-mini-card">
                    <small>Savings</small>
                    <strong>PKR 18k</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="finance-float finance-float-a">
              <span>AI Predictor</span>
              <strong>Next month expense: PKR 34.8k</strong>
            </div>
            <div className="finance-float finance-float-b">
              <span>Card Vault</span>
              <strong>1 secure linked ATM card</strong>
            </div>
          </div>
        </section>

        <section className="finance-strip">
          <div><strong>Expense Tracking</strong><span>Manual + categorized entries</span></div>
          <div><strong>AI Prediction</strong><span>Future spend and saving suggestions</span></div>
          <div><strong>Secure Access</strong><span>User, settings, cards, reports</span></div>
        </section>

        <section className="finance-section" id="features">
          <div className="finance-section-head">
            <p className="finance-tag">Core Features</p>
            <h2>Everything important in one finance workspace.</h2>
          </div>
          <div className="finance-feature-grid">
            <article className="finance-feature-card finance-feature-card-accent"><div className="finance-feature-icon">AI</div><h3>AI Finance Predictor</h3><p>Ask the chatbot about next-month expenses, savings opportunities, and top-spending categories.</p></article>
            <article className="finance-feature-card"><div className="finance-feature-icon">TR</div><h3>Expense & Transaction Tracking</h3><p>Save daily records, view recent activity, and monitor category-wise spending patterns easily.</p></article>
            <article className="finance-feature-card"><div className="finance-feature-icon">RP</div><h3>Reports & Insights</h3><p>Generate downloadable reports and review budget-vs-spending with smarter summaries.</p></article>
            <article className="finance-feature-card"><div className="finance-feature-icon">US</div><h3>User Profile & Settings</h3><p>Control account data, notifications, preferences, and security details from one place.</p></article>
          </div>
        </section>

        <section className="finance-section finance-story" id="about">
          <div className="finance-story-copy">
            <p className="finance-tag">Why This Project</p>
            <h2>Built for students and users who want finance clarity, not complexity.</h2>
            <p>AI Personal Finance turns scattered personal expense notes into a proper system with login, dashboard, analytics, secure card preview, reports, and a finance chatbot.</p>
            <div className="finance-checks">
              <span>Live dashboard overview</span>
              <span>Manual expense add and update</span>
              <span>Chatbot with multilingual support</span>
            </div>
          </div>
          <div className="finance-story-panel">
            <div className="story-card story-card-dark">
              <small>Monthly expense</small>
              <strong>PKR 32,000</strong>
              <p>Tracked through transactions and categories</p>
            </div>
            <div className="story-card">
              <small>Suggested saving</small>
              <strong>PKR 6,400</strong>
              <p>AI recommendation based on current trends</p>
            </div>
          </div>
        </section>

        <section className="finance-section" id="team">
          <div className="finance-section-head center">
            <p className="finance-tag">Project Team</p>
            <h2>People behind the platform.</h2>
          </div>
          <div className="finance-team-grid">
            {team.map((member) => <article className="finance-team-card" key={member.name}><div className="finance-team-avatar">{member.initials}</div><h3>{member.name}</h3><p>{member.role}</p></article>)}
          </div>
        </section>

        <section className="finance-section finance-end-panel" id="contact">
          <div className="finance-end-copy">
            <p className="finance-tag">Ready To Start?</p>
            <h2>Turn your final year project into a finance product that actually feels live.</h2>
            <p>From signup and secure account flow to expense analytics, ATM card preview, report export, and AI guidance, this platform now brings the full journey together in one polished experience.</p>
            <div className="hero-actions">
              <Link className="btn btn-finance-primary" to="/signup">Create Account</Link>
              <Link className="btn btn-finance-ghost" to="/login">Login Now</Link>
            </div>
          </div>
          <div className="finance-end-grid">
            <article className="finance-end-card finance-end-card-primary">
              <small>Project Outcome</small>
              <strong>Smart Personal Finance Platform</strong>
              <p>Track expenses, manage profiles, secure cards, generate reports, and ask the AI predictor for planning help.</p>
            </article>
            <article className="finance-end-card">
              <small>What Users Get</small>
              <ul className="finance-end-list">
                <li>Live dashboard with PKR analytics</li>
                <li>Manual transaction and expense entry</li>
                <li>Chatbot-based future expense guidance</li>
              </ul>
            </article>
            <article className="finance-end-card">
              <small>Submission Ready</small>
              <div className="finance-end-metrics">
                <div><strong>UI</strong><span>Landing to dashboard flow</span></div>
                <div><strong>Auth</strong><span>Signup, login, protected route</span></div>
                <div><strong>Data</strong><span>Profile, settings, card, reports</span></div>
              </div>
            </article>
          </div>
        </section>
      </main>
      <footer className="footer finance-footer"><div className="finance-footer-brand"><strong>AI Personal Finance</strong><span>Final Year Project for smarter personal expense management.</span></div><div className="footer-socials"><a className="social-badge social-badge-google" href="#contact" aria-label="Google">G</a><a className="social-badge social-badge-facebook" href="#contact" aria-label="Facebook">f</a><a className="social-badge social-badge-linkedin" href="#contact" aria-label="LinkedIn">in</a></div><span>&copy; 2026 AI Personal Finance. All rights reserved.</span></footer>
    </div>
  );
}

function AuthPage({ mode, user, setUser, setExpenses, setCard, setSettings, setChatHistory, setIsAuthenticated }) {
  const navigate = useNavigate();
  const isLogin = mode === "login";
  usePageMeta(isLogin ? "Login | AI Personal Finance" : "Sign Up | AI Personal Finance", "auth-page");
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "", confirmPassword: "" });
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % authSlides.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = authSlides[activeSlide];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isLogin && form.password !== form.confirmPassword) return;
    setSubmitting(true);
    setErrorText("");

    try {
      const payload = await apiRequest(isLogin ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = payload.data || {};
      setUser(data.user || defaultUser);
      setExpenses(data.expenses || defaultExpenses);
      setCard(data.card || defaultCard);
      setSettings(data.settings || defaultSettings);
      setChatHistory(data.chatHistory?.length ? data.chatHistory : getWelcomeChat(data.user || defaultUser, data.expenses || defaultExpenses));
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (error) {
      setErrorText(error.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialAuth = async ({ name, email }) => {
    setSubmitting(true);
    setErrorText("");
    try {
      const payload = await apiRequest("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ name, email }),
      });
      const data = payload.data || {};
      setUser(data.user || defaultUser);
      setExpenses(data.expenses || defaultExpenses);
      setCard(data.card || defaultCard);
      setSettings(data.settings || defaultSettings);
      setChatHistory(data.chatHistory?.length ? data.chatHistory : getWelcomeChat(data.user || defaultUser, data.expenses || defaultExpenses));
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (error) {
      setErrorText(error.message || "Google sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    const fallbackName = isLogin ? user.name : (form.name.trim() || "Google User");
    const fallbackEmail = form.email.trim() || "googleuser@aifinance.com";
    await handleSocialAuth({ name: fallbackName, email: fallbackEmail });
  };

  const handleFacebookAuth = async () => {
    const fallbackName = isLogin ? user.name : (form.name.trim() || "Facebook User");
    const fallbackEmail = form.email.trim() || "facebookuser@aifinance.com";
    await handleSocialAuth({ name: fallbackName, email: fallbackEmail });
  };

  return (
    <div className={`auth-shell ${isLogin ? "auth-shell-login" : "auth-shell-signup"}`}>
      <section className="auth-panel auth-info auth-showcase">
        <div className="auth-showcase-top">
          <Link className="brand auth-brand-dark" to="/"><span className="brand-mark"><span className="brand-mark-ring"></span><span className="brand-mark-core">AI</span></span><span>Personal Finance</span></Link>
          <span className="auth-showcase-chip">{isLogin ? "Secure Access" : "New Account"}</span>
        </div>
        <div className="auth-showcase-copy">
          <p className="auth-slider-tag">{currentSlide.eyebrow}</p>
          <h1>{isLogin ? "One place for your money, reports, and AI help." : "Create your finance space in seconds."}</h1>
          <h3 className="auth-slider-title">{currentSlide.title}</h3>
          <p className="auth-copy">{isLogin ? "Log in to review expenses, budgets, linked cards, settings, and AI predictions without jumping between screens." : "Register once and move directly into your personal finance dashboard with transactions, reports, and AI insights ready to use."}</p>
        </div>
        <div className={`auth-visual-stage auth-visual-stage-${currentSlide.theme}`} aria-hidden="true">
          <div className="auth-media-shell">
            <div className="auth-media-topbar"><span></span><span></span><span></span></div>
            <div className={`auth-media auth-media-${currentSlide.theme}`}>
              <div className="auth-media-header">
                <span>{currentSlide.eyebrow}</span>
                <strong>{currentSlide.note}</strong>
              </div>
              <div className="auth-media-body">
                <div className="media-card media-card-balance">
                  <span>{currentSlide.note}</span>
                  <strong>{currentSlide.stat}</strong>
                </div>
                <div className="media-card media-card-chart">
                  <div className="media-chart-bars"><span></span><span></span><span></span><span></span></div>
                  <div className="media-chart-line"></div>
                </div>
                <div className="media-card media-card-chat">
                  <div className="media-bubble media-bubble-user"></div>
                  <div className="media-bubble media-bubble-bot"></div>
                  <div className="media-bubble media-bubble-bot short"></div>
                </div>
                <div className="media-card media-card-card">
                  <div className="media-card-chip"></div>
                  <strong>**** 9087</strong>
                  <span>AI Personal Finance</span>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-floating-card balance-card">
            <span>{currentSlide.note}</span>
            <strong>{currentSlide.stat}</strong>
            <p>Live finance preview</p>
          </div>
          <div className="auth-floating-card ring-card">
            <div className="mini-donut">
              <div className="mini-donut-center"><strong>{activeSlide === 0 ? "34" : activeSlide === 1 ? "82" : "01"}</strong><span>{activeSlide === 0 ? "Food" : activeSlide === 1 ? "AI" : "Card"}</span></div>
            </div>
          </div>
          <div className="auth-floating-card upload-card">
            <div className="upload-icon">{activeSlide === 2 ? "SC" : activeSlide === 1 ? "AI" : "CD"}</div>
            <div>
              <strong>{activeSlide === 0 ? "Expense overview" : activeSlide === 1 ? "Prediction ready" : "Secure access"}</strong>
              <p>{activeSlide === 0 ? "Track and compare daily spending." : activeSlide === 1 ? "See next month forecast instantly." : "Your profile and cards stay protected."}</p>
            </div>
          </div>
          <div className="auth-glow auth-glow-a"></div>
          <div className="auth-glow auth-glow-b"></div>
        </div>
        <div className="auth-copy-wrap">
          <div className="auth-dots">{authSlides.map((slide, index) => <button key={slide.theme} type="button" className={index === activeSlide ? "active" : ""} onClick={() => setActiveSlide(index)} aria-label={`Show slide ${index + 1}`}></button>)}</div>
          <div className="auth-info-pills">
            <span>Expense tracking</span>
            <span>AI predictor</span>
            <span>Secure card vault</span>
          </div>
        </div>
      </section>
      <section className="auth-panel auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-head">
            <p className="form-tag">{isLogin ? "Login" : "Create Account"}</p>
            <span className="auth-head-badge">{isLogin ? "Protected Access" : "Secure Setup"}</span>
          </div>
          <h2>{isLogin ? "Welcome back to your finance dashboard" : "Set up your account and continue"}</h2>
          <p className="auth-form-copy">{isLogin ? "Use your email and password to access dashboard insights, saved cards, reports, and the AI predictor." : "Register with your details and continue into the dashboard with your own finance profile."}</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin ? <label>Full Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} type="text" placeholder="Enter your full name" required /></label> : null}
            <label>Email Address<input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} type="email" placeholder="you@example.com" required /></label>
            <label>Password<div className="password-field"><input value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} type={showPassword ? "text" : "password"} placeholder="Enter password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
            {!isLogin ? <label>Confirm Password<div className="password-field"><input value={form.confirmPassword} onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))} type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" required /><button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? "Hide" : "Show"}</button></div>{form.confirmPassword && form.password !== form.confirmPassword ? <small className="field-helper error">Passwords do not match yet.</small> : <small className="field-helper">Use a strong password for better account safety.</small>}</label> : null}
            {isLogin ? <div className="form-row auth-row-light"><label className="remember-line"><input type="checkbox" defaultChecked /> Remember me</label><Link to="/signup">Forgot password?</Link></div> : null}
            {errorText ? <small className="field-helper error">{errorText}</small> : null}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait..." : isLogin ? "Sign In" : "Register Now"}</button>
          </form>
          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-socials">
            <button className="auth-social-btn auth-social-btn-google" type="button" onClick={handleGoogleAuth} disabled={submitting}><span className="social-logo social-logo-google">G</span> Continue with Google</button>
            <button className="auth-social-btn auth-social-btn-facebook" type="button" onClick={handleFacebookAuth} disabled={submitting}><span className="social-logo social-logo-facebook">f</span> Continue with Facebook</button>
          </div>
          <div className="auth-trust-row">
            <span>Encrypted login</span>
            <span>Fast access</span>
            <span>AI-ready dashboard</span>
          </div>
          <p className="auth-switch">{isLogin ? <>Don't have an account? <Link to="/signup">Create one now</Link></> : <>Already have an account? <Link to="/login">Login here</Link></>}</p>
        </div>
      </section>
    </div>
  );
}

function DashboardPage({ user, setUser, expenses, setExpenses, card, setCard, settings, setSettings, chatHistory, setChatHistory, setIsAuthenticated }) {
  usePageMeta("Dashboard | AI Personal Finance", "dashboard-body");
  const navigate = useNavigate();
  const prediction = useMemo(() => buildPrediction(expenses), [expenses]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatbotLanguage, setChatbotLanguage] = useState("roman-ur");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [flashFirst, setFlashFirst] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [cardMessage, setCardMessage] = useState("");
  const [cardMessageType, setCardMessageType] = useState("info");
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "Food", date: "", amount: "" });
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    cnic: user.cnic,
    address: user.address,
    occupation: user.occupation,
    dob: user.dob,
    language: user.language,
  });
  const [cardForm, setCardForm] = useState({ holder: "", bank: "", number: "", expiry: "", cvv: "", zip: "" });
  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const monthlySeries = [
    { label: "Jan", value: 12000, x: 20, y: 220 },
    { label: "Feb", value: 17600, x: 130, y: 168 },
    { label: "Mar", value: 15800, x: 255, y: 160 },
    { label: "Apr", value: 21400, x: 385, y: 125 },
    { label: "May", value: 29800, x: 510, y: 80 },
    { label: "Jun", value: 26400, x: 590, y: 110 },
  ];
  const comparisonSeries = [
    { label: "Food", spent: 14800, budget: 18000, color: "blue-fill" },
    { label: "Transport", spent: 9200, budget: 12000, color: "red-fill" },
    { label: "Utilities", spent: 8600, budget: 11000, color: "green-fill" },
  ];

  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      cnic: user.cnic,
      address: user.address,
      occupation: user.occupation,
      dob: user.dob,
      language: user.language,
    });
  }, [user]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory, thinking]);

  useEffect(() => {
    if (chatbotOpen) setUnreadCount(0);
  }, [chatbotOpen]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = chatbotLanguage === "roman-ur" ? "ur-PK" : chatbotLanguage;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (transcript) setChatInput(transcript);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [chatbotLanguage]);

  const initial = user.name.trim().charAt(0).toUpperCase() || "U";
  const addChat = (role, text) => {
    setChatHistory((current) => [...current, { role, text }]);
    if (role === "bot" && !chatbotOpen) {
      setUnreadCount((count) => count + 1);
    }
  };

  const speakReply = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = chatbotLanguage === "roman-ur" ? "ur-PK" : chatbotLanguage;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const answerChat = async (text) => {
    addChat("user", text);
    setThinking(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setThinking(false);
    const reply = buildLocalReply(text, prediction, user, expenses, settings, chatbotLanguage);
    addChat("bot", reply);
    speakReply(reply);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {}
    setIsAuthenticated(false);
    setUser(defaultUser);
    setExpenses(defaultExpenses);
    setCard(defaultCard);
    setSettings(defaultSettings);
    setChatHistory([]);
    navigate("/login");
  };

  const saveExpense = (event) => {
    event.preventDefault();
    if (!expenseForm.title || !expenseForm.date || !expenseForm.amount) return;
    const item = {
      icon: iconByCategory[expenseForm.category] || iconByCategory.Other,
      title: expenseForm.title,
      category: expenseForm.category,
      date: expenseForm.date,
      amount: Number(expenseForm.amount),
      type: "expense",
    };
    setExpenses((current) => [item, ...current]);
    setExpenseForm({ title: "", category: "Food", date: "", amount: "" });
    setFlashFirst(true);
    addChat("bot", `Naya expense "${item.title}" add ho gaya. Updated projection ${formatCurrency(buildPrediction([item, ...expenses]).projectedExpense)} ke qareeb hai.`);
    window.setTimeout(() => setFlashFirst(false), 1200);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setUser((current) => ({ ...current, ...profileForm }));
  };

  const saveCard = (event) => {
    event.preventDefault();
    if (!cardForm.holder || !cardForm.bank || !cardForm.zip) {
      setCardMessageType("error");
      setCardMessage("Please complete all ATM card fields before saving.");
      return;
    }
    if (onlyDigits(cardForm.number).length < 16) {
      setCardMessageType("error");
      setCardMessage("Card number must be 16 digits.");
      return;
    }
    if (cardForm.expiry.length < 5) {
      setCardMessageType("error");
      setCardMessage("Expiry date should be in MM/YY format.");
      return;
    }
    if (cardForm.cvv.length < 3) {
      setCardMessageType("error");
      setCardMessage("CVV should be 3 digits.");
      return;
    }
    setCard({
      holder: cardForm.holder,
      bank: cardForm.bank,
      number: maskCardNumber(cardForm.number),
      expiry: cardForm.expiry,
      cvvMasked: cardForm.cvv.replace(/\d/g, "*"),
    });
    setCardForm({ holder: user.name || "", bank: "", number: "", expiry: "", cvv: "", zip: "" });
    setCardMessageType("success");
    setCardMessage("ATM / debit card added successfully and secure preview updated.");
  };

  const downloadReport = () => {
    const recent = expenses
      .slice(0, 8)
      .map((item, index) => `${index + 1}. ${item.title} | ${item.category} | ${item.date} | ${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount)}`)
      .join("\n");
    const report = [
      "AI PERSONAL FINANCE REPORT",
      "==========================",
      `Generated: ${new Date().toLocaleString("en-PK")}`,
      `Name: ${user.name}`,
      `Email: ${user.email}`,
      `Income: ${formatCurrency(prediction.income)}`,
      `Expense: ${formatCurrency(prediction.expense)}`,
      `Savings: ${formatCurrency(prediction.savings)}`,
      "",
      "Recent Transactions",
      recent,
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-finance-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h1>AI Personal Finance</h1>
        <nav className="sidebar-nav dashboard-nav">
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#wallet">Wallet</a>
          <a href="#transactions">Transactions</a>
          <a href="#reports">Report</a>
          <a href="#settings">Settings</a>
          <a href="#user-account">User Account</a>
          <a href="#analytical">Analytics</a>
          <button className="sidebar-logout-btn" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Logout"}</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar" id="dashboard">
          <div className="dashboard-heading"><p className="dashboard-kicker">Overview</p><h2>Welcome back, {user.name}</h2></div>
          <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
            <button className="profile-pill profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}><div className="profile-avatar"></div><span>{user.name.split(" ")[0]}</span></button>
            {!profileOpen ? null : <div className="profile-dropdown"><div className="profile-dropdown-head"><div className="profile-avatar small">{initial}</div><div><strong>{user.name}</strong><p>{user.email}</p></div></div><div className="profile-dropdown-links"><a href="#user-account">My Profile</a><a href="#settings">Security & Settings</a><a href="#card-form">Linked Cards</a><a href="#analytical">Insights</a><button type="button" onClick={handleLogout}>{loggingOut ? "Logging out..." : "Logout"}</button></div></div>}
          </div>
        </header>

        <section className="stats-row"><article className="stat-card"><p>Total Income</p><strong>{formatCurrency(prediction.income)}</strong></article><article className="stat-card"><p>Total Expense</p><strong>{formatCurrency(prediction.expense)}</strong></article><article className="stat-card"><p>Savings</p><strong>{formatCurrency(prediction.savings)}</strong></article></section>
        <section className="dashboard-card quick-grid" id="wallet"><article className="quick-card"><div className="quick-icon">WA</div><div><p>Wallet Balance</p><strong>{formatCurrency(Math.max(prediction.savings, 0))}</strong></div></article><article className="quick-card"><div className="quick-icon">CA</div><div><p>Cards Active</p><strong>{card?.number ? "01 Linked Card" : "00 Linked Cards"}</strong></div></article><article className="quick-card"><div className="quick-icon">GO</div><div><p>Goal Progress</p><strong>76% Completed</strong></div></article></section>
        <section className="dashboard-card chart-wrap" id="transactions"><div className="card-header two-col"><h2>Monthly Expense</h2><h2>Category Wise Expense</h2></div><div className="chart-grid"><div className="line-chart"><div className="y-axis"><span>PKR 35,000</span><span>PKR 30,000</span><span>PKR 25,000</span><span>PKR 20,000</span><span>PKR 10,000</span></div><div className="line-chart-stack"><div className="chart-metrics"><div className="chart-metric-card"><span>Projected</span><strong>{formatCurrency(prediction.projectedExpense)}</strong></div><div className="chart-metric-card"><span>Possible Save</span><strong>{formatCurrency(prediction.possibleSaving)}</strong></div><div className="chart-metric-card"><span>Top Category</span><strong>{prediction.topCategory}</strong></div></div><div className="plot-area"><div className="chart-summary-pill"><span>Current Spend</span><strong>{formatCurrency(prediction.expense)}</strong></div><svg viewBox="0 0 600 260" preserveAspectRatio="none"><defs><linearGradient id="expenseAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4a87ff" stopOpacity="0.3"></stop><stop offset="100%" stopColor="#4a87ff" stopOpacity="0.02"></stop></linearGradient></defs><path className="area-path" d="M20 220 C65 220, 85 155, 130 168 S210 225, 255 160 S340 115, 385 125 S465 35, 510 80 S565 155, 590 110 L590 260 L20 260 Z" /><path className="line-path" d="M20 220 C65 220, 85 155, 130 168 S210 225, 255 160 S340 115, 385 125 S465 35, 510 80 S565 155, 590 110" /><g className="point-group">{monthlySeries.map((point, index) => <g key={point.label}><circle cx={point.x} cy={point.y} r={index === monthlySeries.length - 1 ? 6 : 5}></circle><text className="point-value-label" x={point.x} y={point.y - 14}>{Math.round(point.value / 1000)}k</text></g>)}</g></svg><div className="x-axis">{monthlySeries.map((point) => <span key={point.label}>{point.label}</span>)}</div></div><div className="mini-compare-chart"><div className="mini-compare-head"><span>Monthly Compare</span><strong>Spent vs Target</strong></div><div className="mini-bars">{monthlySeries.map((point, index) => <div className="mini-bar-col" key={point.label}><div className="mini-bar-track"><div className={`mini-bar-fill ${index >= monthlySeries.length - 2 ? "mini-bar-fill-accent" : ""}`} style={{ height: `${Math.max(24, Math.round((point.value / 32000) * 100))}%` }}></div></div><small>{point.label}</small></div>)}</div></div></div></div><div className="category-chart-wrap"><div className="category-chart-card"><div className="category-chart-top"><span>Top Categories</span><strong>Expense Split</strong></div><div className="category-bars"><div className="category-bar-card"><div className="category-bar-head"><span>Food</span><strong>37%</strong></div><div className="category-track"><div className="category-fill blue-fill" style={{ width: "88%" }}></div></div><small>Dining, groceries, cafe</small></div><div className="category-bar-card"><div className="category-bar-head"><span>Transport</span><strong>23%</strong></div><div className="category-track"><div className="category-fill red-fill" style={{ width: "62%" }}></div></div><small>Fuel and ride costs</small></div><div className="category-bar-card"><div className="category-bar-head"><span>Utilities</span><strong>22%</strong></div><div className="category-track"><div className="category-fill green-fill" style={{ width: "58%" }}></div></div><small>Bills and monthly services</small></div></div></div><div className="category-summary">{comparisonSeries.map((item) => <div className="legend-item comparison-legend-item" key={item.label}><div><strong>{item.label}</strong><span>{formatCurrency(item.spent)} spent from {formatCurrency(item.budget)} budget</span></div><span className={`comparison-badge ${item.color}`}>{Math.round((item.spent / item.budget) * 100)}%</span></div>)}</div></div></div></section>        <section className="dashboard-card bars-card" id="reports"><div className="card-header section-inline"><div><h2>Budget vs. Spending Report</h2><p className="report-subtext">Download a full finance summary based on your current dashboard data.</p></div><button className="btn btn-primary report-download-btn" type="button" onClick={downloadReport}>Download Report</button></div><div className="double-panels"><div className="budget-panel"><h2>Budget vs. Spending</h2><div className="hbar-group"><span>Transportation</span><div className="bar-track"><div className="fill red-fill" style={{ width: "58%" }}></div></div></div><div className="hbar-group"><span>Food</span><div className="bar-track"><div className="fill green-fill" style={{ width: "84%" }}></div></div></div><div className="range-labels"><span>0</span><span>PKR 5,000</span><span>PKR 20,000</span></div></div><div className="budget-panel"><h2>Budget vs. Spending</h2><div className="hbar-group"><span>Transportation</span><div className="bar-track"><div className="fill red-fill" style={{ width: "70%" }}></div></div></div><div className="hbar-group"><span>Food</span><div className="bar-track"><div className="fill green-fill" style={{ width: "92%" }}></div></div></div><div className="range-labels"><span>PKR</span><span>PKR 15,000</span><span>PKR 20,000</span></div></div></div></section>        <section className="dashboard-split"><section className="dashboard-card transaction-panel"><div className="card-header section-inline"><h2>Recent Transactions</h2><a className="view-link" href="#transactions">View All</a></div><div className="transaction-list">{expenses.map((item, index) => <article className={`transaction-item ${index === 0 && flashFirst ? "flash-new" : ""}`} key={`${item.title}-${item.date}-${index}`}><div className="transaction-main"><span className="transaction-icon">{item.icon}</span><div><strong>{item.title}</strong><p>{item.category}</p></div></div><div className="transaction-meta"><span>{item.date}</span><strong className={item.type === "income" ? "positive" : "negative"}>{item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}</strong></div></article>)}</div></section><section className="dashboard-card ai-panel" id="analytical"><div className="card-header section-inline"><h2>AI Features</h2><span className="ai-pill">Smart Analysis</span></div><div className="insight-list"><article className="insight-card"><div className="insight-icon">SI</div><div><strong>Spending Trend</strong><p>Your spending has increased by 8.2% compared to last month. Focus on dining out expenses.</p></div></article><article className="insight-card"><div className="insight-icon">BA</div><div><strong>Budget Alert</strong><p>You've reached 82% of your monthly food budget. Only PKR 27.21 left for the rest of the month.</p></div></article><article className="insight-card"><div className="insight-icon">SG</div><div><strong>Savings Goal</strong><p>Keep up the pace! You're on track to save PKR 1,200 this month. Great job!</p></div></article><article className="insight-card"><div className="insight-icon">IO</div><div><strong>Income Opportunity</strong><p>Your average income is growing. Consider this for budgeting next quarter.</p></div></article></div></section></section>        <section className="dashboard-split"><section className="dashboard-card manual-entry-panel"><div className="card-header section-inline"><h2>Manual Expense Add</h2><span className="status-badge light">Live Update</span></div><form className="expense-form" onSubmit={saveExpense}><label>Expense Title<input value={expenseForm.title} onChange={(e) => setExpenseForm((s) => ({ ...s, title: e.target.value }))} type="text" required /></label><label>Category<select value={expenseForm.category} onChange={(e) => setExpenseForm((s) => ({ ...s, category: e.target.value }))}><option>Food</option><option>Utilities</option><option>Transportation</option><option>Shopping</option><option>Health</option><option>Other</option></select></label><label>Date<input value={expenseForm.date} onChange={(e) => setExpenseForm((s) => ({ ...s, date: e.target.value }))} type="date" required /></label><label>Amount<input value={expenseForm.amount} onChange={(e) => setExpenseForm((s) => ({ ...s, amount: e.target.value }))} type="number" min="1" step="0.01" required /></label><button className="btn btn-primary auth-submit" type="submit">Add Expense</button></form></section><section className="dashboard-card account-panel"><div className="card-header section-inline"><h2>Quick Note</h2><span className="ai-pill">Manual Tracking</span></div><div className="account-grid single-column"><div className="account-box"><p>How it works</p><strong>New expense recent transactions list ke top par add hoga.</strong></div><div className="account-box"><p>Auto update</p><strong>Total Expense aur Savings amount turant refresh ho jayegi.</strong></div></div></section></section>
        <section className="dashboard-split account-section-wrap"><section className="dashboard-card account-panel" id="user-account"><div className="card-header section-inline"><h2>User Account</h2><span className="status-badge">Verified</span></div><div className="profile-banner"><div className="profile-summary"><div className="profile-avatar large">{initial}</div><div><h3>{user.name}</h3><p>{user.email}</p><span className="mini-status">Premium Member since {user.memberSince}</span></div></div><div className="security-chip">2-Step Verification Active</div></div><div className="account-grid"><div className="account-box"><p>Phone Number</p><strong>{user.phone}</strong></div><div className="account-box"><p>CNIC / ID</p><strong>{user.cnic}</strong></div><div className="account-box"><p>Address</p><strong>{user.address}</strong></div><div className="account-box"><p>Last Login</p><strong>{user.lastLogin}</strong></div></div><div className="detail-grid"><div className="detail-card"><h3>Profile Details</h3><div className="detail-line"><span>Full Name</span><strong>{user.name}</strong></div><div className="detail-line"><span>Date of Birth</span><strong>{user.dob}</strong></div><div className="detail-line"><span>Occupation</span><strong>{user.occupation}</strong></div><div className="detail-line"><span>Preferred Currency</span><strong>{user.currency}</strong></div></div><div className="detail-card"><h3>Account Security</h3><div className="detail-line"><span>Password Status</span><strong>Updated 10 days ago</strong></div><div className="detail-line"><span>Recovery Email</span><strong>backup@aifinance.com</strong></div><div className="detail-line"><span>Device Trust</span><strong>3 trusted devices</strong></div><div className="detail-line"><span>Security Score</span><strong>92 / 100</strong></div></div><div className="detail-card"><h3>Preferences</h3><div className="detail-line"><span>Language</span><strong>{user.language}</strong></div><div className="detail-line"><span>Alerts</span><strong>Enabled</strong></div><div className="detail-line"><span>Weekly Reports</span><strong>Every Sunday</strong></div><div className="detail-line"><span>Theme</span><strong>Light Dashboard</strong></div></div></div><div className="account-edit-panel"><div className="card-header section-inline"><h3>Edit Profile</h3><span className="status-badge light">Saved Locally</span></div><form className="expense-form profile-form" onSubmit={saveProfile}><label>Full Name<input value={profileForm.name} onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))} type="text" /></label><label>Email<input value={profileForm.email} onChange={(e) => setProfileForm((s) => ({ ...s, email: e.target.value }))} type="email" /></label><label>Phone Number<input value={profileForm.phone} onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))} type="text" /></label><label>CNIC / ID<input value={profileForm.cnic} onChange={(e) => setProfileForm((s) => ({ ...s, cnic: e.target.value }))} type="text" /></label><label>Address<input value={profileForm.address} onChange={(e) => setProfileForm((s) => ({ ...s, address: e.target.value }))} type="text" /></label><label>Occupation<input value={profileForm.occupation} onChange={(e) => setProfileForm((s) => ({ ...s, occupation: e.target.value }))} type="text" /></label><label>Date of Birth<input value={profileForm.dob} onChange={(e) => setProfileForm((s) => ({ ...s, dob: e.target.value }))} type="text" /></label><label>Language<input value={profileForm.language} onChange={(e) => setProfileForm((s) => ({ ...s, language: e.target.value }))} type="text" /></label><button className="btn btn-primary auth-submit" type="submit">Save Profile</button></form></div></section><div className="settings-stack"><section className="dashboard-card settings-panel" id="settings"><div className="card-header section-inline"><h2>Settings</h2><span className="status-badge light">Updated</span></div><div className="settings-list"><div className="setting-row"><span>Email Notifications</span><button className={`toggle-btn ${settings.emailNotifications ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, emailNotifications: !current.emailNotifications }))}>{settings.emailNotifications ? "On" : "Off"}</button></div><div className="setting-row"><span>Monthly Budget Alerts</span><button className={`toggle-btn ${settings.budgetAlerts ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, budgetAlerts: !current.budgetAlerts }))}>{settings.budgetAlerts ? "On" : "Off"}</button></div><div className="setting-row"><span>Dark Summary Reports</span><button className={`toggle-btn ${settings.darkReports ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, darkReports: !current.darkReports }))}>{settings.darkReports ? "On" : "Off"}</button></div></div><div className="settings-security"><div className="security-item"><span>Login Alerts</span><strong>Enabled for every new device</strong></div><div className="security-item"><span>Data Privacy</span><strong>Account info stays masked in card preview</strong></div></div></section><section className="dashboard-card settings-panel settings-support-card"><div className="card-header section-inline"><h2>Security Status</h2><span className="status-badge">Protected</span></div><div className="account-grid single-column"><div className="account-box"><p>Trusted Device</p><strong>This browser session is marked as secure.</strong></div><div className="account-box"><p>Backup Reminder</p><strong>Review profile, card details, and downloaded reports weekly.</strong></div><div className="account-box"><p>Quick Help</p><strong>Keep budget alerts on and update your password regularly for safer usage.</strong></div></div></section></div></section>
        <section className="dashboard-split"><section className="dashboard-card card-management-panel"><div className="card-header section-inline"><h2>Add ATM / Debit Card</h2><span className="status-badge light">Secure Card Vault</span></div><div className="card-intro-strip"><div><strong>Card Setup</strong><span>Add a secure card for demo wallet access and preview.</span></div><div><strong>Masked Preview</strong><span>Only the last digits are visible after save.</span></div></div><form className="expense-form card-form" id="card-form" onSubmit={saveCard}><label>Card Holder Name<input value={cardForm.holder} onChange={(e) => setCardForm((s) => ({ ...s, holder: e.target.value }))} type="text" placeholder="Enter account holder name" required /></label><label>Bank Name<input value={cardForm.bank} onChange={(e) => setCardForm((s) => ({ ...s, bank: e.target.value }))} type="text" placeholder="Example: HBL, Meezan, UBL" required /></label><label>Card Number<input value={cardForm.number} onChange={(e) => setCardForm((s) => ({ ...s, number: onlyDigits(e.target.value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim() }))} type="text" inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" required /></label><label>Expiry Date<input value={cardForm.expiry} onChange={(e) => { const digits = onlyDigits(e.target.value).slice(0, 4); setCardForm((s) => ({ ...s, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits })); }} type="text" inputMode="numeric" maxLength={5} placeholder="MM/YY" required /></label><label>CVV<input value={cardForm.cvv} onChange={(e) => setCardForm((s) => ({ ...s, cvv: onlyDigits(e.target.value).slice(0, 3) }))} type="password" inputMode="numeric" maxLength={3} placeholder="123" required /></label><label>Billing Zip<input value={cardForm.zip} onChange={(e) => setCardForm((s) => ({ ...s, zip: e.target.value }))} type="text" placeholder="54000" required /></label>{cardMessage ? <small className={`field-helper ${cardMessageType === "error" ? "error" : "success"}`}>{cardMessage}</small> : <small className="field-helper">Tip: card number 16 digits, expiry MM/YY, and CVV 3 digits rakhein.</small>}<button className="btn btn-primary auth-submit" type="submit">Add Secure Card</button></form></section><section className="dashboard-card saved-card-panel"><div className="card-header section-inline"><h2>Linked ATM Card</h2><span className="security-chip">Encrypted</span></div><div className="atm-card"><div className="atm-card-top"><div><span>{card.bank || "AI Personal Finance"}</span><strong>Debit Card</strong></div><span className="atm-network">VISA</span></div><div className="atm-chip"></div><strong>{card.number}</strong><div className="atm-card-bottom"><div><span>Card Holder</span><strong>{card.holder}</strong></div><div><span>Expiry</span><strong>{card.expiry}</strong></div></div></div><div className="card-highlight-row"><div className="account-box"><p>Linked Bank</p><strong>{card.bank}</strong></div><div className="account-box"><p>Security</p><strong>Masked and encrypted preview</strong></div></div><div className="card-security-list"><div className="security-item"><span>Card Status</span><strong>{card.bank} card added with masked number and profile binding</strong></div><div className="security-item"><span>CVV Storage</span><strong>CVV hidden ({card.cvvMasked}) and protected for secure preview only</strong></div><div className="security-item"><span>Security Layer</span><strong>OTP + masked digits + manual verification</strong></div></div></section></section>
        <div className="floating-chatbot">
          {chatbotOpen ? (
            <div className="chatbot-widget">
              <div className="chatbot-widget-head">
                <div className="chatbot-title-block">
                  <span className="chatbot-brand-icon">AI</span>
                  <div>
                    <strong>AI Finance Chatbot</strong>
                    <p>Predict expense, savings, and budget</p>
                  </div>
                </div>
                <div className="chatbot-head-controls">
                  <div className="chatbot-head-actions">
                    <button type="button" className="chatbot-mini-btn" onClick={() => setChatHistory([])}>Clear</button>
                    <select className="chatbot-select" value={chatbotLanguage} onChange={(e) => setChatbotLanguage(e.target.value)}>
                      {chatbotLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
                    </select>
                    <button type="button" className={`chatbot-mini-btn ${voiceEnabled ? "active" : ""}`} onClick={() => setVoiceEnabled((value) => !value)}>Voice</button>
                  </div>
                  <button type="button" className="chatbot-close" onClick={() => setChatbotOpen(false)} aria-label="Close chatbot">Close</button>
                </div>
              </div>
              <div className="chatbot-window compact">
                <div className="chatbot-messages" ref={messagesRef}>
                  {chatHistory.map((item, index) => <div className={`chatbot-message ${item.role}`} key={`${item.role}-${index}`}>{item.text}</div>)}
                  {thinking ? <div className="chatbot-message bot"><span className="typing-dots"><span></span><span></span><span></span></span></div> : null}
                </div>
                <div className="chatbot-actions">
                  <button className="chatbot-chip" type="button" onClick={() => answerChat("Predict my next month expense")}>Predict</button>
                  <button className="chatbot-chip" type="button" onClick={() => answerChat("How much can I save next month?")}>Save</button>
                  <button className="chatbot-chip" type="button" onClick={() => answerChat("Which category is spending the most?")}>Category</button>
                </div>
                <form className="chatbot-form" onSubmit={(e) => { e.preventDefault(); if (!chatInput.trim()) return; answerChat(chatInput.trim()); setChatInput(""); }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask anything about expenses..." required />
                  <button
                    type="button"
                    className={`chatbot-mic ${listening ? "active" : ""}`}
                    onClick={() => {
                      const recognition = recognitionRef.current;
                      if (!recognition) return;
                      if (listening) recognition.stop();
                      else recognition.start();
                    }}
                  >
                    Mic
                  </button>
                  <button className="btn btn-primary chatbot-send" type="submit">Send</button>
                </form>
              </div>
            </div>
          ) : null}
          <button type="button" className="chatbot-launcher" onClick={() => setChatbotOpen((value) => !value)}>
            <span className="chatbot-launcher-icon">AI</span>
            <span>Chatbot</span>
            {unreadCount > 0 ? <span className="chatbot-badge">{unreadCount}</span> : null}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;



