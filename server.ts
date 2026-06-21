import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));
const PORT = 3000;

// Dynamic list of hot global trends as baseline data (all English)
const baselineTrends = [
  // 1-3 years
  {
    keyword: "animated sensory baby music nursery rhymes",
    searchVolume: 320000,
    trendPercentage: 115,
    competition: "High" as const,
    difficultyScore: 72,
    avgCpc: 0.15,
    ageGroup: "1-3 years",
    subNiche: "Music & Sensory",
    intentDescription: "Parents play this video to soothe toddlers, encourage baby hand dancing, and teach simple words like clap or jump.",
    viewerVelocity: "Exploding 🚀" as const
  },
  {
    keyword: "3d animal sounds vocabulary learning game",
    searchVolume: 145000,
    trendPercentage: 80,
    competition: "Low" as const,
    difficultyScore: 28,
    avgCpc: 0.10,
    ageGroup: "1-3 years",
    subNiche: "Cognitive Shapes",
    intentDescription: "Interactive animal matching game where cute babies hear a dog bark or cat meow and point at their glowing TV screen.",
    viewerVelocity: "Spiking 📈" as const
  },
  {
    keyword: "colorful finger family sing along song",
    searchVolume: 95000,
    trendPercentage: 50,
    competition: "Medium" as const,
    difficultyScore: 40,
    avgCpc: 0.18,
    ageGroup: "1-3 years",
    subNiche: "Nursery Rhymes",
    intentDescription: "Extremely popular repetitive format mapping family roles (daddy, mommy) to cartoon finger characters.",
    viewerVelocity: "Steady ➡️" as const
  },
  // 3-5 years
  {
    keyword: "monster truck police rescue patrol kids movie",
    searchVolume: 380000,
    trendPercentage: 95,
    competition: "High" as const,
    difficultyScore: 78,
    avgCpc: 0.24,
    ageGroup: "3-5 years",
    subNiche: "Heroic Vehicles",
    intentDescription: "Toddlers love cartoon police cars, fire engines, and helicopters rescuing silly kittens or dealing with muddy roads.",
    viewerVelocity: "Spiking 📈" as const
  },
  {
    keyword: "baby dinosaur count 1 to 10 cartoon math",
    searchVolume: 190000,
    trendPercentage: 150,
    competition: "Medium" as const,
    difficultyScore: 35,
    avgCpc: 0.20,
    ageGroup: "3-5 years",
    subNiche: "First Math & STEM",
    intentDescription: "Friendly T-Rex or Triceratops characters chewing watermelons and helping kids learn simple intuitive count logic.",
    viewerVelocity: "Exploding 🚀" as const
  },
  {
    keyword: "how to draw simple cartoon vehicles claymation",
    searchVolume: 78000,
    trendPercentage: 60,
    competition: "Low" as const,
    difficultyScore: 21,
    avgCpc: 0.08,
    ageGroup: "3-5 years",
    subNiche: "Creativity & Art",
    intentDescription: "Simple steps drawing a happy train or truck accompanied by friendly guidance sounds.",
    viewerVelocity: "Steady ➡️" as const
  },
  // 5-8 years
  {
    keyword: "outer space galaxy exploration solar system kids",
    searchVolume: 110000,
    trendPercentage: 130,
    competition: "Low" as const,
    difficultyScore: 24,
    avgCpc: 0.28,
    ageGroup: "5-8 years",
    subNiche: "Space Kids Science",
    intentDescription: "Curious school kids learning about the Sun, Earth, Moon, Mars gravity, and Saturn's ring through friendly planet characters.",
    viewerVelocity: "Exploding 🚀" as const
  },
  {
    keyword: "bedtime magical cartoon fairy tales princess story",
    searchVolume: 160050,
    trendPercentage: 70,
    competition: "Medium" as const,
    difficultyScore: 45,
    avgCpc: 0.16,
    ageGroup: "5-8 years",
    subNiche: "Bedtime Wholesome",
    intentDescription: "Gentle narration with relaxing music for parents who play cozy bedtime stories to help kids fall asleep happily.",
    viewerVelocity: "Spiking 📈" as const
  },
  // 8-10 years
  {
    keyword: "kids detective solve school riddle mystery story",
    searchVolume: 105000,
    trendPercentage: 160,
    competition: "Medium" as const,
    difficultyScore: 42,
    avgCpc: 0.35,
    ageGroup: "8-10 years",
    subNiche: "Logic Riddles & IQ",
    intentDescription: "Pre-teens love to solve brain teasers and find who stole the school cake or which kid is wearing a funny disguise.",
    viewerVelocity: "Exploding 🚀" as const
  },
  {
    keyword: "minecraft blocky village sheep adventure animated",
    searchVolume: 240000,
    trendPercentage: 85,
    competition: "High" as const,
    difficultyScore: 68,
    avgCpc: 0.30,
    ageGroup: "8-10 years",
    subNiche: "Blocky Kids Adventures",
    intentDescription: "Silly pixel blocks comedy stories where villagers hold trades, run away from funny spiders, or build crazy mansions.",
    viewerVelocity: "Spiking 📈" as const
  }
];

// Helper to initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Helper to check environment key status
const getApiKeyStatus = () => {
  return {
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY
  };
};

