import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

const STORAGE_KEYS = {
  user: "ai_finance_user",
  expenses: "ai_finance_expenses",
  card: "ai_finance_card",
  settings: "ai_finance_settings",
  chat: "ai_finance_chat",
};

const defaultUser = {
  name: "Muhammad  Hamid ",
  email: "HamidSidhu@email.com",
  avatar: "",
  phone: "+92 301 2345678",
  cnic: "35202-1234567-1",
  address: "Gulberg, Faisalabad, Pakistan",
  occupation: "Software Engineer",
  dob: "15 Mar 1998",
  language: "English",
  memberSince: "March 2024",
  currency: "PKR",
  lastLogin: "2026-04-28 10:30 AM",
};

const defaultExpenses = [
  { icon: "FD", title: "Grocery Shopping - HyperMart", category: "Food", date: "2026-04-25", amount: 2850.50, type: "expense" },
  { icon: "IN", title: "Monthly Salary", category: "Income", date: "2026-04-01", amount: 85000, type: "income" },
  { icon: "UT", title: "Electricity Bill - LESCO", category: "Utilities", date: "2026-04-20", amount: 4200, type: "expense" },
  { icon: "TR", title: "Uber Ride to Office", category: "Transportation", date: "2026-04-24", amount: 450, type: "expense" },
  { icon: "FD", title: "Lunch at Food Court", category: "Food", date: "2026-04-24", amount: 320, type: "expense" },
  { icon: "SH", title: "New Laptop Bag", category: "Shopping", date: "2026-04-22", amount: 2500, type: "expense" },
  { icon: "HL", title: "Doctor Consultation", category: "Health", date: "2026-04-18", amount: 1500, type: "expense" },
  { icon: "UT", title: "Internet Bill - PTCL", category: "Utilities", date: "2026-04-15", amount: 2800, type: "expense" },
  { icon: "TR", title: "Fuel for Car", category: "Transportation", date: "2026-04-12", amount: 3500, type: "expense" },
  { icon: "FD", title: "Dinner at Restaurant", category: "Food", date: "2026-04-10", amount: 1200, type: "expense" },
];

const defaultCard = {
  holder: "Ahmed Khan",
  bank: "Habib Bank Limited",
  number: "**** **** **** 4567",
  expiry: "12/28",
  cvvMasked: "***",
  brand: "VISA",
  balance: 127350,
};

const emptyCard = {
  holder: "",
  bank: "",
  number: "",
  expiry: "",
  cvvMasked: "***",
  brand: "Secure",
  balance: 0,
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
  Entertainment: "EN",
  Education: "ED",
  Insurance: "IN",
  Other: "OT",
};

