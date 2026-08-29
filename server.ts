import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client (lazily/safely)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Live Crypto Pricing & Network Telemetry API
app.get("/api/crypto/market", async (req, res) => {
  try {
    // Return structured live market metrics with simulated micro-volatility
    const now = Date.now();
    const ethFluctuation = (Math.sin(now / 11000) * 18.5) + (Math.cos(now / 4000) * 4.2) + 3488.50;
    const btcFluctuation = (Math.sin(now / 15000) * 450) + 96420;
    const etcFluctuation = (Math.cos(now / 12000) * 1.2) + 29.8;
    const kasFluctuation = (Math.sin(now / 8000) * 0.008) + 0.168;
    const ltcFluctuation = (Math.cos(now / 10000) * 2.1) + 118.5;
    const xmrFluctuation = (Math.sin(now / 18000) * 4.5) + 184.2;
    const dogeFluctuation = (Math.cos(now / 14000) * 0.009) + 0.245;

    res.json({
      timestamp: new Date().toISOString(),
      prices: {
        ETH: { priceUsd: Number(ethFluctuation.toFixed(2)), change24h: 3.28, difficulty: "12.85 P", blockReward: "2.0 ETH + Fees", algo: "ETH2.0 Stratum / PoS", networkHash: "1.14 PH/s", gasGwei: 16.4 },
        BTC: { priceUsd: Number(btcFluctuation.toFixed(2)), change24h: 3.42, difficulty: "84.23 T", blockReward: "3.125 BTC", algo: "SHA-256", networkHash: "680.4 EH/s" },
        ETC: { priceUsd: Number(etcFluctuation.toFixed(2)), change24h: -0.85, difficulty: "2.14 P", blockReward: "2.56 ETC", algo: "Etchash", networkHash: "175.2 TH/s" },
        KAS: { priceUsd: Number(kasFluctuation.toFixed(4)), change24h: 6.78, difficulty: "428.1 P", blockReward: "115.6 KAS", algo: "kHeavyHash", networkHash: "320.8 PH/s" },
        LTC: { priceUsd: Number(ltcFluctuation.toFixed(2)), change24h: 1.15, difficulty: "38.9 M", blockReward: "6.25 LTC", algo: "Scrypt", networkHash: "1.08 PH/s" },
        XMR: { priceUsd: Number(xmrFluctuation.toFixed(2)), change24h: 0.45, difficulty: "356.2 G", blockReward: "0.6 XMR", algo: "RandomX", networkHash: "3.4 GH/s" },
        DOGE: { priceUsd: Number(dogeFluctuation.toFixed(4)), change24h: 4.12, difficulty: "18.2 M", blockReward: "10,000 DOGE", algo: "Scrypt (AuxPoW)", networkHash: "1.08 PH/s" },
      },
      globalMiningStats: {
        activeMinersGlobal: 184920,
        activePoolsGlobal: 42,
        totalBlocksMinedToday: 144,
        averageBlockTimeSeconds: 592,
        estimatedNextDiffAdjustment: "+1.84% in 3 days",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load crypto market telemetry", details: error?.message });
  }
});

// AI Mining Advisor Route
app.post("/api/ai/advisor", async (req, res) => {
  try {
    const { question, userContext, language } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // High-quality smart response fallback if API key is not yet set
      return res.json({
        advice: generateFallbackAdvice(question, language || "en"),
        source: "fallback_expert_engine",
      });
    }

    const systemInstruction = `You are the Lead Mining Engineer & Cryptoeconomic Advisor for HashForge Pro platform.
Respond in English in a professional, concise, and technically accurate crypto mining consulting tone.
You specialize in ASIC hardware (Antminer, Whatsminer), GPU mining (RTX 4090, RX 7900), Stratum protocol, electricity arbitrage, overclocking (undervolting, memory timing), algorithm profitability (SHA-256, kHeavyHash, Etchash, RandomX, Scrypt), and cooling/thermal management.
Keep your response crisp, actionable, structured with bullet points or key metrics where helpful, and directly answer the miner's query.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Miner context: ${JSON.stringify(userContext || {})}. Miner Question: "${question}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      advice: response.text || "No response received.",
      source: "gemini-3.7-flash",
    });
  } catch (error: any) {
    console.error("AI Advisor Error:", error);
    res.json({
      advice: generateFallbackAdvice(req.body.question, req.body.language || "en"),
      source: "fallback_expert_engine",
    });
  }
});

function generateFallbackAdvice(question: string, lang: string): string {
  const q = (question || "").toLowerCase();

  if (q.includes("profit") || q.includes("best coin") || q.includes("roi")) {
    return `📊 **Current Optimal Mining Profitability Breakdown:**
1. **Kaspa (KAS - kHeavyHash):** High throughput and superior ASIC efficiency (e.g., KS5 Pro delivers ~21 TH/s at 3150W).
2. **Bitcoin (BTC - SHA-256):** Ideal for low-cost power (<$0.055/kWh) utilizing Antminer S21 (200 TH/s, 17.5 J/TH).
3. **Dogecoin/Litecoin (Scrypt Merged):** Dual reward stream delivers stable cashflow with Antminer L7.
💡 **Recommendation:** Lock in low-cost power contracts and use our dynamic Cloud Contracts to hedge difficulty jumps.`;
  }

  if (q.includes("overclock") || q.includes("temp") || q.includes("efficiency") || q.includes("power")) {
    return `⚡ **Hardware Optimization & Undervolting Guidelines:**
1. **Power Target:** Drop Power Limit to 75–82% to achieve peak Joules per Hash efficiency.
2. **Thermal Envelope:** Maintain Core Junction under 68°C and ASIC Hashboards below 72°C to prevent silicon degradation.
3. **Memory Frequency:** For memory-bound algos (Etchash/KawPOW), offset VRAM +900MHz to +1200MHz with tight timings.`;
  }

  return `🚀 **HashForge Pro Master Mining Recommendation:**
- **Pool Connection:** Select the geographically closest stratum node (e.g. EU Central or US East) to keep latency < 35ms and stale shares < 0.3%.
- **Auto-Switching:** Enable auto-profit switching across SHA-256 and kHeavyHash pools to maximize hourly yields.
- **Automated Payouts:** Set up your multi-coin wallet with automated threshold withdrawals to minimize counterparty exposure.`;
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HashForge Pro Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