// Helper for OpenAI call via fetch
async function generateViaOpenAI(prompt: string, systemInstruction: string, jsonMode = false) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in server environment.");
  }
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Connection Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// Helper to escape literal unescaped newlines and carriage returns inside JSON string values
function escapeNewlinesInJSONStrings(jsonStr: string): string {
  let insideString = false;
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      insideString = !insideString;
      result += char;
    } else if (insideString && char === '\n') {
      result += '\\n';
    } else if (insideString && char === '\r') {
      result += '\\r';
    } else {
      result += char;
    }
  }
  return result;
}

// Balance/repair unclosed brackets or braces at the end of truncated strings
function balanceJSONBrackets(jsonStr: string): string {
  let insideString = false;
  const stack: string[] = [];
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      insideString = !insideString;
    } else if (!insideString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }
  
  // Close unclosed string
  if (insideString) {
    jsonStr += '"';
  }
  
  // Close unclosed brackets/braces in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') {
      jsonStr += '}';
    } else if (open === '[') {
      jsonStr += ']';
    }
  }
  
  return jsonStr;
}

// Extractor that returns balanced outer JSON boundaries or fallback content
function extractBalancedJSON(text: string): string {
  let cleaned = text.trim();
  
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  }
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (_) {}

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  if (firstBrace === -1 && firstBracket === -1) {
    return cleaned;
  }

  const startIdx = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  const startChar = cleaned[startIdx];
  const endChar = startChar === "{" ? "}" : "]";

  let depth = 0;
  let insideString = false;
  let endIdx = -1;

  for (let i = startIdx; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '"' && (i === 0 || cleaned[i - 1] !== '\\')) {
      insideString = !insideString;
    } else if (!insideString) {
      if (char === startChar) {
        depth++;
      } else if (char === endChar) {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
  }

  if (endIdx !== -1) {
    return cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned.substring(startIdx);
}

// Robust JSON parse helper extracting and repairing JSON substring from text
function safeParseJson(text: string) {
  let cleaned = text.trim();
  
  // 1. Direct parse check
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // 2. Extract balanced or truncated block
  cleaned = extractBalancedJSON(cleaned);

  // 3. Simple cleanup of curly/smart quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

  // 4. Escape unescaped newlines inside string values
  cleaned = escapeNewlinesInJSONStrings(cleaned);

  // 5. Remove trailing commas
  cleaned = cleaned.replace(/,(\s*[\]}])/g, "$1");

  // 6. Balance brackets if truncated
  cleaned = balanceJSONBrackets(cleaned);

  // 7. Try parsing again
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    try {
      // Direct single-quote to double-quote conversion fallback
      let doubleQuoteAttempt = cleaned
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
        .replace(/\\'/g, "'");
      return JSON.parse(doubleQuoteAttempt);
    } catch (_) {}

    console.error("JSON parsing error on cleaned text:", cleaned);
    console.error("Original text:", text);
    throw new Error(`Failed to parse AI response. Raw output was: ${text.substring(0, 150)}...`);
  }
}

// Prunes massive JSON strings from Google GenAI error payloads for clean logging and diagnostic compliance
function cleanErrorMessage(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("limit")) {
    return "Quota Exceeded (429)";
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("temporary") || msg.includes("unavailable")) {
    return "Service Temporarily Unavailable / High Demand (503)";
  }
  if (msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("not found")) {
    return "Model Not Found / Unsupported (404)";
  }
  try {
    const parsed = JSON.parse(msg);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch (e) {}
  return msg.length > 150 ? msg.substring(0, 150) + "..." : msg;
}

// Helper to call Gemini model with automatic retries for transient errors (e.g. 503, 429)
async function callGeminiWithRetry(
  apiCallFn: () => Promise<any>,
  retries = 3,
  delayMs = 1200
): Promise<any> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCallFn();
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || "").toLowerCase();
      
      // Check if it's a 429 Rate Limit / Quota Exceeded error
      const rawStatus = err?.status || err?.code;
      const is429 = rawStatus === 429 || errMsg.includes("429");
      
      // Check if it's a hard non-transient quota limit (e.g., permanent monthly exhaustion or limit 0).
      const isQuotaLimit = !is429 && (
        errMsg.includes("quota") || 
        errMsg.includes("resource_exhausted") || 
        errMsg.includes("exceeded") || 
        errMsg.includes("limit: 0")
      );
      
      const isTransient = is429 || (!isQuotaLimit && (
        rawStatus === 503 || 
        rawStatus === "UNAVAILABLE" ||
        errMsg.includes("503") || 
        errMsg.includes("unavailable") || 
        errMsg.includes("high demand") || 
        errMsg.includes("temporary") ||
        errMsg.includes("service unavailable")
      ));
      
      if (isTransient && attempt < retries) {
        console.warn(`[Gemini Retry] Attempt ${attempt} failed with transient error: "${cleanErrorMessage(err)}". Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// Helper to rotate across recommended model options if the primary is exhausted or busy
async function callGeminiWithModelFallback(
  prompt: string,
  systemInstruction: string,
  responseMimeType: "application/json" | "text/plain" = "application/json"
): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Fallback System] Attempting generation with model: ${model}`);
      const ai = getGeminiClient();
      const response = await callGeminiWithRetry(() => 
        ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: responseMimeType
          }
        }),
        3, // Try 3 times per model to bypass transient hits
        1200 // 1.2 seconds base delay
      );
      if (response && response.text) {
        console.log(`[Gemini Fallback System] Success with model: ${model}`);
        return response;
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback System] Model ${model} failed: ${cleanErrorMessage(err)}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All fallback models were exhausted");
}