const initialExpenseForm = {
  title: "",
  category: "Food",
  date: "",
  amount: "",
  method: "Cash",
  merchant: "",
  note: "",
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

const testimonials = [
  {
    quote: "This dashboard made expense tracking feel simple. I can actually see where my money goes and what to improve next month.",
    name: "Areeba Khan",
    role: "Student User",
  },
  {
    quote: "The AI predictor and reports section make the whole project feel like a proper real product instead of a static demo.",
    name: "Usman Tariq",
    role: "Finance Reviewer",
  },
  {
    quote: "Card management, profile settings, and dashboard insights all connect nicely. It feels polished and presentation ready.",
    name: "Sana Javed",
    role: "Project Evaluator",
  },
];

const authSlides = [
  {
    eyebrow: "Smart Tracking",
    title: "Watch your monthly spending like a live finance studio.",
    text: "Monitor expenses, compare categories, and stay clear about where your money is going.",
    theme: "expenses",
    code: "TR",
    stat: "PKR 24,359",
    note: "Current balance",
    previewA: { label: "Wallet", value: "PKR 18k saved" },
    previewB: { label: "Budget", value: "Food 82% used" },
  },
  {
    eyebrow: "AI Prediction",
    title: "Get forecast-style insights before your next month starts.",
    text: "Predict future expense trends, spot risky categories, and improve savings planning faster.",
    theme: "prediction",
    code: "AI",
    stat: "82%",
    note: "Budget accuracy",
    previewA: { label: "Forecast", value: "Next month PKR 34k" },
    previewB: { label: "Insight", value: "Dining can be reduced" },
  },
  {
    eyebrow: "Secure Finance",
    title: "Keep accounts, cards, and reports in one secure personal dashboard.",
    text: "From login to report download and chatbot guidance, everything stays connected in one flow.",
    theme: "security",
    code: "SC",
    stat: "01 Linked",
    note: "Protected ATM card",
    previewA: { label: "Card", value: "1 ATM linked safely" },
    previewB: { label: "Report", value: "Ready for download" },
  },
];

const chatbotLanguages = [
  { label: "Roman Urdu", value: "roman-ur" },
  { label: "English", value: "en-US" },
  { label: "Urdu", value: "ur-PK" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Arabic", value: "ar-SA" },
  { label: "Turkish", value: "tr-TR" },
  { label: "French", value: "fr-FR" },
  { label: "Spanish", value: "es-ES" },
];

const bankOptions = [
  "Habib Bank Limited (HBL)",
  "Meezan Bank",
  "United Bank Limited (UBL)",
  "MCB Bank",
  "Allied Bank Limited (ABL)",
  "Bank Alfalah",
  "Faysal Bank",
  "Askari Bank",
  "Standard Chartered",
  "Bank Al Habib",
  "Habib Metropolitan Bank",
  "JS Bank",
  "Summit Bank",
  "Soneri Bank",
  "Dubai Islamic Bank",
  "BankIslami",
  "Silkbank",
  "National Bank of Pakistan (NBP)",
  "The Bank of Punjab",
  "Sindh Bank",
  "BOK - Bank of Khyber",
  "Balochistan Bank",
  "Samba Bank",
  "Mobilink Microfinance Bank",
  "Khushhali Microfinance Bank",
  "U Microfinance Bank",
  "NRSP Microfinance Bank",
  "FINCA Microfinance Bank",
  "Other",
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

function detectCardBrand(number) {
  const digits = onlyDigits(number);
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Secure";
}

function isExpiryValid(expiry) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
  const [month, year] = expiry.split("/").map(Number);
  if (month < 1 || month > 12) return false;
  const fullYear = 2000 + year;
  const expiryDate = new Date(fullYear, month, 0, 23, 59, 59);
  return expiryDate >= new Date();
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

function buildExpenseInsights(expenses, prediction) {
  const expenseOnly = expenses.filter((item) => item.type !== "income");
  const totalExpense = prediction.expense || 0;
  const avgExpense = expenseOnly.length ? totalExpense / expenseOnly.length : 0;
  const latestExpense = expenseOnly[0] || null;
  const categoryTotals = expenseOnly.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const secondCategory = sortedCategories[1]?.[0] || "Utilities";
  const topShare = totalExpense ? Math.round((prediction.topCategoryAmount / totalExpense) * 100) : 0;

  return {
    expenseOnly,
    avgExpense,
    latestExpense,
    sortedCategories,
    secondCategory,
    topShare,
  };
}

function buildLocalReply(message, prediction, user, expenses, settings, languageMode = "roman-ur") {
  const prompt = message.toLowerCase();
  const recentExpenseCount = expenses.filter((item) => item.type !== "income").length;
  const alerts = [];
  const english = ["en-US", "fr-FR", "es-ES", "tr-TR"].includes(languageMode);
  const urdu = ["ur-PK", "hi-IN", "ar-SA"].includes(languageMode);
  const { avgExpense, latestExpense, secondCategory, topShare } = buildExpenseInsights(expenses, prediction);

  if (settings.budgetAlerts) alerts.push("budget alerts on hain");
  if (settings.emailNotifications) alerts.push("email notifications active hain");

  if (english) {
    if (/summary|status|overview/.test(prompt)) return `Current income is ${formatCurrency(prediction.income)}, total expense is ${formatCurrency(prediction.expense)}, and savings are ${formatCurrency(prediction.savings)}. ${prediction.topCategory} is your top category at about ${topShare}% of spending.`;
    if (/save|saving/.test(prompt)) return `Based on your current pattern, you could save about ${formatCurrency(prediction.possibleSaving)} next month if you reduce ${prediction.topCategory} spending and follow a weekly limit.`;
    if (/predict|forecast|next|expense/.test(prompt)) return `Based on your latest ${recentExpenseCount} expense records, your next month expense may land around ${formatCurrency(prediction.projectedExpense)}. With tighter ${prediction.topCategory} control, you may bring it closer to ${formatCurrency(prediction.safeBudget)}.`;
    if (/category|most|highest/.test(prompt)) return `${prediction.topCategory} is currently your highest spending category at around ${formatCurrency(prediction.topCategoryAmount)}. That is the best place to cut costs first.`;
    if (/budget|plan|limit/.test(prompt)) return `A practical next-month budget would be around ${formatCurrency(prediction.safeBudget)}. Set a strict cap for ${prediction.topCategory} and review spending weekly.`;
    if (/recent|last|latest/.test(prompt)) return latestExpense ? `Your latest tracked expense is "${latestExpense.title}" in ${latestExpense.category} for ${formatCurrency(latestExpense.amount)} on ${latestExpense.date}. Average expense entry is around ${formatCurrency(avgExpense)}.` : `You do not have a recent expense yet. Add a few transactions and I can summarize them for you.`;
    if (/advice|improve|reduce/.test(prompt)) return `Best improvement point is ${prediction.topCategory}, then ${secondCategory}. Try reducing ${prediction.topCategory} by about 10% and keep total spending near ${formatCurrency(prediction.safeBudget)} for a better savings result.`;
    if (/settings|alerts|notification/.test(prompt)) return `Your current app setup shows ${alerts.join(" and ") || "basic alerts turned off"}. Keeping budget alerts on will help your predictions stay useful.`;
    if (/hello|hi/.test(prompt)) return `Hi ${user.name}. I'm your finance predictor chatbot. You can ask me about next month expense, savings, budget planning, or your top spending category.`;
    return `Your current total expense is ${formatCurrency(prediction.expense)} and your projected next month expense is around ${formatCurrency(prediction.projectedExpense)}.`;
  }

  if (urdu) {
    if (/summary|status|overview|khulasa|summary/.test(prompt)) return `Aap ki current income ${formatCurrency(prediction.income)}, total expense ${formatCurrency(prediction.expense)}, aur savings ${formatCurrency(prediction.savings)} hain. ${prediction.topCategory} sab se badi category hai jo taqreeban ${topShare}% spending leti hai.`;
    if (/save|saving|bacha/.test(prompt)) return `Aap ke current pattern ke mutabiq agar aap ${prediction.topCategory} category ko kam karein to aglay mahinay takreeban ${formatCurrency(prediction.possibleSaving)} bacha saktay hain.`;
    if (/predict|forecast|next|agla|expense/.test(prompt)) return `Aap ke recent ${recentExpenseCount} expense records ko dekh kar andaza hai ke aglay mahinay aap ka kharcha ${formatCurrency(prediction.projectedExpense)} ke qareeb ho sakta hai.`;
    if (/category|most|highest|sab se zyada/.test(prompt)) return `Filhal sab se zyada kharcha ${prediction.topCategory} category mein ho raha hai, jo taqreeban ${formatCurrency(prediction.topCategoryAmount)} hai.`;
    if (/budget|plan|limit/.test(prompt)) return `Aap ke liye ek munaasib working budget ${formatCurrency(prediction.safeBudget)} ho sakta hai. ${prediction.topCategory} par sakht limit lagana behtar rahega.`;
    if (/recent|latest|last|akhri|recent/.test(prompt)) return latestExpense ? `Aap ka latest tracked expense "${latestExpense.title}" hai jo ${latestExpense.category} mein ${formatCurrency(latestExpense.amount)} ka tha, date ${latestExpense.date}. Average expense entry takreeban ${formatCurrency(avgExpense)} hai.` : `Abhi recent expense data maujood nahi hai. Kuch transactions add karein phir main better summary de sakta hoon.`;
    if (/advice|improve|reduce|mashwara/.test(prompt)) return `Sab se pehle ${prediction.topCategory} aur phir ${secondCategory} ko control karna behtar rahega. Agar aap ${prediction.topCategory} ko 10% kam kar dein to savings aur budget dono improve ho saktay hain.`;
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

  if (/summary|status|overview|khulasa/.test(prompt)) {
    return `Current income ${formatCurrency(prediction.income)}, total expense ${formatCurrency(prediction.expense)}, aur savings ${formatCurrency(prediction.savings)} hain. ${prediction.topCategory} top category hai aur is ka share takreeban ${topShare}% hai.`;
  }

  if (/recent|latest|last|akhri/.test(prompt)) {
    return latestExpense
      ? `Latest transaction "${latestExpense.title}" thi jo ${latestExpense.category} mein ${formatCurrency(latestExpense.amount)} ki record hui. Average expense entry ${formatCurrency(avgExpense)} ke qareeb hai.`
      : `Abhi recent expense entries nahi hain. Kuch transactions add karo phir main proper summary de sakta hoon.`;
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
  const hasExpenses = expenses.some((item) => item.type !== "income");
  return [
    {
      role: "bot",
      text: hasExpenses
        ? `Salam ${user.name}. Main aap ka free local AI-style finance predictor hoon. Current data ke mutabiq next month projected expense ${formatCurrency(prediction.projectedExpense)} hai.`
        : `Salam ${user.name}. Main aap ka finance assistant hoon. Abhi dashboard reset hai, is liye values zero hain. Aap new expenses add kar ke fresh planning start kar saktay hain.`,
    },
  ];
}

function resolveSpeechLang(languageMode) {
  if (languageMode === "roman-ur") return "ur-PK";
  return languageMode;
}

function App() {
  const [user, setUser] = usePersistentState(STORAGE_KEYS.user, defaultUser);
  const [expenses, setExpenses] = usePersistentState(STORAGE_KEYS.expenses, defaultExpenses);
  const [card, setCard] = usePersistentState(STORAGE_KEYS.card, defaultCard);
  const [settings, setSettings] = usePersistentState(STORAGE_KEYS.settings, defaultSettings);
  const [chatHistory, setChatHistory] = usePersistentState(STORAGE_KEYS.chat, []);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = usePersistentState("app_theme", "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      <Route path="/" element={<LandingPage theme={theme} setTheme={setTheme} />} />
      <Route path="/login" element={<AuthPage mode="login" user={user} setUser={setUser} setExpenses={setExpenses} setCard={setCard} setSettings={setSettings} setChatHistory={setChatHistory} setIsAuthenticated={setIsAuthenticated} />} />
      <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
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

function LandingPage({ theme, setTheme }) {
  usePageMeta("AI Personal Finance | Smart Decisions", "landing-page");
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    AOS.init({
      duration: 850,
      easing: "ease-out-cubic",
      once: true,
      offset: 70,
      mirror: false,
      anchorPlacement: "top-bottom",
    });
    AOS.refresh();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % 3);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="page-shell">
      <header className="finance-nav landing-reveal landing-reveal-nav" data-aos="fade-down" data-aos-duration="900">
        <a className="brand finance-brand" href="#home">
          <span className="brand-mark">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="16" fill="url(#brandGradient)"/>
              <defs>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6"/>
                  <stop offset="100%" stopColor="#1d4ed8"/>
                </linearGradient>
              </defs>
              <circle cx="28" cy="18" r="6" fill="#ffffff" opacity="0.9"/>
              <rect x="16" y="28" width="24" height="2" rx="1" fill="#ffffff" opacity="0.9"/>
              <path d="M20 32v4c0 2 1 3 3 3h10c2 0 3-1 3-3v-4" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
              <rect x="24" y="38" width="3" height="4" rx="1" fill="#ffffff" opacity="0.9"/>
              <rect x="29" y="38" width="3" height="4" rx="1" fill="#ffffff" opacity="0.9"/>
            </svg>
          </span>
          <span className="brand-lockup"><strong className="brand-name">AI Personal Finance</strong><small className="brand-sub">Plan smarter. Spend better.</small></span>
        </a>
        <nav className="nav-links finance-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">About</a><a href="#team">Team</a><a href="#contact">Contact</a></nav>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">
            {theme === "light" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v6M12 17v6M23 12h-6M7 12H1M20.485 3.515l-4.243 4.243M7.758 19.77l-4.243 4.243M20.485 20.485l-4.243-4.243M7.758 7.757L3.515 3.514" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <Link className="btn btn-finance-ghost" to="/login">Login</Link><Link className="btn btn-finance-primary" to="/login?mode=signup">Create Account</Link>
        </div>
      </header>

      <main className="finance-landing">
        <section className={`finance-hero landing-reveal landing-reveal-hero hero-slide-${heroSlide}`} id="home">
          <div className="finance-hero-copy" data-aos="fade-right" data-aos-delay="80">
            <p className="finance-tag">AI Powered Personal Finance</p>
            <h1>See where your money goes before it disappears.</h1>
            <p>Track expenses, manage cards, download reports, and chat with an AI predictor that helps you plan your next month more confidently.</p>
            <div className="hero-actions">
              <Link className="btn btn-finance-primary" to="/login?mode=signup">Start Free</Link>
              <Link className="btn btn-finance-ghost" to="/login">Open Dashboard</Link>
            </div>
            <div className="finance-hero-metrics">
              <div><strong>82%</strong><span>Budget visibility</span></div>
              <div><strong>24/7</strong><span>AI assistant access</span></div>
              <div><strong>1 App</strong><span>All finance tools</span></div>
            </div>
            <div className="hero-slider-dots" aria-hidden="true">
              {[0, 1, 2].map((dot) => <span key={dot} className={heroSlide === dot ? "active" : ""}></span>)}
            </div>
          </div>
          <div className="finance-hero-visual" aria-hidden="true" data-aos="fade-left" data-aos-delay="160">
            <div className="finance-orb finance-orb-a"></div>
            <div className="finance-orb finance-orb-b"></div>
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

        <section className="finance-strip landing-reveal landing-reveal-strip" data-aos="fade-up" data-aos-delay="80">
          <div data-aos="fade-up" data-aos-delay="40"><strong>Expense Tracking</strong><span>Manual + categorized entries</span></div>
          <div data-aos="fade-up" data-aos-delay="120"><strong>AI Prediction</strong><span>Future spend and saving suggestions</span></div>
          <div data-aos="fade-up" data-aos-delay="200"><strong>Secure Access</strong><span>User, settings, cards, reports</span></div>
        </section>

        <section className="finance-section landing-reveal landing-reveal-section" id="features" data-aos="fade-up">
          <div className="finance-section-head" data-aos="fade-up" data-aos-delay="50">
            <p className="finance-tag">Core Features</p>
            <h2>Everything important in one finance workspace.</h2>
          </div>
          <div className="finance-feature-grid">
            <article className="finance-feature-card finance-feature-card-accent" data-aos="fade-up" data-aos-delay="40"><div className="finance-feature-icon">AI</div><h3>AI Finance Predictor</h3><p>Ask the chatbot about next-month expenses, savings opportunities, and top-spending categories.</p></article>
            <article className="finance-feature-card" data-aos="fade-up" data-aos-delay="120"><div className="finance-feature-icon">TR</div><h3>Expense & Transaction Tracking</h3><p>Save daily records, view recent activity, and monitor category-wise spending patterns easily.</p></article>
            <article className="finance-feature-card" data-aos="fade-up" data-aos-delay="200"><div className="finance-feature-icon">RP</div><h3>Reports & Insights</h3><p>Generate downloadable reports and review budget-vs-spending with smarter summaries.</p></article>
            <article className="finance-feature-card" data-aos="fade-up" data-aos-delay="280"><div className="finance-feature-icon">US</div><h3>User Profile & Settings</h3><p>Control account data, notifications, preferences, and security details from one place.</p></article>
          </div>
        </section>

        <section className="finance-section finance-story landing-reveal landing-reveal-section" id="about" data-aos="fade-up">
          <div className="finance-story-copy" data-aos="fade-right" data-aos-delay="60">
            <p className="finance-tag">Why This Project</p>
            <h2>Built for students and users who want finance clarity, not complexity.</h2>
            <p>AI Personal Finance turns scattered personal expense notes into a proper system with login, dashboard, analytics, secure card preview, reports, and a finance chatbot.</p>
            <div className="finance-checks">
              <span>Live dashboard overview</span>
              <span>Manual expense add and update</span>
              <span>Chatbot with multilingual support</span>
            </div>
          </div>
          <div className="finance-story-panel" data-aos="fade-left" data-aos-delay="140">
            <div className="story-card story-card-dark" data-aos="zoom-in" data-aos-delay="180">
              <small>Monthly expense</small>
              <strong>PKR 32,000</strong>
              <p>Tracked through transactions and categories</p>
            </div>
            <div className="story-card" data-aos="zoom-in" data-aos-delay="260">
              <small>Suggested saving</small>
              <strong>PKR 6,400</strong>
              <p>AI recommendation based on current trends</p>
            </div>
          </div>
        </section>

        <section className="finance-section landing-reveal landing-reveal-section" id="team" data-aos="fade-up">
          <div className="finance-section-head center" data-aos="fade-up" data-aos-delay="50">
            <p className="finance-tag">Project Team</p>
            <h2>People behind the platform.</h2>
          </div>
          <div className="finance-team-grid">
            {team.map((member, index) => <article className="finance-team-card" key={member.name} data-aos="fade-up" data-aos-delay={60 + index * 100}><div className="finance-team-avatar">{member.initials}</div><h3>{member.name}</h3><p>{member.role}</p></article>)}
          </div>
        </section>

        <section className="finance-section finance-testimonial-panel landing-reveal landing-reveal-section" data-aos="fade-up">
          <div className="finance-section-head">
            <div data-aos="fade-right" data-aos-delay="60">
              <p className="finance-tag">User Feedback</p>
              <h2>Animated testimonial showcase.</h2>
            </div>
            <div className="testimonial-dots" aria-hidden="true" data-aos="fade-left" data-aos-delay="120">
              {testimonials.map((_, index) => <button key={index} type="button" className={activeTestimonial === index ? "active" : ""} onClick={() => setActiveTestimonial(index)}></button>)}
            </div>
          </div>
          <div className="testimonial-carousel" data-aos="fade-up" data-aos-delay="160">
            <div className="testimonial-track" style={{ transform: `translateX(calc(-${activeTestimonial * 100}% - ${activeTestimonial * 24}px))` }}>
              {testimonials.map((item) => (
                <article className="testimonial-card finance-testimonial-card" key={item.name}>
                  <span className="quote-mark">"</span>
                  <p>{item.quote}</p>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="finance-section finance-end-panel landing-reveal landing-reveal-section" id="contact" data-aos="fade-up">
          <div className="finance-end-copy" data-aos="fade-right" data-aos-delay="60">
            <p className="finance-tag">Ready To Start?</p>
            <h2>Turn your final year project into a finance product that actually feels live.</h2>
            <p>From signup and secure account flow to expense analytics, ATM card preview, report export, and AI guidance, this platform now brings the full journey together in one polished experience.</p>
            <div className="hero-actions">
              <Link className="btn btn-finance-primary" to="/login?mode=signup">Create Account</Link>
              <Link className="btn btn-finance-ghost" to="/login">Login Now</Link>
            </div>
          </div>
          <div className="finance-end-grid" data-aos="fade-left" data-aos-delay="140">
            <article className="finance-end-card finance-end-card-primary" data-aos="zoom-in" data-aos-delay="180">
              <small>Project Outcome</small>
              <strong>Smart Personal Finance Platform</strong>
              <p>Track expenses, manage profiles, secure cards, generate reports, and ask the AI predictor for planning help.</p>
            </article>
            <article className="finance-end-card" data-aos="zoom-in" data-aos-delay="240">
              <small>What Users Get</small>
              <ul className="finance-end-list">
                <li>Live dashboard with PKR analytics</li>
                <li>Manual transaction and expense entry</li>
                <li>Chatbot-based future expense guidance</li>
              </ul>
            </article>
            <article className="finance-end-card" data-aos="zoom-in" data-aos-delay="300">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMode = searchParams.get("mode") === "signup" ? "signup" : mode;
  const isLogin = currentMode === "login";
  usePageMeta(isLogin ? "Login | AI Personal Finance" : "Sign Up | AI Personal Finance", "auth-page");

  useEffect(() => {
    AOS.init({
      duration: 820,
      easing: "ease-out-cubic",
      once: true,
      offset: 40,
      mirror: false,
    });
    AOS.refresh();
  }, [isLogin]);
  const [form, setForm] = useState({ name: user.name, email: user.email, password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [imageSlideIndex, setImageSlideIndex] = useState(0);
  const showcaseSlide = authSlides[0]; // Same for both login and signup

  const images = [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setImageSlideIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className={`auth-shell ${isLogin ? "auth-shell-login" : "auth-shell-signup"}`}>
      <section className="auth-panel auth-info auth-showcase auth-reveal auth-reveal-showcase" data-aos="fade-right" data-aos-duration="900">
        <div className="auth-showcase-top" data-aos="fade-down" data-aos-delay="40">
          <Link className="brand auth-brand-dark" to="/"><span className="brand-mark"><span className="brand-mark-ring"></span><span className="brand-mark-bars"><span></span><span></span><span></span></span><span className="brand-mark-arrow"></span><span className="brand-mark-core"></span></span><span className="brand-lockup"><strong className="brand-name">AI Personal Finance</strong><small className="brand-sub">Plan smarter. Spend better.</small></span></Link>
          <span className="auth-showcase-chip">{isLogin ? "Secure Access" : "New Account"}</span>
        </div>
        <div className="auth-showcase-copy" data-aos="fade-up" data-aos-delay="90">
          <p className="auth-slider-tag">{showcaseSlide.eyebrow}</p>
          <h1>{isLogin ? "Access your finance workspace with confidence." : "Create your personal finance workspace in minutes."}</h1>
          <h3 className="auth-slider-title">{showcaseSlide.title}</h3>
          <p className="auth-copy">{isLogin ? "Sign in to view spending analytics, reports, secure card details, and AI guidance from one polished dashboard." : "Register once and move directly into your smart finance dashboard with transactions, reports, and AI insights ready to use."}</p>
          <div className="auth-hero-metrics">
            <article className="auth-hero-metric">
              <span>Live forecast</span>
              <strong>PKR 34k</strong>
            </article>
            <article className="auth-hero-metric">
              <span>Security</span>
              <strong>Protected card vault</strong>
            </article>
            <article className="auth-hero-metric">
              <span>Reports</span>
              <strong>Instant dashboard export</strong>
            </article>
          </div>
          <div className="auth-feature-stack">
            <article className="auth-feature-tile">
              <span>Forecast</span>
              <strong>{showcaseSlide.previewA.value}</strong>
            </article>
            <article className="auth-feature-tile">
              <span>Insight</span>
              <strong>{showcaseSlide.previewB.value}</strong>
            </article>
            <article className="auth-feature-tile">
              <span>Access</span>
              <strong>{isLogin ? "Secure Google sign in" : "Fast account setup"}</strong>
            </article>
          </div>
        </div>
        <div className={`auth-visual-stage auth-visual-stage-${showcaseSlide.theme}`} aria-hidden="true" data-aos="zoom-in" data-aos-delay="150">
          <div className="auth-stage-orb auth-stage-orb-a"></div>
          <div className="auth-stage-orb auth-stage-orb-b"></div>
          <div className="auth-media-shell">
            <div className="auth-media-topbar"><span></span><span></span><span></span></div>
            <div className={`auth-media auth-media-${showcaseSlide.theme}`}>
              <div className="auth-media-header">
                <span>{showcaseSlide.eyebrow}</span>
                <strong>{showcaseSlide.note}</strong>
              </div>
              <div className="auth-media-body">
                <img src={images[imageSlideIndex]} alt="Finance Slide" className="auth-slide-image" />
                <div className="media-card media-card-balance">
                  <span>{showcaseSlide.note}</span>
                  <strong>{showcaseSlide.stat}</strong>
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
          <div className="auth-floating-card balance-card" data-aos="fade-right" data-aos-delay="220">
            <span>{showcaseSlide.note}</span>
            <strong>{showcaseSlide.stat}</strong>
            <p>Live finance preview</p>
          </div>
          <div className="auth-floating-card ring-card" data-aos="fade-left" data-aos-delay="280">
            <div className="mini-donut">
              <div className="mini-donut-center"><strong>{isLogin ? "82" : "34"}</strong><span>{isLogin ? "AI" : "Food"}</span></div>
            </div>
          </div>
          <div className="auth-floating-card upload-card" data-aos="fade-up" data-aos-delay="340">
            <div className="upload-icon">{showcaseSlide.code}</div>
            <div>
              <strong>{isLogin ? "Prediction ready" : "Expense overview"}</strong>
              <p>{isLogin ? "See next month forecast instantly." : "Track and compare daily spending."}</p>
            </div>
          </div>
          <div className={`auth-visual-caption auth-visual-caption-${showcaseSlide.theme}`}>
            <div className="auth-visual-caption-card">
              <span>{showcaseSlide.previewA.label}</span>
              <strong>{showcaseSlide.previewA.value}</strong>
            </div>
            <div className="auth-visual-caption-card">
              <span>{showcaseSlide.previewB.label}</span>
              <strong>{showcaseSlide.previewB.value}</strong>
            </div>
          </div>
          <div className="auth-glow auth-glow-a"></div>
          <div className="auth-glow auth-glow-b"></div>
        </div>
        <div className="auth-copy-wrap" data-aos="fade-up" data-aos-delay="180">
          <div className="auth-info-pills">
            <span>Expense tracking</span>
            <span>AI predictor</span>
            <span>Secure card vault</span>
          </div>
          <p className="auth-support-copy">{isLogin ? "Built for finance students and real-world expense planning." : "Create an account and start managing your money with clearer structure."}</p>
        </div>
      </section>
      <section className="auth-panel auth-form-panel auth-reveal auth-reveal-form" data-aos="fade-left" data-aos-duration="900">
        <div className="auth-banner">
          <h4>Secure Finance Dashboard</h4>
          <p>Manage your expenses with AI insights</p>
        </div>
        <div className="auth-form-side-images">
          <img src={images[0]} alt="Expense Tracking" />
          <img src={images[1]} alt="AI Insights" />
        </div>
        <div className="auth-card" data-aos="zoom-in" data-aos-delay="100">
          <div className="auth-card-head" data-aos="fade-down" data-aos-delay="140">
            <h3>Welcome to AI Personal Finance</h3>
            <p className="form-tag">{isLogin ? "Login" : "Create Account"}</p>
            <span className="auth-head-badge">{isLogin ? "Protected Access" : "Secure Setup"}</span>
          </div>
          <h2 data-aos="fade-up" data-aos-delay="180">{isLogin ? "Welcome back to your finance dashboard" : "Set up your account and continue"}</h2>
          <p className="auth-form-copy" data-aos="fade-up" data-aos-delay="220">{isLogin ? "Use your email and password to access dashboard insights, saved cards, reports, and the AI predictor." : "Register with your details and continue into the dashboard with your own finance profile."}</p>
          <div className="auth-form-meta" data-aos="fade-up" data-aos-delay="240">
            <div className="auth-form-meta-item">
              <span>Workspace</span>
              <strong>{isLogin ? "Dashboard + AI tools" : "Smart finance setup"}</strong>
            </div>
            <div className="auth-form-meta-item">
              <span>Access style</span>
              <strong>{isLogin ? "Email or Google sign in" : "Quick secure onboarding"}</strong>
            </div>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} data-aos="fade-up" data-aos-delay="260">
            {!isLogin ? <label>Full Name<input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} type="text" placeholder="Enter your full name" required /></label> : null}
            <label>Email Address<input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} type="email" placeholder="you@example.com" required /></label>
            <label>Password<div className="password-field"><input value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} type={showPassword ? "text" : "password"} placeholder="Enter password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button></div></label>
            {!isLogin ? <label>Confirm Password<div className="password-field"><input value={form.confirmPassword} onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))} type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" required /><button className="password-toggle" type="button" onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? "Hide" : "Show"}</button></div>{form.confirmPassword && form.password !== form.confirmPassword ? <small className="field-helper error">Passwords do not match yet.</small> : <small className="field-helper">Use a strong password for better account safety.</small>}</label> : null}
            {isLogin ? <div className="form-row auth-row-light"><label className="remember-line"><input type="checkbox" defaultChecked /> Remember me</label><button type="button" className="auth-link-btn" onClick={() => setSearchParams({ mode: "signup" })}>Need an account?</button></div> : null}
            {errorText ? <small className="field-helper error">{errorText}</small> : null}
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait..." : isLogin ? "Sign In" : "Register Now"}</button>
          </form>
          <div className="auth-divider" data-aos="fade-up" data-aos-delay="300"><span>or continue with</span></div>
          <div className="auth-socials auth-socials-single" data-aos="fade-up" data-aos-delay="340">
            <button className="auth-social-btn auth-social-btn-google" type="button" onClick={handleGoogleAuth} disabled={submitting}><span className="social-logo social-logo-google">G</span> Continue with Google</button>
          </div>
          <div className="auth-trust-row" data-aos="fade-up" data-aos-delay="380">
            <span>Encrypted login</span>
            <span>Fast access</span>
            <span>AI-ready dashboard</span>
          </div>
          <p className="auth-switch">{isLogin ? <>Don't have an account? <button type="button" className="auth-link-btn" onClick={() => setSearchParams({ mode: "signup" })}>Create one now</button></> : <>Already have an account? <button type="button" className="auth-link-btn" onClick={() => setSearchParams({ mode: "login" })}>Login here</button></>}</p>
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatbotLanguage, setChatbotLanguage] = useState("roman-ur");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [flashFirst, setFlashFirst] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [chatbotStatus, setChatbotStatus] = useState("Local AI");
  const [cardMessage, setCardMessage] = useState("");
  const [cardMessageType, setCardMessageType] = useState("info");
  const [toast, setToast] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expenseForm, setExpenseForm] = useState(initialExpenseForm);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    avatar: user.avatar || "",
    phone: user.phone,
    cnic: user.cnic,
    address: user.address,
    occupation: user.occupation,
    dob: user.dob,
    language: user.language,
  });
  const [cardForm, setCardForm] = useState({ holder: "", bank: "", number: "", expiry: "", cvv: "", zip: "", balance: "" });
  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);
  const expenseOnly = useMemo(() => expenses.filter((item) => item.type !== "income"), [expenses]);
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
  const categoryOverview = useMemo(() => {
    const totalExpense = expenseOnly.reduce((sum, item) => sum + Number(item.amount), 0) || 1;
    const grouped = expenseOnly.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});

    const palette = {
      Food: "blue-fill",
      Transportation: "red-fill",
      Transport: "red-fill",
      Utilities: "green-fill",
      Shopping: "blue-fill",
      Health: "green-fill",
      Other: "red-fill",
    };

    const notes = {
      Food: "Dining, groceries, and cafe orders",
      Transportation: "Fuel, ride bookings, and travel",
      Transport: "Fuel, ride bookings, and travel",
      Utilities: "Bills, internet, and monthly services",
      Shopping: "Lifestyle, personal items, and extras",
      Health: "Medicine and wellness costs",
      Other: "General personal spending",
    };

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, spent]) => ({
        label,
        spent,
        budget: Math.max(spent * 1.18, spent + 2500),
        width: Math.min(100, Math.round((spent / totalExpense) * 160)),
        percent: Math.round((spent / totalExpense) * 100),
        color: palette[label] || "blue-fill",
        note: notes[label] || "Tracked from your current records",
      }));
  }, [expenseOnly]);
  const totalBudget = useMemo(() => categoryOverview.reduce((sum, item) => sum + item.budget, 0), [categoryOverview]);
  const budgetUsed = totalBudget ? Math.round((prediction.expense / totalBudget) * 100) : 0;
  const savingsRate = prediction.income ? Math.max(0, Math.round((prediction.savings / prediction.income) * 100)) : 0;
  const accountHealth = Math.max(72, Math.min(96, Math.round((savingsRate + (settings.budgetAlerts ? 12 : 4) + (card?.number ? 8 : 0)) / 1.3)));
  const recentTransactions = expenses.slice(0, 6);
  const liveCardDigits = onlyDigits(cardForm.number);
  const liveCardBrand = cardForm.number ? detectCardBrand(cardForm.number) : card.brand || "Secure";
  const liveCardNumber = cardForm.number || card.number || "**** **** **** 9087";
  const liveCardHolder = cardForm.holder || card.holder || user.name || "Card Holder";
  const liveCardBank = cardForm.bank || card.bank || "AI Personal Finance";
  const liveCardExpiry = cardForm.expiry || card.expiry || "09/28";
  const cardChecks = [
    { label: "Holder name added", passed: cardForm.holder.trim().length > 2 },
    { label: "16-digit card number", passed: liveCardDigits.length === 16 },
    { label: "Valid expiry date", passed: isExpiryValid(cardForm.expiry) },
    { label: "Secure CVV entered", passed: cardForm.cvv.length === 3 },
    { label: "Billing ZIP attached", passed: cardForm.zip.trim().length >= 4 },
  ];
  const cardCompletion = Math.round((cardChecks.filter((item) => item.passed).length / cardChecks.length) * 100);
  const insightCards = [
    {
      icon: "SI",
      title: "Spending Trend",
      text: `Your current expense total is ${formatCurrency(prediction.expense)} and the next-month projection is around ${formatCurrency(prediction.projectedExpense)}.`,
    },
    {
      icon: "BA",
      title: "Budget Alert",
      text: `${prediction.topCategory} is using the highest share of your budget. Keeping it below ${formatCurrency(prediction.topCategoryAmount * 0.9)} will improve next-month control.`,
    },
    {
      icon: "SG",
      title: "Savings Goal",
      text: `You can realistically protect about ${formatCurrency(prediction.possibleSaving)} if you cut unnecessary ${prediction.topCategory.toLowerCase()} spending this month.`,
    },
    {
      icon: "IO",
      title: "Income Opportunity",
      text: `Your current savings rate is ${savingsRate}%. A higher savings target becomes practical once your spending stays near ${formatCurrency(prediction.safeBudget)}.`,
    },
  ];
  const plannerRows = categoryOverview.map((item) => {
    const utilization = Math.min(100, Math.round((item.spent / item.budget) * 100));
    const recommendation = utilization > 85 ? "High usage, reduce optional spend" : utilization > 70 ? "Watch closely this week" : "Within a safe range";
    return { ...item, utilization, recommendation };
  });
  const upcomingBills = [
    { label: "Internet Bill", due: "05 Apr", amount: formatCurrency(4200), status: "Due soon" },
    { label: "Electricity", due: "08 Apr", amount: formatCurrency(7600), status: "Upcoming" },
    { label: "Mobile Package", due: "11 Apr", amount: formatCurrency(1800), status: "Scheduled" },
  ];
  const walletHealthCards = [
    { title: "Available to Spend", value: formatCurrency(Math.max(prediction.safeBudget - prediction.expense, 0)), note: "Safe room left under your recommended limit" },
    { title: "Reports Ready", value: "03 exports", note: "Finance summaries can be downloaded any time" },
    { title: "Security Layer", value: card?.number ? "Card protected" : "No card linked", note: "Masked card preview and account controls are active" },
  ];
  const expenseDraftAmount = Number(expenseForm.amount || 0);
  const projectedTotalAfterEntry = prediction.expense + (editingTransaction !== null ? 0 : expenseDraftAmount);
  const selectedPlannerRow = plannerRows.find((item) => item.label === expenseForm.category) || plannerRows[plannerRows.length - 1];
  const expenseMethodLabels = {
    Cash: "Good for daily small purchases",
    DebitCard: "Best for bank-linked household spending",
    CreditCard: "Track carefully to avoid month-end rollover",
    BankTransfer: "Useful for bills, rent, and recurring payments",
    MobileWallet: "Suitable for instant utility and top-up spending",
  };

  useEffect(() => {
    const close = () => setProfileOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    setProfileForm({
      name: user.name,
      email: user.email,
      avatar: user.avatar || "",
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
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const ids = ["dashboard", "wallet", "transactions", "reports", "settings", "user-account", "analytical"];
    const handleScroll = () => {
      const current = ids.findLast((id) => {
        const element = document.getElementById(id);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 160 && rect.bottom >= 130;
      });
      if (current) setActiveSection(current);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = resolveSpeechLang(chatbotLanguage);
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

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const speakReply = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = resolveSpeechLang(chatbotLanguage);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const answerChat = async (text) => {
    addChat("user", text);
    setThinking(true);
    let reply = "";
    try {
      const payload = await apiRequest("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          user,
          expenses,
          settings,
          chatHistory,
        }),
      });
      reply = payload.text || "";
      if (reply) setChatbotStatus("Secure Server AI");
    } catch {
      setChatbotStatus("Local AI");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    setThinking(false);
    if (!reply) reply = buildLocalReply(text, prediction, user, expenses, settings, chatbotLanguage);
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
    showToast("success", "Logged out successfully.");
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
      method: expenseForm.method,
      merchant: expenseForm.merchant.trim() || "Manual Entry",
      note: expenseForm.note.trim(),
      type: "expense",
    };
    if (editingTransaction !== null) {
      setExpenses((current) => current.map((entry, index) => (index === editingTransaction ? item : entry)));
      setEditingTransaction(null);
      showToast("success", "Transaction updated successfully.");
    } else {
      setExpenses((current) => [item, ...current]);
      setFlashFirst(true);
      window.setTimeout(() => setFlashFirst(false), 1200);
      showToast("success", "New expense added to recent transactions.");
    }
    setExpenseForm(initialExpenseForm);
    addChat("bot", `Naya expense "${item.title}" add ho gaya. Updated projection ${formatCurrency(buildPrediction([item, ...expenses]).projectedExpense)} ke qareeb hai.`);
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setUser((current) => ({ ...current, ...profileForm }));
    showToast("success", "Profile updated successfully.");
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("info", "Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProfileForm((current) => ({ ...current, avatar: result }));
      showToast("success", "Profile picture updated.");
    };
    reader.readAsDataURL(file);
  };

  const resetDashboard = () => {
    setExpenses([]);
    setCard(emptyCard);
    setSettings(defaultSettings);
    setChatHistory(getWelcomeChat(user, []));
    setCardMessage("");
    setCardMessageType("info");
    setEditingTransaction(null);
    setExpenseForm(initialExpenseForm);
    showToast("success", "Dashboard reset. All finance values are now empty and ready for fresh entries.");
  };

  const editTransaction = (index) => {
    const item = expenses[index];
    if (!item) return;
    setExpenseForm({
      title: item.title,
      category: item.category,
      date: item.date,
      amount: String(item.amount),
      method: item.method || "Cash",
      merchant: item.merchant || "",
      note: item.note || "",
    });
    setEditingTransaction(index);
    document.getElementById("manual-expense")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("info", "Transaction loaded into form for editing.");
  };

  const deleteTransaction = (index) => {
    const item = expenses[index];
    setExpenses((current) => current.filter((_, currentIndex) => currentIndex !== index));
    if (editingTransaction === index) {
      setEditingTransaction(null);
      setExpenseForm(initialExpenseForm);
    }
    showToast("success", `"${item?.title || "Transaction"}" removed successfully.`);
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
    if (!isExpiryValid(cardForm.expiry)) {
      setCardMessageType("error");
      setCardMessage("Expiry date should be valid and in MM/YY format.");
      return;
    }
    if (cardForm.cvv.length < 3) {
      setCardMessageType("error");
      setCardMessage("CVV should be 3 digits.");
      return;
    }
    if (cardForm.zip.trim().length < 4) {
      setCardMessageType("error");
      setCardMessage("Billing ZIP / postal code should be at least 4 digits.");
      return;
    }
    const balanceValue = Number(cardForm.balance);
    if (cardForm.balance.trim() === "" || Number.isNaN(balanceValue) || balanceValue < 0) {
      setCardMessageType("error");
      setCardMessage("Please enter a valid card balance.");
      return;
    }
    setCard({
      holder: cardForm.holder,
      bank: cardForm.bank,
      number: maskCardNumber(cardForm.number),
      expiry: cardForm.expiry,
      cvvMasked: cardForm.cvv.replace(/\d/g, "*"),
      brand: detectCardBrand(cardForm.number),
      balance: balanceValue,
    });
    setCardForm({ holder: user.name || "", bank: "", number: "", expiry: "", cvv: "", zip: "", balance: "" });
    setCardMessageType("success");
    setCardMessage("ATM / debit card added successfully. Masked preview, brand detection, secure status, and balance have been updated.");
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
      `Recommended Safe Budget: ${formatCurrency(prediction.safeBudget)}`,
      `Top Category: ${prediction.topCategory}`,
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
    showToast("success", "Report downloaded successfully.");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="brand-mark"><span className="brand-mark-ring"></span><span className="brand-mark-bars"><span></span><span></span><span></span></span><span className="brand-mark-arrow"></span><span className="brand-mark-core"></span></span><span className="brand-lockup"><strong className="brand-name">AI Personal Finance</strong><small className="brand-sub">Plan smarter. Spend better.</small></span></div>
        <nav className="sidebar-nav dashboard-nav">
          <a className={activeSection === "dashboard" ? "active" : ""} href="#dashboard">Dashboard</a>
          <a className={activeSection === "wallet" ? "active" : ""} href="#wallet">Wallet</a>
          <a className={activeSection === "transactions" ? "active" : ""} href="#transactions">Transactions</a>
          <a className={activeSection === "reports" ? "active" : ""} href="#reports">Report</a>
          <a className={activeSection === "settings" ? "active" : ""} href="#settings">Settings</a>
          <a className={activeSection === "user-account" ? "active" : ""} href="#user-account">User Account</a>
          <a className={activeSection === "analytical" ? "active" : ""} href="#analytical">Analytics</a>
          <button className="sidebar-logout-btn" type="button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Logout"}</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar" id="dashboard">
          <div className="dashboard-heading">
            <div className="greeting-section">
              <p className="dashboard-kicker">Good morning, Ahmed! 👋</p>
              <h2>Here's your financial overview</h2>
              <p className="dashboard-intro">You have 3 pending notifications and your account is in good health.</p>
            </div>
            <div className="header-actions">
              <div className="notification-bell">
                <button className="bell-btn" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                  <span className="bell-icon">🔔</span>
                  <span className="notification-count">3</span>
                </button>
                {notificationsOpen && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h4>Notifications</h4>
                      <button onClick={() => setNotificationsOpen(false)}>×</button>
                    </div>
                    <div className="notifications-list">
                      <div className="notification-item warning">
                        <div className="notification-icon">⚠️</div>
                        <div className="notification-content">
                          <p>Electricity bill due in 3 days</p>
                          <span className="notification-time">2 hours ago</span>
                        </div>
                      </div>
                      <div className="notification-item info">
                        <div className="notification-icon">📈</div>
                        <div className="notification-content">
                          <p>15% savings increase this month</p>
                          <span className="notification-time">1 day ago</span>
                        </div>
                      </div>
                      <div className="notification-item success">
                        <div className="notification-icon">💰</div>
                        <div className="notification-content">
                          <p>Salary credited successfully</p>
                          <span className="notification-time">3 days ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="quick-actions">
                <button className="quick-action-btn primary" onClick={() => document.getElementById('manual-expense')?.scrollIntoView({ behavior: 'smooth' })}>
                  <span>+</span> Add Expense
                </button>
                <button className="quick-action-btn secondary" onClick={() => downloadReport()}>
                  📊 Report
                </button>
              </div>
            </div>
          </div>
          <div className="topbar-status-strip">
            <div className="topbar-status-card">
              <span>Account Health</span>
              <strong>{accountHealth}/100</strong>
              <div className="health-indicator">
                <div className="health-bar" style={{width: `${accountHealth}%`}}></div>
              </div>
            </div>
            <div className="topbar-status-card">
              <span>Budget Used</span>
              <strong>{budgetUsed}%</strong>
              <div className="budget-indicator">
                <div className={`budget-bar ${budgetUsed > 80 ? 'warning' : budgetUsed > 60 ? 'caution' : 'good'}`} style={{width: `${budgetUsed}%`}}></div>
              </div>
            </div>
            <div className="topbar-status-card">
              <span>Live Status</span>
              <strong>All systems active</strong>
              <div className="status-dot active"></div>
            </div>
          </div>
          <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
            <button className="profile-pill profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>
              <div className={`profile-avatar ${user.avatar ? "has-image" : ""}`}>{user.avatar ? <img src={user.avatar} alt={user.name} /> : null}</div>
              <span>{user.name.split(" ")[0]}</span>
            </button>
            {!profileOpen ? null : <div className="profile-dropdown">
              <div className="profile-dropdown-head">
                <div className={`profile-avatar small ${user.avatar ? "has-image" : ""}`}>{user.avatar ? <img src={user.avatar} alt={user.name} /> : initial}</div>
                <div><strong>{user.name}</strong><p>{user.email}</p></div>
              </div>
              <div className="profile-dropdown-links">
                <a href="#user-account">My Profile</a>
                <a href="#settings">Security & Settings</a>
                <a href="#card-form">Linked Cards</a>
                <a href="#analytical">Insights</a>
                <button type="button" onClick={handleLogout}>{loggingOut ? "Logging out..." : "Logout"}</button>
              </div>
            </div>}
          </div>
        </header>

        <section className="stats-row"><article className="stat-card"><p>Total Income</p><strong>{formatCurrency(prediction.income)}</strong><span className="stat-note">Primary monthly inflow across your saved records</span></article><article className="stat-card"><p>Total Expense</p><strong>{formatCurrency(prediction.expense)}</strong><span className="stat-note">{expenseOnly.length} tracked expense entries are included in this summary</span></article><article className="stat-card"><p>Savings</p><strong>{formatCurrency(prediction.savings)}</strong><span className="stat-note">Current savings rate is {savingsRate}% based on your latest totals</span></article></section>
        <section className="dashboard-card quick-grid" id="wallet"><article className="quick-card"><div className="quick-icon">WA</div><div><p>Wallet Balance</p><strong>{formatCurrency(Math.max(prediction.savings, 0))}</strong></div></article><article className="quick-card"><div className="quick-icon">CB</div><div><p>Card Balance</p><strong>{card?.number ? formatCurrency(card.balance) : "PKR 0.00"}</strong></div></article><article className="quick-card"><div className="quick-icon">GO</div><div><p>Goal Progress</p><strong>76% Completed</strong></div></article></section>
        <section className="dashboard-card chart-wrap" id="transactions"><div className="card-header two-col"><div><h2>Monthly Expense</h2><p className="section-copy">Track your current spending curve, projected total, and top category pressure in one view.</p></div><div><h2>Category Wise Expense</h2><p className="section-copy">Live split of your most expensive categories based on current saved records.</p></div></div><div className="chart-grid"><div className="line-chart"><div className="y-axis"><span>PKR 35,000</span><span>PKR 30,000</span><span>PKR 25,000</span><span>PKR 20,000</span><span>PKR 10,000</span></div><div className="line-chart-stack"><div className="chart-metrics"><div className="chart-metric-card"><span>Projected</span><strong>{formatCurrency(prediction.projectedExpense)}</strong></div><div className="chart-metric-card"><span>Possible Save</span><strong>{formatCurrency(prediction.possibleSaving)}</strong></div><div className="chart-metric-card"><span>Top Category</span><strong>{prediction.topCategory}</strong></div></div><div className="plot-area"><div className="chart-summary-pill"><span>Current Spend</span><strong>{formatCurrency(prediction.expense)}</strong></div><svg viewBox="0 0 600 260" preserveAspectRatio="none"><defs><linearGradient id="expenseAreaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4a87ff" stopOpacity="0.3"></stop><stop offset="100%" stopColor="#4a87ff" stopOpacity="0.02"></stop></linearGradient></defs><path className="area-path" d="M20 220 C65 220, 85 155, 130 168 S210 225, 255 160 S340 115, 385 125 S465 35, 510 80 S565 155, 590 110 L590 260 L20 260 Z" /><path className="line-path" d="M20 220 C65 220, 85 155, 130 168 S210 225, 255 160 S340 115, 385 125 S465 35, 510 80 S565 155, 590 110" /><g className="point-group">{monthlySeries.map((point, index) => <g key={point.label}><circle cx={point.x} cy={point.y} r={index === monthlySeries.length - 1 ? 6 : 5}></circle><text className="point-value-label" x={point.x} y={point.y - 14}>{Math.round(point.value / 1000)}k</text></g>)}</g></svg><div className="x-axis">{monthlySeries.map((point) => <span key={point.label}>{point.label}</span>)}</div></div><div className="mini-compare-chart"><div className="mini-compare-head"><span>Monthly Compare</span><strong>Spent vs Target</strong></div><div className="mini-bars">{monthlySeries.map((point, index) => <div className="mini-bar-col" key={point.label}><div className="mini-bar-track"><div className={`mini-bar-fill ${index >= monthlySeries.length - 2 ? "mini-bar-fill-accent" : ""}`} style={{ height: `${Math.max(24, Math.round((point.value / 32000) * 100))}%` }}></div></div><small>{point.label}</small></div>)}</div></div></div></div><div className="category-chart-wrap"><div className="category-chart-card"><div className="category-chart-top"><span>Top Categories</span><strong>Expense Split</strong></div><div className="category-bars">{categoryOverview.map((item) => <div className="category-bar-card" key={item.label}><div className="category-bar-head"><span>{item.label}</span><strong>{item.percent}%</strong></div><div className="category-track"><div className={`category-fill ${item.color}`} style={{ width: `${item.width}%` }}></div></div><small>{item.note}</small></div>)}</div></div><div className="category-summary">{categoryOverview.map((item) => <div className="legend-item comparison-legend-item" key={item.label}><div><strong>{item.label}</strong><span>{formatCurrency(item.spent)} spent from {formatCurrency(item.budget)} budget</span></div><span className={`comparison-badge ${item.color}`}>{Math.round((item.spent / item.budget) * 100)}%</span></div>)}</div></div></div></section>
        <section className="dashboard-card bars-card" id="reports"><div className="card-header section-inline"><div><h2>Budget vs. Spending Report</h2><p className="report-subtext">Download a full finance summary based on your current dashboard data.</p></div><button className="btn btn-primary report-download-btn" type="button" onClick={downloadReport}>Download Report</button></div><div className="report-highlight-grid"><div className="report-highlight-card"><span>Safe Spending Target</span><strong>{formatCurrency(prediction.safeBudget)}</strong><p>Recommended ceiling if you want better savings control next month.</p></div><div className="report-highlight-card"><span>Category Pressure</span><strong>{prediction.topCategory}</strong><p>{prediction.topCategory} is currently the category to watch most closely.</p></div><div className="report-highlight-card"><span>Goal Window</span><strong>{formatCurrency(prediction.possibleSaving)}</strong><p>Possible amount you can protect by reducing low-priority expenses.</p></div></div><div className="report-export-strip"><div className="report-export-card"><strong>TXT Export</strong><span>Fast summary for viva and quick review</span></div><div className="report-export-card"><strong>Live Finance Snapshot</strong><span>Includes totals, top category, and recent transactions</span></div><div className="report-export-card"><strong>Submission Friendly</strong><span>Simple printable output with PKR values</span></div></div><div className="double-panels">{categoryOverview.map((item) => <div className="budget-panel" key={item.label}><h2>{item.label} Budget vs. Spending</h2><div className="hbar-group"><span>Spent</span><div className="bar-track"><div className={`fill ${item.color}`} style={{ width: `${Math.min(100, Math.round((item.spent / item.budget) * 100))}%` }}></div></div></div><div className="hbar-group"><span>Remaining</span><div className="bar-track"><div className="fill neutral-fill" style={{ width: `${Math.max(8, 100 - Math.round((item.spent / item.budget) * 100))}%` }}></div></div></div><div className="range-labels"><span>{formatCurrency(0)}</span><span>{formatCurrency(item.budget / 2)}</span><span>{formatCurrency(item.budget)}</span></div></div>)}</div></section>
        <section className="dashboard-split"><section className="dashboard-card transaction-panel"><div className="card-header section-inline"><div><h2>Recent Transactions</h2><p className="section-copy">Your latest expense records update the dashboard instantly.</p></div></div><div className="transaction-list">{recentTransactions.map((item, index) => <article className={`transaction-item ${index === 0 && flashFirst ? "flash-new" : ""}`} key={`${item.title}-${item.date}-${index}`}><div className="transaction-main"><span className="transaction-icon">{item.icon}</span><div><strong>{item.title}</strong><p>{item.category}</p></div></div><div className="transaction-side"><div className="transaction-meta"><span>{item.date}</span><strong className={item.type === "income" ? "positive" : "negative"}>{item.type === "income" ? "+" : "-"}{formatCurrency(item.amount)}</strong></div><div className="transaction-actions"><button type="button" className="table-action-btn" onClick={() => editTransaction(index)}>Edit</button><button type="button" className="table-action-btn danger" onClick={() => deleteTransaction(index)}>Delete</button></div></div></article>)}</div></section><section className="dashboard-card ai-panel" id="analytical"><div className="card-header section-inline"><div><h2>AI Features</h2><p className="section-copy">Auto-generated coaching based on your current profile, budget trend, and saved records.</p></div><span className="ai-pill">Smart Analysis</span></div><div className="insight-list">{insightCards.map((item) => <article className="insight-card" key={item.title}><div className="insight-icon">{item.icon}</div><div><strong>{item.title}</strong><p>{item.text}</p></div></article>)}</div></section></section>
        <section className="dashboard-split">
          <section className="dashboard-card manual-entry-panel" id="manual-expense">
            <div className="card-header section-inline">
              <div>
                <h2>{editingTransaction !== null ? "Edit Entry" : "Manual Entry"}</h2>
                <p className="section-copy">Add a new income or expense record with payment details, merchant notes, and a live finance impact preview.</p>
              </div>
              <span className="status-badge light">{editingTransaction !== null ? "Edit Mode" : "Live Update"}</span>
            </div>
            <form className="expense-form" onSubmit={saveExpense}>
              <label>
                Expense Title
                <input value={expenseForm.title} onChange={(e) => setExpenseForm((s) => ({ ...s, title: e.target.value }))} type="text" placeholder="Restaurant dinner, internet bill, fuel refill" required />
              </label>
              <label>
                Category
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((s) => ({ ...s, category: e.target.value }))}>
                  <option>Food</option>
                  <option>Utilities</option>
                  <option>Transportation</option>
                  <option>Shopping</option>
                  <option>Health</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Date
                <input value={expenseForm.date} onChange={(e) => setExpenseForm((s) => ({ ...s, date: e.target.value }))} type="date" required />
              </label>
              <label>
                Amount
                <input value={expenseForm.amount} onChange={(e) => setExpenseForm((s) => ({ ...s, amount: e.target.value }))} type="number" min="1" step="0.01" placeholder="2500" required />
              </label>
              <label>
                Payment Method
                <select value={expenseForm.method} onChange={(e) => setExpenseForm((s) => ({ ...s, method: e.target.value }))}>
                  <option value="Cash">Cash</option>
                  <option value="DebitCard">Debit Card</option>
                  <option value="CreditCard">Credit Card</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="MobileWallet">Mobile Wallet</option>
                </select>
              </label>
              <label>
                Merchant / Source
                <input value={expenseForm.merchant} onChange={(e) => setExpenseForm((s) => ({ ...s, merchant: e.target.value }))} type="text" placeholder="Imtiaz Store, PSO Pump, K-Electric" />
              </label>
              <label className="expense-form-full">
                Notes
                <textarea value={expenseForm.note} onChange={(e) => setExpenseForm((s) => ({ ...s, note: e.target.value }))} rows="4" placeholder="Add a short note for why this expense happened or what should be adjusted next time." />
              </label>
              <div className="expense-form-actions">
                <button className="btn btn-primary auth-submit" type="submit">
                  {editingTransaction !== null ? "Update Expense" : "Add Expense"}
                </button>
                {editingTransaction !== null ? (
                  <button
                    className="btn btn-finance-ghost"
                    type="button"
                    onClick={() => {
                      setEditingTransaction(null);
                      setExpenseForm(initialExpenseForm);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </section>
          <section className="dashboard-card account-panel">
            <div className="card-header section-inline">
              <div>
                <h2>Entry Summary</h2>
                <p className="section-copy">Live guidance while you prepare the next expense entry.</p>
              </div>
              <span className="ai-pill">Manual Tracking</span>
            </div>
            <div className="account-grid single-column">
              <div className="account-box expense-helper-box">
                <p>Preview amount</p>
                <strong>{expenseDraftAmount > 0 ? formatCurrency(expenseDraftAmount) : "PKR 0.00"}</strong>
                <span>{expenseForm.method ? expenseMethodLabels[expenseForm.method] : "Choose a payment method to see guidance."}</span>
              </div>
              <div className="account-box expense-helper-box">
                <p>Projected total after entry</p>
                <strong>{formatCurrency(projectedTotalAfterEntry)}</strong>
                <span>{editingTransaction !== null ? "Editing this record updates totals without duplicating the expense." : "This estimate shows where monthly expense may move after saving."}</span>
              </div>
              <div className="account-box expense-helper-box">
                <p>Category planner</p>
                <strong>{selectedPlannerRow?.label || expenseForm.category}</strong>
                <span>{selectedPlannerRow ? `${selectedPlannerRow.utilization}% of the suggested budget is already used. ${selectedPlannerRow.recommendation}` : `Try to keep monthly spending near ${formatCurrency(prediction.safeBudget)} for a healthier savings ratio.`}</span>
              </div>
              <div className="account-box expense-helper-box">
                <p>Form checklist</p>
                <strong>{expenseForm.title && expenseForm.date && expenseForm.amount ? "Ready to save" : "Waiting for required fields"}</strong>
                <span>{expenseForm.merchant || expenseForm.note ? "Merchant details and notes will make future reports more useful." : "Add merchant name and a short note for clearer reports and smarter review later."}</span>
              </div>
            </div>
          </section>
        </section>
        <section className="dashboard-split">
          <section className="dashboard-card planner-panel">
            <div className="card-header section-inline"><div><h2>Budget Planner</h2><p className="section-copy">Category-level guidance to keep spending inside a healthier monthly budget range.</p></div><span className="status-badge light">Planner</span></div>
            <div className="planner-list">
              {plannerRows.map((item) => <article className="planner-row" key={item.label}><div className="planner-main"><strong>{item.label}</strong><span>{formatCurrency(item.spent)} used from {formatCurrency(item.budget)}</span></div><div className="planner-track"><div className={`planner-fill ${item.color}`} style={{ width: `${item.utilization}%` }}></div></div><div className="planner-meta"><span>{item.utilization}% used</span><strong>{item.recommendation}</strong></div></article>)}
            </div>
          </section>
          <section className="dashboard-card wallet-snapshot-panel">
            <div className="card-header section-inline"><div><h2>Wallet Snapshot</h2><p className="section-copy">Quick finance health summary based on your latest records, reports, and card setup.</p></div><span className="status-badge">Stable</span></div>
            <div className="wallet-health-grid">
              {walletHealthCards.map((item) => <div className="wallet-health-card" key={item.title}><p>{item.title}</p><strong>{item.value}</strong><span>{item.note}</span></div>)}
            </div>
          </section>
        </section>
        <section className="dashboard-split">
          <section className="dashboard-card upcoming-panel">
            <div className="card-header section-inline"><div><h2>Upcoming Bills</h2><p className="section-copy">Simple planner view for routine payments and scheduled outgoing amounts.</p></div><span className="ai-pill">Due List</span></div>
            <div className="upcoming-list">
              {upcomingBills.map((item) => <article className="upcoming-item" key={item.label}><div><strong>{item.label}</strong><p>{item.due}</p></div><div className="upcoming-meta"><span>{item.status}</span><strong>{item.amount}</strong></div></article>)}
            </div>
          </section>
          <section className="dashboard-card account-panel">
            <div className="card-header section-inline"><h2>Financial Targets</h2><span className="status-badge light">On Track</span></div>
            <div className="account-grid single-column">
              <div className="account-box"><p>Monthly Savings Target</p><strong>{formatCurrency(Math.max(prediction.possibleSaving, 1200))}</strong></div>
              <div className="account-box"><p>Recommended Expense Cap</p><strong>{formatCurrency(prediction.safeBudget)}</strong></div>
              <div className="account-box"><p>Focus Category</p><strong>{prediction.topCategory} should stay below {formatCurrency(prediction.topCategoryAmount * 0.9)}</strong></div>
            </div>
          </section>
        </section>
        <section className="dashboard-split account-section-wrap"><section className="dashboard-card account-panel" id="user-account"><div className="card-header section-inline"><h2>User Account</h2><span className="status-badge">Verified</span></div><div className="profile-banner"><div className="profile-summary"><div className={`profile-avatar large ${user.avatar ? "has-image" : ""}`}>{user.avatar ? <img src={user.avatar} alt={user.name} /> : initial}</div><div><h3>{user.name}</h3><p>{user.email}</p><span className="mini-status">Premium Member since {user.memberSince}</span></div></div><div className="security-chip">2-Step Verification Active</div></div><div className="account-grid"><div className="account-box"><p>Phone Number</p><strong>{user.phone}</strong></div><div className="account-box"><p>CNIC / ID</p><strong>{user.cnic}</strong></div><div className="account-box"><p>Address</p><strong>{user.address}</strong></div><div className="account-box"><p>Last Login</p><strong>{user.lastLogin}</strong></div></div><div className="detail-grid"><div className="detail-card"><h3>Profile Details</h3><div className="detail-line"><span>Full Name</span><strong>{user.name}</strong></div><div className="detail-line"><span>Date of Birth</span><strong>{user.dob}</strong></div><div className="detail-line"><span>Occupation</span><strong>{user.occupation}</strong></div><div className="detail-line"><span>Preferred Currency</span><strong>{user.currency}</strong></div></div><div className="detail-card"><h3>Account Security</h3><div className="detail-line"><span>Password Status</span><strong>Updated 10 days ago</strong></div><div className="detail-line"><span>Recovery Email</span><strong>backup@aifinance.com</strong></div><div className="detail-line"><span>Device Trust</span><strong>3 trusted devices</strong></div><div className="detail-line"><span>Security Score</span><strong>92 / 100</strong></div></div><div className="detail-card"><h3>Preferences</h3><div className="detail-line"><span>Language</span><strong>{user.language}</strong></div><div className="detail-line"><span>Alerts</span><strong>Enabled</strong></div><div className="detail-line"><span>Weekly Reports</span><strong>Every Sunday</strong></div><div className="detail-line"><span>Theme</span><strong>Light Dashboard</strong></div></div></div><div className="account-edit-panel"><div className="card-header section-inline"><h3>Edit Profile</h3><span className="status-badge light">Saved Locally</span></div><form className="expense-form profile-form" onSubmit={saveProfile}><label>Profile Picture<input type="file" accept="image/*" onChange={handleProfileImage} /><small className="field-helper">Upload a clear image for top-right profile and account preview.</small></label><label>Full Name<input value={profileForm.name} onChange={(e) => setProfileForm((s) => ({ ...s, name: e.target.value }))} type="text" /></label><label>Email<input value={profileForm.email} onChange={(e) => setProfileForm((s) => ({ ...s, email: e.target.value }))} type="email" /></label><label>Phone Number<input value={profileForm.phone} onChange={(e) => setProfileForm((s) => ({ ...s, phone: e.target.value }))} type="text" /></label><label>CNIC / ID<input value={profileForm.cnic} onChange={(e) => setProfileForm((s) => ({ ...s, cnic: e.target.value }))} type="text" /></label><label>Address<input value={profileForm.address} onChange={(e) => setProfileForm((s) => ({ ...s, address: e.target.value }))} type="text" /></label><label>Occupation<input value={profileForm.occupation} onChange={(e) => setProfileForm((s) => ({ ...s, occupation: e.target.value }))} type="text" /></label><label>Date of Birth<input value={profileForm.dob} onChange={(e) => setProfileForm((s) => ({ ...s, dob: e.target.value }))} type="text" /></label><label>Language<input value={profileForm.language} onChange={(e) => setProfileForm((s) => ({ ...s, language: e.target.value }))} type="text" /></label><button className="btn btn-primary auth-submit" type="submit">Save Profile</button></form></div></section><div className="settings-stack"><section className="dashboard-card settings-panel" id="settings"><div className="card-header section-inline"><h2>Settings</h2><span className="status-badge light">Updated</span></div><div className="settings-list"><div className="setting-row"><span>Email Notifications</span><button className={`toggle-btn ${settings.emailNotifications ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, emailNotifications: !current.emailNotifications }))}>{settings.emailNotifications ? "On" : "Off"}</button></div><div className="setting-row"><span>Monthly Budget Alerts</span><button className={`toggle-btn ${settings.budgetAlerts ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, budgetAlerts: !current.budgetAlerts }))}>{settings.budgetAlerts ? "On" : "Off"}</button></div><div className="setting-row"><span>Dark Summary Reports</span><button className={`toggle-btn ${settings.darkReports ? "active" : ""}`} type="button" onClick={() => setSettings((current) => ({ ...current, darkReports: !current.darkReports }))}>{settings.darkReports ? "On" : "Off"}</button></div></div><div className="settings-security"><div className="security-item"><span>Login Alerts</span><strong>Enabled for every new device</strong></div><div className="security-item"><span>Data Privacy</span><strong>Account info stays masked in card preview</strong></div></div><div className="settings-actions"><button className="btn btn-finance-ghost" type="button" onClick={resetDashboard}>Reset Dashboard</button></div></section><section className="dashboard-card settings-panel settings-support-card"><div className="card-header section-inline"><h2>Security Status</h2><span className="status-badge">Protected</span></div><div className="account-grid single-column"><div className="account-box"><p>Trusted Device</p><strong>This browser session is marked as secure.</strong></div><div className="account-box"><p>Backup Reminder</p><strong>Review profile, card details, and downloaded reports weekly.</strong></div><div className="account-box"><p>Quick Help</p><strong>Keep budget alerts on and update your password regularly for safer usage.</strong></div></div></section></div></section>
        <section className="dashboard-split"><section className="dashboard-card card-management-panel"><div className="card-header section-inline"><div><h2>Add ATM / Debit Card</h2><p className="section-copy">Type card details below and watch the secure preview, brand type, and security checks update in real time.</p></div><span className="status-badge light">Secure Card Vault</span></div><div className="card-intro-strip"><div><strong>Card Setup</strong><span>Add a secure card for demo wallet access and preview.</span></div><div><strong>Masked Preview</strong><span>Only the last digits are visible after save.</span></div></div><div className="card-live-preview"><div className="card-live-head"><strong>Live card readiness</strong><span>{cardCompletion}% complete</span></div><div className="card-progress-track"><div className="card-progress-fill" style={{ width: `${cardCompletion}%` }}></div></div><div className="card-checklist">{cardChecks.map((item) => <div className={`card-check-item ${item.passed ? "passed" : ""}`} key={item.label}><span>{item.passed ? "OK" : ".."}</span><strong>{item.label}</strong></div>)}</div></div><form className="expense-form card-form" id="card-form" onSubmit={saveCard}><label>Card Holder Name<input value={cardForm.holder} onChange={(e) => setCardForm((s) => ({ ...s, holder: e.target.value }))} type="text" placeholder="Enter account holder name" required /></label><label>Bank Name<select value={cardForm.bank} onChange={(e) => setCardForm((s) => ({ ...s, bank: e.target.value }))} required><option value="">Select bank</option>{bankOptions.map((bank) => <option key={bank} value={bank}>{bank}</option>)}</select></label><label>Card Number<input value={cardForm.number} onChange={(e) => setCardForm((s) => ({ ...s, number: onlyDigits(e.target.value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim() }))} type="text" inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" required /></label><label>Expiry Date<input value={cardForm.expiry} onChange={(e) => { const digits = onlyDigits(e.target.value).slice(0, 4); setCardForm((s) => ({ ...s, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits })); }} type="text" inputMode="numeric" maxLength={5} placeholder="MM/YY" required /></label><label>CVV<input value={cardForm.cvv} onChange={(e) => setCardForm((s) => ({ ...s, cvv: onlyDigits(e.target.value).slice(0, 3) }))} type="password" inputMode="numeric" maxLength={3} placeholder="123" required /></label><label>Billing Zip<input value={cardForm.zip} onChange={(e) => setCardForm((s) => ({ ...s, zip: onlyDigits(e.target.value).slice(0, 6) }))} type="text" inputMode="numeric" placeholder="54000" required /></label><label>Card Balance<input value={cardForm.balance} onChange={(e) => setCardForm((s) => ({ ...s, balance: e.target.value }))} type="number" min="0" step="0.01" placeholder="125000" required /></label>{cardMessage ? <small className={`field-helper ${cardMessageType === "error" ? "error" : "success"}`}>{cardMessage}</small> : <small className="field-helper">Tip: card number 16 digits, valid MM/YY expiry, secure CVV, billing ZIP, and balance complete rakhein.</small>}<button className="btn btn-primary auth-submit" type="submit">Add Secure Card</button></form></section><section className="dashboard-card saved-card-panel"><div className="card-header section-inline"><h2>Linked ATM Card</h2><span className="security-chip">Encrypted</span></div><div className="atm-card atm-card-preview"><div className="atm-card-top"><div><span>{liveCardBank}</span><strong>Debit Card</strong></div><span className="atm-network">{liveCardBrand}</span></div><div className="atm-chip"></div><strong>{liveCardNumber}</strong><div className="atm-card-bottom"><div><span>Card Holder</span><strong>{liveCardHolder}</strong></div><div><span>Expiry</span><strong>{liveCardExpiry}</strong></div></div></div><div className="card-highlight-row"><div className="account-box"><p>Linked Bank</p><strong>{card.bank || "No bank linked yet"}</strong></div><div className="account-box"><p>Card Balance</p><strong>{card.number ? formatCurrency(card.balance) : "PKR 0.00"}</strong></div><div className="account-box"><p>Security</p><strong>{card.number ? "Masked and encrypted preview" : "Secure preview ready for new card"}</strong></div></div><div className="card-security-list"><div className="security-item"><span>Card Status</span><strong>{card.number ? `${card.bank} card added with masked number and profile binding` : "No card linked right now. Add a new ATM/debit card anytime."}</strong></div><div className="security-item"><span>CVV Storage</span><strong>{card.number ? `CVV hidden (${card.cvvMasked}) and protected for secure preview only` : "CVV will stay hidden once a card is added."}</strong></div><div className="security-item"><span>Security Layer</span><strong>OTP + masked digits + manual verification</strong></div><div className="security-item"><span>Brand Detection</span><strong>{card.brand || "Secure"} network identified with live number pattern check</strong></div></div></section></section>
        <div className="floating-chatbot">
          {chatbotOpen ? (
            <div className="chatbot-widget">
              <div className="chatbot-widget-head">
                <div className="chatbot-title-block">
                  <span className="chatbot-brand-icon">AI</span>
                  <div>
                    <strong>AI Finance Chatbot</strong>
                    <p>{chatbotStatus} for expense, savings, and budget guidance</p>
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
                  <button className="chatbot-chip" type="button" onClick={() => answerChat("Give me a full finance summary")}>Summary</button>
                  <button className="chatbot-chip" type="button" onClick={() => answerChat("What is my latest expense?")}>Latest</button>
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
            <span className="chatbot-launcher-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="7" cy="10" r="1" fill="currentColor"/>
                <circle cx="17" cy="10" r="1" fill="currentColor"/>
                <rect x="8" y="13" width="8" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor"/>
                <rect x="1" y="20" width="2" height="4" rx="1" fill="currentColor"/>
                <rect x="21" y="20" width="2" height="4" rx="1" fill="currentColor"/>
                <rect x="10" y="1" width="4" height="4" rx="2" fill="currentColor"/>
                <circle cx="12" cy="3" r="0.5" fill="white"/>
                <rect x="6" y="6" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
                <rect x="16" y="6" width="2" height="1" rx="0.5" fill="currentColor" opacity="0.6"/>
              </svg>
            </span>
            <span>Chatbot</span>
            {unreadCount > 0 ? <span className="chatbot-badge">{unreadCount}</span> : null}
          </button>
        </div>
        {toast ? <div className={`dashboard-toast ${toast.type}`}>{toast.message}</div> : null}
      </main>
    </div>
  );
}

export default App;



