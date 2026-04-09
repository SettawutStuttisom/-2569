const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

/* ✅ ใช้ PORT จาก cloud */
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* PATH */
const appRoot = path.join(__dirname, "..");
const DATA_DIR = path.join(appRoot, "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

/* Ensure data */
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

/* STATIC */
app.use(express.static(path.join(appRoot, "web")));

app.get("/", (req, res) => {
    res.sendFile(path.join(appRoot, "web", "index.html"));
});

/* API */

/* POST */
app.post("/api/report", (req, res) => {
    try {
        const newReport = req.body;

        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const data = JSON.parse(raw);

        data.push({
            id: Date.now(),
            ...newReport,
            createdAt: new Date().toISOString()
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

/* GET */
app.get("/api/reports", (req, res) => {
    try {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const data = JSON.parse(raw);

        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

/* DELETE */
app.delete("/api/reports/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        let data = JSON.parse(raw);

        data = data.filter(item => item.id !== id);

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

/* START */
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});