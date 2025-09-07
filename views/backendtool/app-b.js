import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static(path.join(__dirname, "public")));

const API_BASE = process.env.API_BASE?.replace(/\/$/, "") || "";
const API_KEY = process.env.API_KEY || "";
const PORT = process.env.PORT || 3000;

if (!API_BASE) {
  console.warn("⚠️  API_BASE is not set. Set it in .env to enable proxying to your backend APIs.");
}

/**
 * Helper: proxy fetch to external API
 */
async function proxyJSON(res, url) {
  try {
    const headers = {};
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text || `Upstream error ${r.status}`);
    }
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}

// ---------------- UI Route ----------------
app.get("/", (req, res) => {
  res.render("index");
});

// ---------------- Proxy API Routes ----------------
// NOTE: Update the paths to match your external API structure exactly.
// This example assumes your external API has the same endpoints.
app.get("/api/countries", (req, res) => {
  proxyJSON(res, `${API_BASE}/countries`);
});

app.get("/api/cities/:country", (req, res) => {
  const country = encodeURIComponent(req.params.country);
  proxyJSON(res, `${API_BASE}/cities/${country}`);
});

app.get("/api/appTypes", (req, res) => {
  proxyJSON(res, `${API_BASE}/appTypes`);
});

// products by query (you can switch to /products/:query if your API uses path param)
app.get("/api/products", (req, res) => {
  const q = encodeURIComponent(req.query.query || "");
  proxyJSON(res, `${API_BASE}/products?query=${q}`);
});

app.get("/api/product/:id", (req, res) => {
  const id = encodeURIComponent(req.params.id);
  proxyJSON(res, `${API_BASE}/product/${id}`);
});

app.get("/api/detail/:detailId", (req, res) => {
  const detailId = encodeURIComponent(req.params.detailId);
  proxyJSON(res, `${API_BASE}/detail/${detailId}`);
});

// --------------- Start Server ---------------
app.listen(PORT, () => {
  console.log(`✅ UI running at http://localhost:${PORT}`);
  if (API_BASE) console.log(`🔗 Proxying to API_BASE: ${API_BASE}`);
});
