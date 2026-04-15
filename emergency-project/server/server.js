const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* PORT */
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* ================= PATH FIX ================= */
const ROOT = path.join(__dirname, "..");

const DATA_DIR = path.join(ROOT, "data");
const WEB_DIR = path.join(ROOT, "web");

const DATA_FILE = path.join(DATA_DIR, "reports.json");
const ACCOUNT_FILE = path.join(DATA_DIR, "account.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.txt");

/* ================= STATIC (สำคัญสุด) ================= */
app.use(express.static(WEB_DIR));

/* ================= INIT FILES ================= */
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(ACCOUNT_FILE)) {
  fs.writeFileSync(
    ACCOUNT_FILE,
    JSON.stringify([{ username: "admin", password: "1234", phone: "0801234567" }], null, 2)
  );
}

if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeFileSync(HISTORY_FILE, "");
}

/* ================= API ================= */
app.post("/api/report", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    const report = {
      id: Date.now(),
      ...req.body,
      status: "pending",
      officer: null,
      createdAt: new Date().toISOString(),
    };

    data.push(report);

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, id: report.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/reports", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post("/api/report/:id/accept", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username } = req.body;

    let data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    const report = data.find((r) => r.id === id);

    if (report) {
      report.status = "accepted";
      report.officer = username;
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/api/report/:id/reject", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username } = req.body;

    let data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    const report = data.find((r) => r.id === id);

    if (report) {
      const log = `
REJECTED REPORT
id: ${report.id}
type: ${report.type}
detail: ${report.detail}
by: ${username}
time: ${new Date().toISOString()}
-------------------------
`;

      fs.appendFileSync(HISTORY_FILE, log);

      data = data.filter((r) => r.id !== id);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

/* ================= START ================= */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});