// REST API Endpoints

// 1. API key status check
app.get("/api/key-status", (req, res) => {
  res.json(getApiKeyStatus());
});

// 2. GET Trends
app.get("/api/trends", async (req, res) => {
  try {
    const ageFilter = req.query.age as string;
    let trends = [...baselineTrends];
    
    if (ageFilter) {
      trends = trends.filter(t => t.ageGroup === ageFilter);
    }
    
    res.json({
      success: true,
      trends: trends
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST Analyze Custom Keyword
app.post("/api/analyze-keyword", async (req, res) => {
  const { keyword, ageGroup } = req.body;
  if (!keyword || !ageGroup) {
    return res.status(400).json({ success: false, error: "Missing keyword or ageGroup parameter." });
  }

  try {
    const systemInstruction = `You are a world-class YouTube Kids SEO analyst specializing in automated children cartoon development pipelines.
    Analyze the provided keyword target for a children's audience aged ${ageGroup}.
    Return a detailed JSON object matching this exact schema:
    {
      "keyword": "${keyword}",
      "searchVolume": 120000, // estimated monthly global searches (randomly between 5,000 and 500,000)
      "trendPercentage": 82, // growth percentage today (%)
      "competition": "Low" or "Medium" or "High",
      "difficultyScore": 35, // integer 1-100 (lower score = easier to rank for new channels)
      "avgCpc": 0.18, // commercial proxy value (USD, between 0.05 and 1.50)
      "ageGroup": "${ageGroup}",
      "subNiche": "Subcategory name (e.g., Nursery Rhymes, Vehicles, Math)",
      "intentDescription": "In-depth description of why parents or small toddlers search this topic on YouTube",
      "viewerVelocity": "Exploding 🚀" or "Spiking 📈" or "Steady ➡️",
      "analyticsInDepth": "In-depth explanation of why this topic is highly viral right now for cartoon creators",
      "demographics": "Detailed children psychology behavior and parenting audience characteristics",
      "recommendations": ["A specific step-by-step production tip", "Another helpful visual design recommendation"]
    }`;

    let resultJsonString = "";
    const apiKeyStatus = getApiKeyStatus();
    let isFallback = false;
    let fallbackReason = "";

    if (apiKeyStatus.gemini) {
      try {
        const prompt = `Analyze YouTube Kids content keyword: "${keyword}" for target age ${ageGroup}. Strictly return JSON as requested without markdown wrapping wrappers.`;
        
        const response = await callGeminiWithModelFallback(prompt, systemInstruction, "application/json");
        resultJsonString = response.text || "{}";
      } catch (geminiErr: any) {
        console.warn("Gemini API call failed, using graceful backup generator:", geminiErr);
        isFallback = true;
        fallbackReason = geminiErr.message;
      }
    }

    if (!apiKeyStatus.gemini || isFallback || !resultJsonString || resultJsonString === "{}") {
      // Mocked Sandbox Data in full English
      const hash = keyword.length % 3;
      const vol = Math.floor(Math.random() * 160000) + 15000;
      const score = Math.floor(Math.random() * 45) + (hash === 0 ? 50 : 20);
      const trend = Math.floor(Math.random() * 100) + 30;

      const subNiches: Record<string, string> = {
        "1-3 years": "Musical Nursery Rhymes & Sensory Loops",
        "3-5 years": "Preschool Cognitive Hero Rescue Stories",
        "5-8 years": "Fantasy Bedtime tales & Science Explorer",
        "8-10 years": "Pixel Block Gaming comedy & Comic Riddles"
      };

      const customSimulated = {
        keyword: keyword,
        searchVolume: vol,
        trendPercentage: trend,
        competition: hash === 0 ? "High" : hash === 1 ? "Medium" : "Low",
        difficultyScore: score,
        avgCpc: parseFloat((Math.random() * 0.35 + 0.08).toFixed(2)),
        ageGroup: ageGroup,
        subNiche: subNiches[ageGroup] || "Creative Kids Animated Stories",
        intentDescription: `Small toddlers and preschool children love looking at cartoon objects related to "${keyword}". Parents often search for this specific term on Smart TVs, tablets, or phones during baby feeding times to keep their kids entertained with bright friendly visuals.`,
        viewerVelocity: trend > 75 ? "Exploding 🚀" : "Spiking 📈",
        analyticsInDepth: `The search term "${keyword}" utilizes organic child attraction toward friendly animal movements and bright colorful objects. Creators can quickly achieve a viral CTR loop by showcasing high contrast color combinations in the first five seconds of playback.`,
        demographics: `Primary listeners: children of age range ${ageGroup}. Primary click triggers: parents (Millennials or Gen Z) choosing safe wholesome digital media blocks.`,
        recommendations: [
          `Animate oversized sparkling eyes (Big Eyes Character Theory) to prompt instantaneous infant trust and warmth.`,
          `Synchronize key visual movements with happy audio bells or cartoon drum rhythms.`,
          `Keep the interactive question simple and congratulate children's guessed efforts instantly.`
        ],
        fallbackActive: isFallback,
        fallbackReasonText: fallbackReason || "sandbox"
      };
      
      resultJsonString = JSON.stringify(customSimulated);
    }

    const analyzed = safeParseJson(resultJsonString);
    res.json({ success: true, analyzed, fallbackActive: isFallback });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. POST Generate Video Script (Full English)
app.post("/api/generate-script", async (req, res) => {
  const { keyword, ageGroup, duration, pacing, tone, aiModel } = req.body;
  if (!keyword || !ageGroup) {
    return res.status(400).json({ success: false, error: "Missing keyword or age group parameter." });
  }

  const sanitizedKeyword = keyword.replace(/"/g, '\\"').replace(/\n/g, " ");
  const sanitizedAgeGroup = ageGroup.replace(/"/g, '\\"');
  const sanitizedDuration = (duration || "2 minutes").replace(/"/g, '\\"');

  const systemInstruction = `You are a premium children's cartoon screenwriter and animation director. 
  Construct an engaging, delightful, educational, and high-retention animation screenplay script for a YouTube video based on the provided keyword.
  The script MUST be translated, structured, and formatted in 100% fluent, vivid English, complete with sound effects and character guidelines.
  
  IMPORTANT CONSTRAINT FOR STABILITY:
  To prevent output truncation, please keep all descriptions and audio lines extremely crisp, bright, and concise (under 20 words per action/description).
  
  Return a beautiful, complete JSON object conforming strictly to this format:
  {
    "id": "random-script-string-id",
    "title": "An eye-catching, high-energy YouTube Video Title",
    "keyword": "${sanitizedKeyword}",
    "targetAge": "${sanitizedAgeGroup}",
    "videoDuration": "${sanitizedDuration}",
    "summary": "Short comforting summary explaining the storyline, moral lessons, and behavioral guidelines for parents (max 25 words)",
    "segments": [
      {
        "id": "seg-1",
        "sceneName": "Scene 1: Interactive Awakening (Hook)",
        "durationSeconds": 15,
        "visualDescription": "Bright crisp visual layout instruction describing cute cartoon character awakening (max 20 words).",
        "audioVoiceover": "Warm, welcoming voice-over narrator dialogue or high-energy character greeting in English (max 20 words).",
        "animationAction": "Exact physical animation cue, e.g., Panda waves happily (max 15 words).",
        "segmentType": "Hook"
      },
      {
        "id": "seg-2",
        "sceneName": "Scene 2: Introducing the Quest (Intro)",
        "durationSeconds": 15,
        "visualDescription": "Visual change showing color backdrop or interesting magical puzzle item (max 20 words).",
        "audioVoiceover": "Excited narrator establishing the fun quest of today (max 20 words).",
        "animationAction": "Character giggles with star-shaped bubbles (max 15 words).",
        "segmentType": "Intro"
      },
      {
        "id": "seg-3",
        "sceneName": "Scene 3: Deep Dive Adventure (Main)",
        "durationSeconds": 60,
        "visualDescription": "High activity animation sequence showing matching colors or cute counting gameplay (max 25 words).",
        "audioVoiceover": "Super cheerful sing-along style educational instruction line (max 20 words).",
        "animationAction": "Character bounces joyously in circles (max 15 words).",
        "segmentType": "Main"
      },
      {
        "id": "seg-4",
        "sceneName": "Scene 4: Brain Teaser Quiz (Engagement)",
        "durationSeconds": 20,
        "visualDescription": "Mini quiz display with 3 cartoon options and an adorable ticking clock (max 20 words).",
        "audioVoiceover": "Interactive question: Can you find where the panda is hiding? (max 18 words).",
        "animationAction": "Character cups ear waiting for kids to reply (max 15 words).",
        "segmentType": "Engagement"
      },
      {
        "id": "seg-5",
        "sceneName": "Scene 5: Happy Dance & Subscribe Call (CTA/Outro)",
        "durationSeconds": 10,
        "visualDescription": "Bright dancing SUBSCRIBE button popping on the screen with candy hearts (max 20 words).",
        "audioVoiceover": "Narrator congratulating the viewers and kindly asking to subscribe! (max 20 words).",
        "animationAction": "Characters wave hand in big warm goodbye gesture (max 15 words).",
        "segmentType": "CTA/Outro"
      }
    ],
    "promptForVoiceover": "Vocal guideline, e.g. bright sweet high-pitched voice acting (max 15 words)"
  }`;

  const prompt = `Write a premium animation script about "${keyword}" tailored for kids in ${ageGroup}. Expected Duration: ${duration}, Pacing: ${pacing}, Tone: ${tone}. Keep all values concise.`;

  try {
    let resultJsonString = "";
    const apiKeyStatus = getApiKeyStatus();
    let isFallback = false;
    let fallbackReason = "";

    if (aiModel === "openai" && apiKeyStatus.openai) {
      try {
        resultJsonString = await generateViaOpenAI(prompt, systemInstruction, true) || "{}";
      } catch (openaiErr: any) {
        console.warn("OpenAI API call failed, trying backup:", openaiErr);
        isFallback = true;
        fallbackReason = openaiErr.message;
      }
    } else if (apiKeyStatus.gemini) {
      try {
        const response = await callGeminiWithModelFallback(prompt, systemInstruction, "application/json");
        resultJsonString = response.text || "{}";
      } catch (geminiErr: any) {
        console.warn("Gemini API script call failed, using graceful backup generator:", geminiErr);
        isFallback = true;
        fallbackReason = geminiErr.message;
      }
    }

    if (!resultJsonString || resultJsonString === "{}" || isFallback || (!apiKeyStatus.gemini && (!apiKeyStatus.openai || aiModel !== "openai"))) {
      // High Quality Simulated Script in perfect English
      const mockScriptRes = {
        id: "mock-script-" + Math.floor(Math.random() * 10000),
        title: `The Magical Discovery: Wonderful World of ${keyword}! ✨`,
        keyword: keyword,
        targetAge: ageGroup,
        videoDuration: duration,
        summary: `An adorable episodic interactive cartoon screenplay designed to engage kids in the fundamental concepts of ${keyword}. Teaches physical activity coordination, color association, and logical sequence matching through dynamic play.`,
        segments: [
          {
            id: "seg-1",
            sceneName: "Scene 1: Interactive Awakening (Hook)",
            durationSeconds: 15,
            visualDescription: "A glorious lush candy-colored valley appears beneath rolling marshmallow clouds. Teddy Panda bumbles out of a giant bubble, waving excited furry paws.",
            audioVoiceover: "Hurray! Hello there, my little helper friends! Cozy Teddy is super happy today! Are we ready for a secret journey?",
            animationAction: "Teddy smiles widely, spins on one foot, and blows sparkling bubble stars toward the camera.",
            segmentType: "Hook"
          },
          {
            id: "seg-2",
            sceneName: "Scene 2: Introducing the Quest (Intro)",
            durationSeconds: 15,
            visualDescription: "A bright yellow rescue helper vehicle rolls in with small wooden blocks showing glowing numbers.",
            audioVoiceover: "Oh look! Our magic helper truck just delivered a wonderful glowing treasure! What could be inside, my friends?",
            animationAction: "The truck happily wiggles its front headlights as the rear chest hatches open with glowing fairy dust.",
            segmentType: "Intro"
          },
          {
            id: "seg-3",
            sceneName: "Scene 3: Deep Dive Adventure (Main)",
            durationSeconds: 60,
            visualDescription: "Interactive playground where the letters or shapes of your keyword come to life, jumping, color shifting, and doing funny acrobatic tricks.",
            audioVoiceover: `Let's dance and play while we learn! Isn't ${keyword} absolutely fantastic? Can you shout its spelling with Teddy?`,
            animationAction: "Teddy balances on top of a colorful balloon, bouncing joyfully to the background bell tunes.",
            segmentType: "Main"
          },
          {
            id: "seg-4",
            sceneName: "Scene 4: Brain Teaser Quiz (Engagement)",
            durationSeconds: 20,
            visualDescription: "Three cute cartoon doors appear - one Red, one Blue, and one Gold. A shining cartoon star zips around testing kids.",
            audioVoiceover: "Quick! Where is our tiny bouncing star hiding? Can you spot it? Is it behind the blue door? Let's guess in 3 seconds!",
            animationAction: "Teddy holds his paw to his big ear, staring curiously and waiting in eager excitement.",
            segmentType: "Engagement"
          },
          {
            id: "seg-5",
            sceneName: "Scene 5: Happy Dance & Subscribe Call (CTA/Outro)",
            durationSeconds: 10,
            visualDescription: "The screen fills with floating red heart bubbles and a dancing cartoon Subscribe plaque.",
            audioVoiceover: "Sweet job, kids! You did amazing! Ring the bell and click Subscribe for more daily adventures with Teddy! See you next time!",
            animationAction: "Teddy and the helper truck do a coordinated high-five dance, waving enthusiastic goodbye kisses.",
            segmentType: "CTA/Outro"
          }
        ],
        promptForVoiceover: "Use a gentle, warm female voice-over with rhythmic high-and-low melodic intonations similar to top-producing preschool voice actors.",
        fallbackActive: isFallback,
        fallbackReasonText: fallbackReason || "sandbox"
      };
      
      resultJsonString = JSON.stringify(mockScriptRes);
    }

    const scriptData = safeParseJson(resultJsonString);
    res.json({ success: true, script: scriptData, fallbackActive: isFallback });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. POST Generate Thumbnail Concept and Titles (Full English)
app.post("/api/generate-thumbnail-concept", async (req, res) => {
  const { keyword, styleType } = req.body;
  if (!keyword) {
    return res.status(400).json({ success: false, error: "Missing keyword parameter." });
  }

  const sanitizedKeyword = keyword.replace(/"/g, '\\"').replace(/\n/g, " ");
  const sanitizedStyle = (styleType || "Cute 3D Pixar").replace(/"/g, '\\"');

  const systemInstruction = `You are a legendary YouTube Kids thumbnail artist, graphic director, and animation screenwriter.
  Analyze the current kids trend keyword and return a beautiful JSON spec containing exactly 5 high-CTR English titles, detailed graphic elements instructions, and a specific screenplay scene generation prompt.
  
  CRITICAL CONSTRAINT FOR TOKEN STABILITY:
  To prevent output truncation, you MUST keep all description fields extremely concise and short. Keep the total JSON payload brief (under 250 words total).
  
  Return a structured JSON object matching this schema exactly:
  {
    "id": "thumb-concept-id-abc",
    "keyword": "${sanitizedKeyword}",
    "styleType": "${sanitizedStyle}",
    "suggestedTitles": [
      "Title option 1 with highly clickable kids humor",
      "Title option 2 teasing curiosity or a fun question",
      "Title option 3 with bold visual keywords",
      "Title option 4",
      "Title option 5"
    ],
    "focusElements": [
      "Main character description: big smiling eyes (max 10 words)",
      "High contrast bright item to catch attention (max 10 words)",
      "Subtle highlight or cute sticker element (max 10 words)"
    ],
    "colorScheme": "Vivid glowing high-contrast scheme (max 10 words)",
    "backgroundIdea": "Clean, colorful outer environment without messy details (max 12 words)",
    "overlayText": "Short 2 to 3-word bold capitalized text printed in thick cartoon borders",
    "aiImagePrompt": "A very concise highly descriptive prompt under 20 words for Midjourney/Imagen, kids cartoon illustration style, Pixar look.",
    "scriptScenesPrompt": "A single-sentence comprehensive prompt under 25 words summarizing the storytelling vision, cute sound effects, and celebratory cues."
  }`;

  const prompt = `Propose an English thumbnail spec for keyword "${keyword}" styled with "${styleType || "Cute 3D Pixar"}". Ensure extreme conciseness for all values.`;

  try {
    let resultJsonString = "";
    const apiKeyStatus = getApiKeyStatus();
    let isFallback = false;
    let fallbackReason = "";

    if (apiKeyStatus.gemini) {
      try {
        const response = await callGeminiWithModelFallback(prompt, systemInstruction, "application/json");
        resultJsonString = response.text || "{}";
      } catch (geminiErr: any) {
        console.warn("Gemini API thumbnail concept call failed, using graceful backup generator:", geminiErr);
        isFallback = true;
        fallbackReason = geminiErr.message;
      }
    }

    if (!apiKeyStatus.gemini || isFallback || !resultJsonString || resultJsonString === "{}") {
      // Return beautiful simulated English thumbnail specifications
      const simulatedThumb = {
        id: "thumb-mock-" + Math.floor(Math.random() * 1000),
        keyword: keyword,
        styleType: styleType || "Cute 3D Pixar",
        suggestedTitles: [
          `😱 The Epic Rescue Race of ${keyword}!`,
          `Let's Learn ${keyword}! (Super Fun Game for Kids)`,
          `Can Teddy Panda Find All ${keyword}?`,
          `Counting Cars Adventures and ${keyword}`,
          `Don't Laugh! Simple Toy Riddles about ${keyword}`
        ],
        focusElements: [
          `Teddy Panda with huge glistening glowing eyes, sitting on a giant lollipop`,
          `A glossy red balloon inflated with stars, positioned to catch eye focus in 0.1 seconds`,
          `Thick drop-shadow borders around key elements`
        ],
        colorScheme: "Super bright neon yellow sun aura, watermelon green borders, and bold cherry red overlays",
        backgroundIdea: "A cheerful wonderland made of clean clay bricks with a soft purple marshmallow-cloud sky",
        overlayText: "SO MUCH FUN!",
        aiImagePrompt: `A gorgeous vibrant 3D Pixar animated screen capture of a cute baby panda holding a glowing balloon, giant sparkling eyes, marshmallow clouds background, detailed soft fur, daylight pastel color palette, cheerful children storybook, volumetric lighting, Octane render 3D, --ar 16:9`,
        scriptScenesPrompt: `Generate a high-retaining kids cartoon video screenplay setup based on the title "${keyword}". The screenplay should have 3 segments: 1. Catchy sensory opener showing a giant friendly character. 2. A mini playful problem-solving game with sound prompts (e.g. "Whoosh! What's that?"). 3. High-energy celebratory nursery dance scene with bright overlay sparks.`,
        fallbackActive: isFallback,
        fallbackReasonText: fallbackReason || "sandbox"
      };
      resultJsonString = JSON.stringify(simulatedThumb);
    }

    const thumbConcept = safeParseJson(resultJsonString);
    res.json({ success: true, thumbConcept, fallbackActive: isFallback });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to generate a gorgeous 16:9 kid-friendly SVG fallback illustration
function generateSvgFallback(promptText: string): string {
  let subject = "LIVE MOCKUP";
  const lowercasePrompt = promptText.toLowerCase();
  
  if (lowercasePrompt.includes("panda")) subject = "TEDDY PANDA";
  else if (lowercasePrompt.includes("dinosaur") || lowercasePrompt.includes("trex") || lowercasePrompt.includes("dino")) subject = "BABY DINO";
  else if (lowercasePrompt.includes("truck") || lowercasePrompt.includes("car") || lowercasePrompt.includes("police") || lowercasePrompt.includes("vehicle")) subject = "FUN CARS";
  else if (lowercasePrompt.includes("space") || lowercasePrompt.includes("sun") || lowercasePrompt.includes("moon") || lowercasePrompt.includes("galaxy") || lowercasePrompt.includes("planet")) subject = "OUTER SPACE";
  else if (lowercasePrompt.includes("princess") || lowercasePrompt.includes("fairy") || lowercasePrompt.includes("bedtime")) subject = "COZY STORIES";
  else if (lowercasePrompt.includes("detective") || lowercasePrompt.includes("mystery") || lowercasePrompt.includes("riddle")) subject = "KIDS RIDDLE";
  else if (lowercasePrompt.includes("minecraft")) subject = "BLOCKY VILLAGE";
  else {
    const matches = promptText.match(/(?:cute|vibrant|beautiful|adventure|amazing)\s+([a-zA-Z]+)/i);
    if (matches && matches[1]) {
      subject = matches[1].toUpperCase();
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFDEE9;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FEE140;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B5FFFC;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="10" dy="15" stdDeviation="8" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <rect width="1280" height="720" fill="url(#bg)" rx="32" />
  
  <circle cx="250" cy="200" r="120" fill="#FF7B9C" opacity="0.35" />
  <circle cx="1020" cy="520" r="160" fill="#4D96FF" opacity="0.3" />
  <circle cx="950" cy="180" r="90" fill="#6BCB77" opacity="0.3" />
  <circle cx="180" cy="550" r="100" fill="#FDFFB6" opacity="0.5" />
  
  <rect x="180" y="100" width="920" height="520" rx="30" fill="#FFFFFF" fill-opacity="0.92" filter="url(#shadow)" />
  
  <g fill="#FFAA00" opacity="0.7">
    <path d="M 640,70 L 643,80 L 653,83 L 643,86 L 640,96 L 637,86 L 627,83 L 637,80 Z" transform="scale(1.5) translate(-200, 40)" />
    <path d="M 640,70 L 643,80 L 653,83 L 643,86 L 640,96 L 637,86 L 627,83 L 637,80 Z" transform="scale(1.2) translate(180, 200)" />
  </g>
  
  <g transform="translate(640, 290)">
    <circle cx="-90" cy="-60" r="50" fill="#475569" />
    <circle cx="90" cy="-60" r="50" fill="#475569" />
    <circle cx="-90" cy="-60" r="30" fill="#FDA4AF" />
    <circle cx="90" cy="-60" r="30" fill="#FDA4AF" />
    
    <circle cx="0" cy="0" r="110" fill="#475569" />
    <circle cx="0" cy="10" r="95" fill="#FFFFFF" />
    
    <circle cx="-40" cy="-10" r="24" fill="#1E293B" />
    <circle cx="40" cy="-10" r="24" fill="#1E293B" />
    
    <circle cx="-32" cy="-18" r="9" fill="#FFFFFF" />
    <circle cx="48" cy="-18" r="9" fill="#FFFFFF" />
    <circle cx="-45" cy="-2" r="4" fill="#FFFFFF" />
    <circle cx="35" cy="-2" r="4" fill="#FFFFFF" />
    
    <circle cx="-65" cy="25" r="15" fill="#FF8B94" opacity="0.8" />
    <circle cx="65" cy="25" r="15" fill="#FF8B94" opacity="0.8" />
    
    <path d="M -15 25 Q 0 38 15 25" stroke="#1E293B" stroke-width="7" fill="none" stroke-linecap="round" />
  </g>

  <text x="640" y="475" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="28" fill="#475569" letter-spacing="4">
    KIDS CARTOON MOCKUP
  </text>
  
  <rect x="340" y="495" width="600" height="70" rx="20" fill="#FFEAA7" opacity="0.9" filter="url(#shadow)" />
  
  <text x="640" y="545" text-anchor="middle" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="44" fill="#D35400">
    ${subject}
  </text>
  
  <rect x="520" y="585" width="240" height="26" rx="8" fill="#F87171" />
  <text x="640" y="602" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="11" fill="#FFFFFF">
    DYNAMIC OFFLINE SPEC
  </text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// 6. Optional: Generate actual mockup Image based on key
app.post("/api/generate-thumbnail-image", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: "Missing prompt value." });
  }

  const apiKeyStatus = getApiKeyStatus();
  if (!apiKeyStatus.gemini) {
    // If API key is missing, dynamically fallback immediately and indicate state is active safely!
    const fallbackImage = generateSvgFallback(prompt);
    return res.json({ 
      success: true, 
      imageUrl: fallbackImage,
      fallbackActive: true,
      fallbackReason: "Missing API key in workspace environment."
    });
  }

  try {
    const ai = getGeminiClient();
    let base64Image = "";
    let format = "png";
    let fallbackHappened = false;
    let finalError: any = null;

    // Step 1: Try gemini-2.5-flash-image
    try {
      console.log("[Imagen Fallback System] Attempting generation with model: gemini-2.5-flash-image");
      const response = await callGeminiWithRetry(() => 
        ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                text: `${prompt}. Beautiful playful animation, high-contrast, children storybook illustration style, perfect for YouTube Kids thumbnail.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          },
        }),
        1, // Try 1 time to fast fallback since images quotas are narrow
        1000
      );

      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            format = "png";
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn("[Imagen Fallback System] gemini-2.5-flash-image failed:", cleanErrorMessage(err));
      finalError = err;
    }

    // Step 2: Try gemini-3.1-flash-image if first attempt failed
    if (!base64Image) {
      try {
        console.log("[Imagen Fallback System] Attempting generation with model: gemini-3.1-flash-image");
        const response = await callGeminiWithRetry(() => 
          ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: {
              parts: [
                {
                  text: `${prompt}. Beautiful playful animation, high-contrast, children storybook illustration style, perfect for YouTube Kids thumbnail.`,
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: "16:9"
              }
            },
          }),
          1,
          1000
        );

        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              base64Image = part.inlineData.data;
              format = "png";
              break;
            }
          }
        }
      } catch (err: any) {
        console.warn("[Imagen Fallback System] gemini-3.1-flash-image failed:", cleanErrorMessage(err));
        finalError = err;
      }
    }

    // Step 3: Try imagen-4.0-generate-001 if gemini flash-image models failed
    if (!base64Image) {
      try {
        console.log("[Imagen Fallback System] Attempting generation with model: imagen-4.0-generate-001");
        const response = await callGeminiWithRetry(() => 
          ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: `${prompt}. Beautiful playful animation, high-contrast, children storybook illustration style, perfect for YouTube Kids thumbnail.`,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: "16:9"
            }
          }),
          1,
          1000
        );

        if (response?.generatedImages?.[0]?.image?.imageBytes) {
          base64Image = response.generatedImages[0].image.imageBytes;
          format = "jpeg";
        }
      } catch (err: any) {
        console.warn("[Imagen Fallback System] imagen-4.0-generate-001 failed:", cleanErrorMessage(err));
        finalError = err;
      }
    }

    // Send response or default mockup SVG
    if (base64Image) {
      res.json({ 
        success: true, 
        imageUrl: `data:image/${format};base64,${base64Image}` 
      });
    } else {
      console.warn("All image models failed or returned empty canvases, reverting to vector layout fallback system.");
      const fallbackImage = generateSvgFallback(prompt);
      res.json({ 
        success: true, 
        imageUrl: fallbackImage,
        fallbackActive: true,
        fallbackReason: finalError?.message || "All image generation modules high demand or restricted."
      });
    }

  } catch (error: any) {
    console.warn("Fatal error in progressive image fallback flow:", error);
    const fallbackImage = generateSvgFallback(prompt);
    res.json({ 
      success: true, 
      imageUrl: fallbackImage,
      fallbackActive: true,
      fallbackReason: error.message || "Progressive image generator run completed with exceptions."
    });
  }
});


// 7. POST Generate Titles and Descriptions (Full English/Vietnamese Support)
app.post("/api/generate-titles-descriptions", async (req, res) => {
  const { keyword, ageGroup } = req.body;
  if (!keyword || !ageGroup) {
    return res.status(400).json({ success: false, error: "Missing keyword or ageGroup parameter." });
  }

  try {
    const systemInstruction = `You are a world-class YouTube Kids SEO analyst.
    Propose exactly 5 catchy, fun, kid-safe video titles with matching high-retention descriptions.
    The titles must feature relevant emojis, high-energy kids vocabulary, and clear audience hook triggers.
    The descriptions must be optimized for search discovery with kid-safe terms, short storyline hints, educational questions, and hashtags.
    Strictly return a clean JSON object conforming to this schema:
    {
      "options": [
        {
          "title": "Title description",
          "description": "Video description with hashtags"
        }
      ]
    }`;

    const prompt = `Develop 5 distinct high-clickability Title and Description options for target keyword: "${keyword}" and targeted age group: "${ageGroup}".`;

    let resultJsonString = "";
    const apiKeyStatus = getApiKeyStatus();
    let isFallback = false;

    if (apiKeyStatus.gemini) {
      try {
        const response = await callGeminiWithModelFallback(prompt, systemInstruction, "application/json");
        resultJsonString = response.text || "{}";
      } catch (geminiErr: any) {
        console.warn("Gemini titles-descriptions call failed, reverting to sandbox generator:", geminiErr);
        isFallback = true;
      }
    }

    if (!apiKeyStatus.gemini || isFallback || !resultJsonString || resultJsonString === "{}") {
      const simulated = {
        options: [
          {
            title: `🎈 Can You Guess the ${keyword}? (Fun Toddler Learning Game!)`,
            description: `Welcome to our magical world! Today, we are playing a super fun interactive learning game guessing all about ${keyword}! Perfect for infants and young kids to learn colors and shapes. \n\n#kidslearning #toddlergames #${keyword.replace(/\s+/g, '')}`
          },
          {
            title: `🦖 Tiny Dino Finds a Giant ${keyword}! - Preschool Story`,
            description: `Oh no! Baby Rex found a giant sparkling ${keyword} in the forest! Join us on this amazing adventure as we sing, dance, and solve preschool quests together!\n\n#kidsanimation #cartoonadventure #${keyword.replace(/\s+/g, '')}`
          },
          {
            title: `🚗 Beep Beep! The Friendly Truck and ${keyword} Adventure`,
            description: `Leo the Truck is delivering some colorful ${keyword} to the playground! Learn counting, object naming, and child psychology milestones in this playful episode for modern parents.\n\n#preschool #educationalcartoons #${keyword.replace(/\s+/g, '')}`
          },
          {
            title: `🌟 Sweet Bedtime Lullabies and Cozy ${keyword} Stories`,
            description: `Relax and drift to sleep with our soothing sleep-guided watercolor storyline helping toddlers fall asleep gently. Soft instrumental music and counting ${keyword}.\n\n#bedtimestories #babycalm #${keyword.replace(/\s+/g, '')}`
          },
          {
            title: `🤪 Don't Laugh Challenge! Funny Toys and ${keyword} Pranks`,
            description: `Get ready to giggle! Our cute plush friends are testing funny toy riddles and surprising silly ${keyword} actions today! High contrast and extreme amusement.\n\n#funnykids #toychallenge #${keyword.replace(/\s+/g, '')}`
          }
        ]
      };
      resultJsonString = JSON.stringify(simulated);
    }

    const parsed = safeParseJson(resultJsonString);
    res.json({ success: true, options: parsed.options || [], fallbackActive: isFallback });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Serve SPA statically
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on address http://0.0.0.0:${PORT}`);
  });
}

startServer();
