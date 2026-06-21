import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Search, 
  Layers, 
  Compass, 
  Lightbulb, 
  FileText, 
  Sparkles, 
  Bot, 
  HelpCircle, 
  Copy, 
  Check, 
  TrendingUp, 
  Eye, 
  Volume2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Monitor,
  Video,
  Download,
  AlertCircle,
  Image as ImageIcon,
  Play,
  RotateCw,
  Info,
  Bookmark,
  CheckCircle
} from "lucide-react";
import { YouTubeKeyword, VideoScript, ThumbnailConcept, AgeGuideline } from "./types";
import { AgeGuide } from "./components/AgeGuide";
import { TRANSLATIONS } from "./translations";

const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type");
  
  if (!res.ok || !contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    let errMsg = `Server returned status ${res.status}`;
    try {
      const potentialJson = JSON.parse(text);
      if (potentialJson && (potentialJson.error || potentialJson.message)) {
        errMsg = potentialJson.error || potentialJson.message;
      }
    } catch (_) {
      const trimmed = text.trim();
      if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<!DOCTYPE")) {
        errMsg = "The application server is offline or restarting. Please wait a few seconds and try again.";
      } else if (text.length > 0 && text.length < 150) {
        errMsg = `${errMsg}: ${trimmed}`;
      }
    }
    throw new Error(errMsg);
  }
  return res.json();
};

export default function App() {
  // Language Switch State
  const [lang, setLang] = useState<"en" | "vi" | any>(() => {
    try {
      const saved = localStorage.getItem("yt_kids_lang");
      return (saved === "vi" || saved === "en") ? saved : "en";
    } catch {
      return "en";
    }
  });

  const t = TRANSLATIONS[lang as "en" | "vi"] || TRANSLATIONS.en;

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "vi" : "en";
    setLang(newLang);
    try {
      localStorage.setItem("yt_kids_lang", newLang);
    } catch (e) {
      console.warn("Storage write blocked:", e);
    }
  };

  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "analyzer" | "thumbnail" | "script">("dashboard");

  // State management
  const [keywordList, setKeywordList] = useState<YouTubeKeyword[]>([]);
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>("");
  const [isLoadingTrends, setIsLoadingTrends] = useState<boolean>(false);
  const [apiKeysStatus, setApiKeysStatus] = useState<{ gemini: boolean; openai: boolean }>({ gemini: false, openai: false });

  // Custom Keyword Analyzer State
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("3-5 years");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedKeyword, setAnalyzedKeyword] = useState<any>(null);

  // Thumbnail Engine State
  const [thumbKeyword, setThumbKeyword] = useState<string>("");
  const [thumbStyle, setThumbStyle] = useState<string>("Cute 3D Pixar");
  const [isDesigningThumb, setIsDesigningThumb] = useState<boolean>(false);
  const [designedThumb, setDesignedThumb] = useState<ThumbnailConcept | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [selectedDescription, setSelectedDescription] = useState<string>("");
  const [generatedTitlesAndDescs, setGeneratedTitlesAndDescs] = useState<any[]>([]);
  const [isGeneratingTitlesAndDescs, setIsGeneratingTitlesAndDescs] = useState<boolean>(false);
  const [isRefiningTitle, setIsRefiningTitle] = useState<boolean>(false);
  
  // Real Mockup generation (using server-side Gemini Image generation)
  const [isGeneratingMockImage, setIsGeneratingMockImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  // Error States
  const [analyzerError, setAnalyzerError] = useState<string>("");
  const [thumbnailError, setThumbnailError] = useState<string>("");
  const [scriptError, setScriptError] = useState<string>("");

  // Fallback States
  const [analyzerFallback, setAnalyzerFallback] = useState<boolean>(false);
  const [thumbnailFallback, setThumbnailFallback] = useState<boolean>(false);
  const [scriptFallback, setScriptFallback] = useState<boolean>(false);
  const [imageFallback, setImageFallback] = useState<boolean>(false);

  // Script Builder State
  const [scriptKeyword, setScriptKeyword] = useState<string>("");
  const [scriptAge, setScriptAge] = useState<string>("3-5 years");
  const [scriptDuration, setScriptDuration] = useState<string>("3-5 minutes");
  const [scriptPacing, setScriptPacing] = useState<string>("Moderate, playful & cheerful");
  const [scriptTone, setScriptTone] = useState<string>("Sweet, interactive, educational & humorous");
  const [scriptModel, setScriptModel] = useState<"gemini" | "openai">("gemini");
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<VideoScript | null>(null);

  // Feedbacks
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

  // Fetch trend and Key statuses
  const fetchTrends = async (age = "") => {
    setIsLoadingTrends(true);
    try {
      const data = await safeFetchJson(`/api/trends?age=${encodeURIComponent(age)}`);
      if (data.success) {
        setKeywordList(data.trends);
      }
    } catch (e) {
      console.error("Error loading trending keywords:", e);
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const fetchKeysStatus = async () => {
    try {
      const data = await safeFetchJson("/api/key-status");
      setApiKeysStatus(data);
    } catch (e) {
      console.error("Error querying API keys status:", e);
    }
  };

  useEffect(() => {
    fetchTrends();
    fetchKeysStatus();
  }, []);

  const handleAgeFilterChange = (age: string) => {
    setSelectedAgeFilter(age);
    fetchTrends(age);
  };

  // 1. Keyword Analysis Trigger
  const handleAnalyzeKeyword = async (targetKw?: string, targetAge?: string) => {
    const kw = targetKw || customKeyword;
    const age = targetAge || selectedAgeGroup;

    if (!kw.trim()) return;

    setIsAnalyzing(true);
    setAnalyzerError("");
    setAnalyzerFallback(false);
    setActiveTab("analyzer");
    
    // Clear and reset state for the next pipeline runs
    setGeneratedTitlesAndDescs([]);
    setSelectedTitle("");
    setSelectedDescription("");

    if (!targetKw) {
      setCustomKeyword(kw);
    }

    try {
      const data = await safeFetchJson("/api/analyze-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, ageGroup: age })
      });
      if (data.success) {
        setAnalyzedKeyword(data.analyzed);
        setAnalyzerFallback(!!data.fallbackActive);
        
        // Sync to other builders for streamlined UX
        setThumbKeyword(kw);
        setScriptKeyword(kw);
        setScriptAge(age);

        // Auto-generate title suggestions immediately for the user
        setIsGeneratingTitlesAndDescs(true);
        try {
          const titleData = await safeFetchJson("/api/generate-titles-descriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword: kw, ageGroup: age })
          });
          if (titleData.success && titleData.options) {
            setGeneratedTitlesAndDescs(titleData.options);
          }
        } catch (titleErr) {
          console.error("Auto titles gen failed", titleErr);
        } finally {
          setIsGeneratingTitlesAndDescs(false);
        }

      } else {
        setAnalyzerError(data.error || "Analysis was not successful. Please verify server connection.");
      }
    } catch (e: any) {
      console.error("Failed to analyze keyword:", e);
      setAnalyzerError("Network or server connection error: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateTitlesAndDescs = async () => {
    if (!analyzedKeyword) return;
    setIsGeneratingTitlesAndDescs(true);
    try {
      const data = await safeFetchJson("/api/generate-titles-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: analyzedKeyword.keyword,
          ageGroup: analyzedKeyword.ageGroup
        })
      });
      if (data.success && data.options) {
        setGeneratedTitlesAndDescs(data.options);
      }
    } catch (err) {
      console.error("Failed to generate titles & descriptions", err);
    } finally {
      setIsGeneratingTitlesAndDescs(false);
    }
  };

  // 2. Thumbnail Concept Trigger
  const handleDesignThumbnail = async (e?: React.FormEvent, overrideKeyword?: string) => {
    if (e) e.preventDefault();
    const keywordToUse = overrideKeyword || thumbKeyword;
    if (!keywordToUse.trim()) return;

    setIsDesigningThumb(true);
    if (!overrideKeyword) {
      setSelectedTitle("");
    }
    setIsRefiningTitle(false);
    setThumbnailError("");
    setThumbnailFallback(false);
    setGeneratedImageUrl("");
    setImageError("");
    try {
      const data = await safeFetchJson("/api/generate-thumbnail-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keywordToUse, styleType: thumbStyle })
      });
      if (data.success) {
        setDesignedThumb(data.thumbConcept);
        setThumbnailFallback(!!data.fallbackActive);
        if (overrideKeyword) {
          setSelectedTitle(overrideKeyword);
        } else if (data.thumbConcept.suggestedTitles && data.thumbConcept.suggestedTitles.length > 0) {
          setSelectedTitle(data.thumbConcept.suggestedTitles[0]);
        } else {
          setSelectedTitle(keywordToUse);
        }
      } else {
        setThumbnailError(data.error || "Thumbnail generation failed.");
      }
    } catch (err: any) {
      console.error("Failed to generate thumbnail concept:", err);
      setThumbnailError("Network or server connection error: " + err.message);
    } finally {
      setIsDesigningThumb(false);
    }
  };

  const handleSelectTitle = async (title: string) => {
    setSelectedTitle(title);
    setIsRefiningTitle(true);
    setThumbnailError("");
    setGeneratedImageUrl("");
    setImageError("");
    setImageFallback(false);
    
    // Auto-trigger professional kids screenplay builder simultaneously
    setScriptKeyword(title);
    handleGenerateScript(undefined, title);
    
    try {
      const data = await safeFetchJson("/api/generate-thumbnail-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: title, styleType: thumbStyle })
      });
      if (data.success) {
        setDesignedThumb(prev => prev ? {
          ...data.thumbConcept,
          suggestedTitles: prev.suggestedTitles // Keep original 5 options
        } : data.thumbConcept);
        setThumbnailFallback(!!data.fallbackActive);
      } else {
        setThumbnailError(data.error || "Failed to refine details for this selected title.");
      }
    } catch (err: any) {
      console.error("Failed to refine title details:", err);
      setThumbnailError("Network error while refining details: " + err.message);
    } finally {
      setIsRefiningTitle(false);
    }
  };

  // 3. Generate Mockup Image via Imagen
  const handleGenerateMockupImage = async () => {
    if (!designedThumb?.aiImagePrompt) return;
    setIsGeneratingMockImage(true);
    setImageError("");
    setImageFallback(false);
    try {
      const data = await safeFetchJson("/api/generate-thumbnail-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: designedThumb.aiImagePrompt })
      });
      if (data.success) {
        setGeneratedImageUrl(data.imageUrl);
        setImageFallback(!!data.fallbackActive);
      } else {
        setImageError(data.error || "Could not generate image. Please check API key configuration.");
      }
    } catch (err: any) {
      setImageError("System connection error: " + err.message);
    } finally {
      setIsGeneratingMockImage(false);
    }
  };

  // 4. Script Generation Trigger
  const handleGenerateScript = async (e?: React.FormEvent, overrideKeyword?: string) => {
    if (e) e.preventDefault();
    const keywordToUse = overrideKeyword || scriptKeyword;
    if (!keywordToUse.trim()) return;

    setIsGeneratingScript(true);
    setScriptError("");
    setScriptFallback(false);
    try {
      const data = await safeFetchJson("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keywordToUse,
          ageGroup: scriptAge,
          duration: scriptDuration,
          pacing: scriptPacing,
          tone: scriptTone,
          aiModel: scriptModel
        })
      });
      if (data.success) {
        setGeneratedScript(data.script);
        setScriptFallback(!!data.fallbackActive);
      } else {
        setScriptError(data.error || "Script generation was not successful.");
      }
    } catch (e: any) {
      console.error("Failed to generate script:", e);
      setScriptError("Network or server connection error: " + e.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Helper copy content
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Shortcut quick prefill helper
  const handleQuickUseKeyword = (kw: string, age: string) => {
    setCustomKeyword(kw);
    setSelectedAgeGroup(age);
    handleAnalyzeKeyword(kw, age);
  };

  return (
    <div id="main-workflow-root" className="min-h-screen text-slate-900 selection:bg-rose-200 selection:text-neutral-900 font-sans pb-16">
      
      {/* Dynamic Upper Accent Bar */}
      <div className="bg-slate-900 h-3 w-full border-b-2 border-slate-900"></div>

      {/* Main Header navigation and Branding */}
      <header id="page-header" className="bg-white border-3 border-slate-900 sticky top-3 z-40 shadow-[4px_4px_0px_#1f2937] rounded-2xl max-w-7xl mx-auto my-3 px-3 sm:px-5 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center py-2.5 gap-3">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="bg-rose-400 p-1.5 rounded-xl text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937] animate-bounce-slow">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[8px] font-black text-[#fb7185] uppercase tracking-wider block">YOUTUBE KIDS STUDIO</span>
                <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight">AnimateKids <span className="bg-[#fb923c] text-white px-1.5 py-0.5 rounded-md border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#1f2937] text-xs">Global Planner</span></h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1.5 bg-slate-100 p-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937]">
              <button
                id="nav-btn-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#60a5fa] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] scale-102"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {t.navTrends}
              </button>
              <button
                id="nav-btn-analyzer"
                onClick={() => setActiveTab("analyzer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === "analyzer"
                    ? "bg-[#fb7185] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] scale-102"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {t.navAnalyzer}
              </button>
              <button
                id="nav-btn-thumbnail"
                onClick={() => setActiveTab("thumbnail")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === "thumbnail"
                    ? "bg-[#4ade80] text-slate-900 border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] scale-102"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                {lang === "en" ? "Thumbnail & Script" : "Thumbnail & Kịch Bản"}
              </button>
            </nav>

            {/* Config & status indicator & Lang Toggle */}
            <div className="flex items-center gap-2">
              {/* Language Switch Button */}
              <button
                id="lang-switcher-btn"
                onClick={toggleLanguage}
                title={t.langSwitch}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white hover:bg-rose-50 border-2 border-slate-900 transition-all cursor-pointer shadow-[2px_2px_0px_#1f2937] active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>🌐</span>
                <span className="flex items-center gap-1 font-black">
                  <span className={lang === "en" ? "text-rose-600" : "text-slate-400 font-normal"}>EN</span>
                  <span className="text-slate-500 font-light font-sans">/</span>
                  <span className={lang === "vi" ? "text-rose-600" : "text-slate-400 font-normal"}>VI</span>
                </span>
              </button>

              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937] ${
                apiKeysStatus.openai ? 'bg-[#4ade80] text-slate-900' : 'bg-[#60a5fa] text-white'
              }`}>
                <Bot className="w-3.5 h-3.5" />
                {apiKeysStatus.openai ? t.gptReady : t.geminiActive}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Warning banner when GEMINI_API_KEY is not configured */}
      {!apiKeysStatus.gemini && (
        <div className="max-w-7xl mx-auto px-4 mb-2">
          <div className="bg-[#fb923c] text-slate-900 border-3 border-slate-900 text-xs md:text-sm text-center py-3 px-4 font-black rounded-2xl shadow-[4px_4px_0px_#1f2937] flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-900 shrink-0 animate-pulse" />
            <span>{t.sandboxWarning}</span>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mobile quick-tabs selector */}
        <div className="flex md:hidden bg-slate-100 p-1.5 rounded-2xl border-3 border-slate-900 mb-6 overflow-x-auto gap-1 shadow-[3px_3px_0px_#1f2937]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap grow text-center cursor-pointer ${
              activeTab === "dashboard" ? "bg-[#60a5fa] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937]" : "text-slate-700"
            }`}
          >
            {t.navTrends}
          </button>
          <button
            onClick={() => setActiveTab("analyzer")}
            className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap grow text-center cursor-pointer ${
              activeTab === "analyzer" ? "bg-[#fb7185] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937]" : "text-slate-700"
            }`}
          >
            {t.navAnalyzer}
          </button>
          <button
            onClick={() => setActiveTab("thumbnail")}
            className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap grow text-center cursor-pointer ${
              activeTab === "thumbnail" ? "bg-[#4ade80] text-slate-900 border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937]" : "text-slate-700"
            }`}
          >
            {lang === "en" ? "Thumbnail & Script" : "Thumbnail & Kịch Bản"}
          </button>
        </div>

        {/* ==================================== */}
        {/* TAB 1: DASHBOARD & TRENDING KEYWORDS */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Hero Banner */}
            <div className="bg-gradient-to-br from-[#818cf8] via-[#a78bfa] to-[#fb7185] text-white rounded-3xl p-6 md:p-10 border-4 border-slate-900 shadow-[8px_8px_0px_#1f2937] relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 via-pink-500 to-rose-600"></div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <span className="bg-[#1f2937] text-white text-[11px] font-black px-3.5 py-1.5 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937] inline-flex items-center gap-1.5 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  {t.heroSubtitle}
                </span>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900" style={{ WebkitTextStroke: "1px #1f2937" }}>
                  {lang === "en" ? (
                    <>
                      Go Viral Internationally <br className="hidden md:inline" />
                      With <span className="bg-white px-2 py-0.5 rounded-xl border-3 border-slate-900 text-slate-900 shadow-[4px_4px_0px_#1f2937]">Trending Keywords</span>
                    </>
                  ) : (
                    <>
                      Kênh Hoạt Hình Viral <br className="hidden md:inline" />
                      Nhờ <span className="bg-white px-2 py-0.5 rounded-xl border-3 border-slate-900 text-slate-900 shadow-[4px_4px_0px_#1f2937]">Từ Khóa Xu Hướng</span>
                    </>
                  )}
                </h2>
                <p className="text-slate-900 text-xs md:text-sm font-bold leading-relaxed max-w-xl">
                  {t.heroDescription}
                </p>
                
                {/* Search Bar directly inside Hero */}
                <div className="pt-2">
                  <div className="bg-white p-2 rounded-2xl flex items-center border-4 border-slate-900 max-w-lg shadow-[4px_4px_0px_#1f2937]">
                    <Search className="w-5 h-5 text-slate-800 ml-3" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                      className="bg-transparent border-0 text-slate-900 placeholder-slate-500 font-extrabold focus:outline-hidden focus:ring-0 text-xs px-3 py-1 flex-1 text-ellipsis"
                      onKeyDown={(e) => e.key === "Enter" && handleAnalyzeKeyword()}
                    />
                    <button
                      onClick={() => handleAnalyzeKeyword()}
                      disabled={isAnalyzing}
                      className="bg-[#fb7185] hover:bg-[#fb7185]/95 text-white font-black px-4 py-2.5 rounded-xl text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937] transition-all focus:ring-2 focus:ring-rose-400 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {isAnalyzing ? t.analyzingBtn : t.analyzeBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Trends Display */}
            <div id="trends-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Trending Keywords list */}
              <div className="lg:col-span-8 bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937] space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-slate-900 pb-5">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-5.5 h-5.5 text-rose-500" />
                      {t.trendingNowTitle}
                    </h3>
                    <p className="text-slate-650 text-xs font-semibold">
                      {t.trendingNowDesc}
                    </p>
                  </div>

                  {/* Filter age pills */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937]">
                    <button
                      onClick={() => handleAgeFilterChange("")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        selectedAgeFilter === "" ? "bg-[#60a5fa] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937]" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t.allAges}
                    </button>
                    {["1-3 years", "3-5 years", "5-8 years", "8-10 years"].map((age) => (
                      <button
                        key={age}
                        onClick={() => handleAgeFilterChange(age)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          selectedAgeFilter === age ? "bg-[#fb7185] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937]" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {age === "1-3 years" ? (lang === "en" ? age : "1-3 tuổi") :
                         age === "3-5 years" ? (lang === "en" ? age : "3-5 tuổi") :
                         age === "5-8 years" ? (lang === "en" ? age : "5-8 tuổi") :
                         (lang === "en" ? age : "8-10 tuổi")}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingTrends ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <RotateCw className="w-10 h-10 text-rose-500 animate-spin" />
                    <p className="text-slate-600 font-extrabold text-xs">{lang === "en" ? "Querying live global trending topics..." : "Đang lọc dữ liệu từ khóa hoạt hình thịnh hành..."}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b-3 border-slate-900 text-xs font-black text-slate-850 tracking-wider uppercase">
                          <th className="pb-3 pl-2">{t.theadKeyword}</th>
                          <th className="pb-3">{t.theadAge}</th>
                          <th className="pb-3 text-center">{lang === "en" ? "Trend Rank" : "Xếp hạng"}</th>
                          <th className="pb-3 text-center">{lang === "en" ? "Difficulty" : "Độ cạnh tranh"}</th>
                          <th className="pb-3 text-right">{t.theadVolume}</th>
                          <th className="pb-3 pr-2 text-right">{t.theadAction}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100 text-xs font-bold text-slate-800">
                        {keywordList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/20 transition-colors group border-b border-slate-100">
                            {/* keyword & subniche */}
                            <td className="py-4 pl-2 pr-4">
                              <span className="font-extrabold text-slate-900 hover:text-rose-600 block transition-colors">
                                {item.keyword}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="bg-slate-200 text-slate-900 border border-slate-900 text-[9px] uppercase font-black py-0.5 px-1.5 rounded">
                                  {item.subNiche}
                                </span>
                                <span className="text-slate-500 text-[11px]">• Velocity:</span>
                                <span className="text-[11px] font-black text-rose-600">{item.viewerVelocity}</span>
                              </div>
                            </td>
                            {/* Target age */}
                            <td className="py-4 whitespace-nowrap">
                              <span className="bg-[#60a5fa]/15 border border-slate-900 text-slate-900 font-black text-[10px] px-2.5 py-1 rounded-full">
                                {item.ageGroup}
                              </span>
                            </td>
                            {/* Growth trend percentage */}
                            <td className="py-4 text-center font-black text-rose-600">
                              +{item.trendPercentage}% 📈
                            </td>
                            {/* Difficulty Score */}
                            <td className="py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-[11px] font-black ${
                                  item.difficultyScore < 35 
                                    ? "text-emerald-600" 
                                    : item.difficultyScore < 60 
                                      ? "text-amber-600" 
                                      : "text-rose-600"
                                }`}>
                                  {item.difficultyScore}/100
                                </span>
                                <div className="w-16 bg-slate-200 border-2 border-slate-900 h-2.5 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      item.difficultyScore < 35 
                                        ? "bg-[#4ade80]" 
                                        : item.difficultyScore < 60 
                                          ? "bg-[#fb923c]" 
                                          : "bg-[#fb7185]"
                                    }`} 
                                    style={{ width: `${item.difficultyScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            {/* Search volume */}
                            <td className="py-4 text-right font-black text-slate-800">
                              {item.searchVolume.toLocaleString()}
                            </td>
                            {/* Action to build */}
                            <td className="py-4 pr-2 text-right">
                              <button
                                onClick={() => handleQuickUseKeyword(item.keyword, item.ageGroup)}
                                className="bg-white hover:bg-rose-500 hover:text-white text-slate-900 text-[11px] py-1.5 px-3 rounded-lg font-black border-2 border-slate-900 shadow-[2px_2px_0px_#1f2937] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 ml-auto shrink-0 cursor-pointer"
                              >
                                Optimize <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Mini Guidelines overview or stats */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Submitting custom key explanations */}
                <div className="bg-[#60a5fa] border-4 border-slate-900 text-white rounded-3xl p-6 space-y-3 shadow-[8px_8px_0px_#1f2937]">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-100" />
                    How to configure high-retention AI
                  </h4>
                  <p className="text-xs text-blue-50 font-semibold leading-relaxed">
                    The platform coordinates smart analytics using twin AI agents optimized for high CTR children's content structure:
                  </p>
                  <ul className="text-xs text-blue-50 space-y-1.5 pl-4 list-disc font-semibold">
                    <li><strong>Google Gemini 3.5 Flash:</strong> Supercharged text intelligence for rapid script building and scenic story arcs.</li>
                    <li><strong>OpenAI GPT-4o:</strong> Specialized preschool comedy dialogues provider (optional with key).</li>
                  </ul>
                  <p className="text-[11px] bg-white/20 border border-slate-900 p-2.5 rounded-xl text-yellow-150 font-bold leading-normal">💡 Quick Tip: Add your API keys under Settings to transition from simulated sandbox responses to 100% active custom production setups!</p>
                </div>

              </div>
            </div>

            {/* Age guidelines notebook part */}
            <AgeGuide />
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 2: KEYWORD ANALYZER DETAILS     */}
        {/* ==================================== */}
        {activeTab === "analyzer" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Custom interactive Search Input panel */}
            <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937]">
              <h3 className="text-xl font-black text-slate-1000 mb-2 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#fb7185]" />
                {t.analyzerHeaderTitle}
              </h3>
              <p className="text-slate-600 text-xs font-semibold mb-6">
                {t.analyzerHeaderDesc}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">{t.analyzerInputLabel}</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-white border-3 border-slate-900 rounded-2xl py-3 pl-4 pr-10 text-sm font-bold text-slate-900 shadow-[3px_3px_0px_#1f2937] focus:outline-hidden"
                      placeholder={t.analyzerInputPlaceholder}
                      value={customKeyword}
                      onChange={(e) => setCustomKeyword(e.target.value)}
                    />
                    <Sparkles className="w-4 h-4 text-[#fb7185] absolute right-3.5 top-4.5 pointer-events-none animate-pulse" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">{t.analyzerAgeLabel}</label>
                  <select
                    className="w-full bg-white border-3 border-slate-900 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 shadow-[3px_3px_0px_#1f2937] focus:outline-hidden"
                    value={selectedAgeGroup}
                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  >
                    <option value="1-3 years">1-3 years {lang === "en" ? "(Sensory Play)" : "(Cảm quan)"}</option>
                    <option value="3-5 years">3-5 years {lang === "en" ? "(Preschool Play)" : "(Mầm non)"}</option>
                    <option value="5-8 years">5-8 years {lang === "en" ? "(Early Schoolers)" : "(Tiểu học nhỏ)"}</option>
                    <option value="8-10 years">8-10 years {lang === "en" ? "(Pre-Teens)" : "(Thiếu niên lớn)"}</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex items-end">
                  <button
                    onClick={() => handleAnalyzeKeyword()}
                    disabled={isAnalyzing}
                    className="w-full bg-[#fb7185] hover:bg-[#fb7185]/95 text-white font-black py-4.5 px-6 rounded-2xl text-xs transition-all border-3 border-slate-900 shadow-[4px_4px_0px_#1f2937] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        {t.btnDeepAnalyzing}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {t.btnDeepAnalyze}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {analyzerError && (
              <div id="analyzer-error-message" className="bg-[#fb7185]/10 border-3 border-slate-900 text-slate-900 rounded-3xl p-5 text-xs font-bold leading-normal flex items-center gap-3 shadow-[4px_4px_0px_#1f2937]">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                <div>
                  <p className="font-extrabold">{lang === "en" ? "Analysis Error" : "Lỗi Phân Tích"}</p>
                  <p className="text-xs text-rose-650 font-semibold mt-0.5">{analyzerError}</p>
                </div>
              </div>
            )}

            {analyzerFallback && (
              <div className="bg-[#fb923c]/15 border-3 border-slate-900 text-slate-900 rounded-3xl p-5 text-xs font-bold leading-normal flex items-center gap-3 shadow-[4px_4px_0px_#1f2937]">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-extrabold">{lang === "en" ? "Dynamic Baseline Mode Active" : "Đang dùng Cơ sở dữ liệu Dự phòng"}</p>
                  <p className="text-xs text-amber-800 font-semibold mt-0.5">
                    {lang === "en" 
                      ? "The Gemini model is experiencing high demand (503 Service Unavailable). To keep your experience uninterrupted and fast, we have initialized a highly attuned, professional kids-SEO baseline setup for your keyword."
                      : "Trực quan hoá mô hình Gemini đang bận hoặc quá tải (503 Service). Để bảo đảm trải nghiệm không bị tắt nghẽn, chúng tôi đã chuẩn bị sẵn sơ đồ SEO & tâm lý phát triển mầm non bám sát từ khóa này."}
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Result display */}
            {analyzedKeyword ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Result Block */}
                <div className="lg:col-span-1 flex flex-col">
                  <div className="flex-1 bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937] space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-slate-900 pb-5">
                      <div>
                        <span className="bg-[#fb7185]/15 border-2 border-slate-900 text-slate-900 font-extrabold text-[10px] px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                          Target Segment: {analyzedKeyword.ageGroup}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
                          {analyzedKeyword.keyword}
                        </h3>
                        <p className="text-slate-600 text-xs font-extrabold mt-1">Recommended Sub-Niche: <span className="text-[#60a5fa] font-black">{analyzedKeyword.subNiche}</span></p>
                      </div>
                      
                      {/* Big KPI trend metric */}
                      <div className="bg-[#fb7185]/15 border-2 border-slate-900 px-5 py-3.5 rounded-2xl text-center md:text-right shrink-0">
                        <span className="text-slate-500 text-[9px] uppercase font-bold tracking-widest block">Daily Velocity</span>
                        <strong className="text-lg font-black text-rose-600 whitespace-nowrap block">+{analyzedKeyword.trendPercentage}% Growth 🚀</strong>
                      </div>
                    </div>

                    {/* Mini dashboard widgets */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-white border-3 border-slate-900 rounded-2xl space-y-1 shadow-[3px_3px_0px_#1f2937]">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Calculated Searches</span>
                        <strong className="text-lg font-black text-slate-900">{analyzedKeyword.searchVolume?.toLocaleString() || "50,000"}</strong>
                        <span className="text-[9px] font-bold text-slate-400 block">Queries per month</span>
                      </div>

                      <div className="p-4 bg-white border-3 border-slate-900 rounded-2xl space-y-1 shadow-[3px_3px_0px_#1f2937]">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Difficulty Index</span>
                        <strong className="text-lg font-black text-slate-900">{analyzedKeyword.difficultyScore}/100</strong>
                        <span className={`text-[9px] font-extrabold block ${analyzedKeyword.difficultyScore < 35 ? "text-emerald-700 font-black" : "text-amber-700 font-black"}`}>
                          {analyzedKeyword.difficultyScore < 35 ? "Very Easy" : "Moderate Comp"}
                        </span>
                      </div>

                      <div className="p-4 bg-white border-3 border-slate-900 rounded-2xl space-y-1 shadow-[3px_3px_0px_#1f2937]">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Niche Competition</span>
                        <strong className="text-lg font-black text-slate-900">{analyzedKeyword.competition || "Medium"}</strong>
                        <span className="text-[9px] font-bold text-slate-400 block">Competing channel density</span>
                      </div>

                      <div className="p-4 bg-white border-3 border-slate-900 rounded-2xl space-y-1 shadow-[3px_3px_0px_#1f2937]">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">Commercial CPC</span>
                        <strong className="text-lg font-black text-slate-900">${analyzedKeyword.avgCpc || "0.18"}</strong>
                        <span className="text-[9px] font-bold text-slate-400 block">High CPM advertiser rate</span>
                      </div>
                    </div>

                    {/* Deep Analysis Text Block */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Search Intent & Child-Parent Psychology:</h4>
                        <div className="p-4 bg-white border-3 border-slate-900 text-slate-800 text-xs font-bold leading-relaxed rounded-2xl shadow-[3px_3px_0px_#1f2937]">
                          {analyzedKeyword.intentDescription}
                        </div>
                      </div>

                      {analyzedKeyword.analyticsInDepth && (
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Strategic Feasibility Evaluation:</h4>
                          <div className="p-4 bg-[#60a5fa]/10 border-3 border-slate-900 text-slate-800 text-xs font-bold leading-relaxed rounded-2xl shadow-[3px_3px_0px_#1f2937]">
                            {analyzedKeyword.analyticsInDepth}
                          </div>
                        </div>
                      )}

                      {analyzedKeyword.demographics && (
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Viewer Demographic Personas:</h4>
                          <div className="p-4 bg-[#c084fc]/10 border-3 border-slate-900 text-slate-800 text-xs font-bold leading-relaxed rounded-2xl shadow-[3px_3px_0px_#1f2937]">
                            {analyzedKeyword.demographics}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
                <div className="lg:col-span-1 flex flex-col">
                  {/* Title & Description Optimizer Card */}
                  <div className="flex-1 bg-white rounded-3xl border-4 border-slate-900 p-6 shadow-[8px_8px_0px_#1f2937] space-y-5 flex flex-col">
                    <div className="border-b-3 border-slate-900 pb-4">
                      <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-rose-500" />
                        {lang === "en" ? "Title & Description Optimizer" : "Tối Ưu Hóa Tiêu Đề & Mô Tả SEO"}
                      </h4>
                      <p className="text-slate-600 text-[11px] font-bold mt-1">
                        {lang === "en" 
                          ? "Generate kid-focused, high-clickability viral titles and safe search descriptions tailored to child psychology."
                          : "Tạo danh sách tiêu đề hấp dẫn & mô tả tối ưu hóa SEO đạt lượng click mầm non cao."}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateTitlesAndDescs}
                      disabled={isGeneratingTitlesAndDescs}
                      className="w-full bg-[#fb7185] hover:bg-[#fb7185]/95 text-white font-black py-3 px-4 rounded-xl text-xs transition-all border-3 border-slate-900 shadow-[3px_3px_0px_#1f2937] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isGeneratingTitlesAndDescs ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          {lang === "en" ? "Generating Proposals..." : "Đang tạo tiêu đề..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          {lang === "en" ? "Generate SEO Titles" : "Tạo Bộ Tiêu Đề & Mô Tả"}
                        </>
                      )}
                    </button>

                    {/* Active Selected Selection Banner */}
                    {(selectedTitle || selectedDescription) && (
                      <div className="bg-[#4ade80]/15 border-3 border-slate-900 rounded-xl p-3.5 space-y-1.5 text-slate-800 font-semibold shadow-[3px_3px_0px_#1f2937]">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          {lang === "en" ? "Selected Configuration" : "Đã chọn Cấu hình"}
                        </div>
                        {selectedTitle && (
                          <p className="text-xs">
                            <span className="font-extrabold text-slate-500 block">{lang === "en" ? "Title:" : "Tiêu đề:"}</span>{" "}
                            <span className="text-slate-900 font-black leading-tight block pt-1">{selectedTitle}</span>
                          </p>
                        )}
                        {selectedDescription && (
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-500 block">{lang === "en" ? "Description:" : "Mô tả:"}</span>
                            <div className="bg-white p-2.5 border-2 border-slate-900 rounded-lg mt-1 text-slate-800 leading-normal font-mono text-[9px] shadow-[1.5px_1.5px_0px_#1f2937]">
                              {selectedDescription}
                            </div>
                          </div>
                        )}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              setThumbKeyword(selectedTitle);
                              setScriptKeyword(selectedTitle);
                              setActiveTab("thumbnail");
                              handleDesignThumbnail(undefined, selectedTitle);
                              handleGenerateScript(undefined, selectedTitle);
                            }}
                            className="w-full bg-[#60a5fa] hover:bg-[#60a5fa]/90 text-white font-black border-2 border-slate-900 py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0px_#1f2937] active:translate-y-0.5 cursor-pointer"
                          >
                            🚀 {lang === "en" ? "Generate Thumbnail & Screenplay" : "Tạo Thumbnail & Kịch Bản"}
                          </button>
                        </div>
                      </div>
                    )}

                    {generatedTitlesAndDescs.length > 0 ? (
                      <div className="space-y-3.5 pr-1 flex-1">
                        {generatedTitlesAndDescs.map((option, idx) => {
                          const isOptionSelected = selectedTitle === option.title && selectedDescription === option.description;
                          return (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-xl border-3 transition-all space-y-3 text-left ${
                                isOptionSelected 
                                  ? "bg-[#fb7185]/10 border-slate-900 shadow-[3px_3px_0px_#1f2937]" 
                                  : "bg-white border-slate-900 shadow-[2px_2px_0px_#1f2937]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide border-2 border-slate-900 ${
                                    isOptionSelected ? "bg-[#fb7185] text-white" : "bg-slate-200 text-slate-800"
                                  }`}>
                                    {lang === "en" ? `Option #${idx + 1}` : `Mẫu #${idx + 1}`}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold text-slate-500">
                                    {option.title.length}/100 chars
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedTitle(option.title);
                                    setSelectedDescription(option.description);
                                    // Sync to search inputs
                                    setThumbKeyword(option.title);
                                    setScriptKeyword(option.title);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-extrabold border-2 border-slate-500 transition-all flex items-center gap-1 cursor-pointer select-none active:translate-y-0.5 ${
                                    isOptionSelected 
                                      ? "bg-[#4ade80] border-slate-900 text-slate-905 shadow-[1px_1px_0px_#1f2937]" 
                                      : "bg-white hover:bg-slate-50 text-slate-850 border-slate-900 shadow-[1px_1px_0px_#1f2937]"
                                  }`}
                                >
                                  {isOptionSelected ? (
                                    <>
                                      <Check className="w-3" />
                                      {lang === "en" ? "Selected" : "Đã Chọn"}
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-3" />
                                      {lang === "en" ? "Select" : "Chọn Bảng"}
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                <h5 className="font-extrabold text-slate-900 text-xs leading-snug">
                                  {option.title}
                                </h5>
                                <div className="bg-slate-50 rounded-lg p-2.5 border-2 border-slate-909 text-[10px] text-slate-800 font-bold leading-normal relative shadow-[2px_2px_0px_#1f2937]">
                                  <p className="whitespace-pre-line text-[10px] pr-6 font-semibold">
                                    {option.description}
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(option.description);
                                      setCopyStates(prev => ({ ...prev, [`desc-${idx}`]: true }));
                                      setTimeout(() => {
                                        setCopyStates(prev => ({ ...prev, [`desc-${idx}`]: false }));
                                      }, 1500);
                                    }}
                                    className="absolute right-1.5 top-1.5 p-1 bg-white hover:bg-slate-100 border-2 border-slate-900 rounded-md text-slate-700 transition-all cursor-pointer shadow-[1px_1px_0px_#1f2937]"
                                    title={lang === "en" ? "Copy to clipboard" : "Sao chép mô tả"}
                                  >
                                    {copyStates[`desc-${idx}`] ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600 font-extrabold" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 border-3 border-dashed border-slate-300 rounded-2xl text-center space-y-2 bg-slate-50 flex-1 flex flex-col justify-center">
                        <Compass className="w-7 h-7 text-slate-400 mx-auto animate-pulse" />
                        <h5 className="text-[11px] font-extrabold text-[#1f2937]">
                          {lang === "en" ? "No Proposals Generated" : "Chưa có danh sách tiêu đề"}
                        </h5>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed font-semibold">
                          {lang === "en" 
                            ? "Click Generate SEO Titles or analyze a keyword to automatically formulate five child-psychology aligned YouTube options."
                            : "Click nút 'Tạo Bộ Tiêu Đề & Mô Tả' để sản xuất 5 bộ Tiêu đề & Mô tả YouTube Kids chuẩn SEO mầm non."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendation action plan card */}
              {analyzedKeyword.recommendations && (
                <div className="bg-[#fb923c]/15 border-4 border-slate-900 rounded-3xl p-6 md:p-8 space-y-4 shadow-[8px_8px_0px_#1f2937] text-slate-800 font-bold mt-8">
                  <h4 className="font-black text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500 animate-bounce" />
                    Targeted Production Playbook:
                  </h4>
                  <ul className="space-y-2.5 text-xs md:text-sm font-semibold">
                    {analyzedKeyword.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="bg-white border-2 border-slate-900 text-slate-900 text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#1f2937]">{i+1}</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </>
            ) : (
              <div id="no-analysis-state" className="bg-white rounded-3xl border-4 border-slate-900 p-16 text-center shadow-[4px_4px_0px_#1f2937]">
                <Search className="w-12 h-12 text-slate-405 mx-auto mb-4 animate-bounce-slow" />
                <h4 className="text-lg font-black text-slate-900">No keyword has been analyzed yet</h4>
                <p className="text-slate-600 text-xs font-semibold mt-1 max-w-sm mx-auto leading-relaxed">
                  Type a kid-centered search phrase in the panel above, or click on "Optimize" for any high-performing keyword on the trends dashboard to unlock custom deep insights.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================== */}
        {/* TAB 3: THUMBNAIL DESIGNER & TITLES   */}
        {/* ==================================== */}
        {activeTab === "thumbnail" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Selected Youtube SEO Metadata (Title, Description, Hashtags) */}
            {(selectedTitle || selectedDescription) && (
              <div className="bg-gradient-to-br from-indigo-50 to-rose-50 border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_#1f2937] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                        {lang === "en" ? "Selected YouTube Video SEO Campaign Metadata" : "Bộ Nhận Diện YouTube Kids SEO Đã Chọn"}
                      </h4>
                      <p className="text-slate-650 text-xs font-bold leading-none mt-1">
                        {lang === "en" ? "From Keyword Deep Cognitive Analyzer (Tab 2)" : "Được đồng bộ trực tiếp từ Phân tích từ khóa (Tab 2)"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Master Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const hashtags = selectedDescription ? (selectedDescription.match(/#[A-Za-z0-9_]+/g) || []).join(" ") : "";
                      const fullSEOText = `TITLE:\n${selectedTitle}\n\nDESCRIPTION:\n${selectedDescription}\n\nHASHTAGS:\n${hashtags}`;
                      copyToClipboard(fullSEOText, "copy-all-seo");
                    }}
                    className="bg-[#60a5fa] hover:bg-[#60a5fa]/90 text-slate-950 font-black border-2 border-slate-900 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#1f2937] active:translate-y-0.5 cursor-pointer self-start sm:self-center"
                  >
                    {copyStates["copy-all-seo"] ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{lang === "en" ? "Copy All SEO Copywriter Metadata" : "Sao chép toàn bộ Siêu dữ liệu SEO"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title card */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937] flex flex-col justify-between md:col-span-1">
                    <div>
                      <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider block mb-1">📌 Title / Tiêu đề Video</span>
                      <p className="text-xs font-black text-slate-800 leading-relaxed font-sans mt-1">{selectedTitle || "No Title Selected / Chưa chọn Tiêu đề"}</p>
                    </div>
                    {selectedTitle && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedTitle, "copy-idx-title")}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black py-1.5 px-3 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] active:translate-y-0.5 mt-3 self-end cursor-pointer flex items-center gap-1"
                      >
                        {copyStates["copy-idx-title"] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {lang === "en" ? "Copy Title" : "Copy Tiêu đề"}
                      </button>
                    )}
                  </div>

                  {/* Description card */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937] flex flex-col justify-between md:col-span-1">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-1">📝 SEO Description / Mô tả SEO</span>
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] font-mono text-slate-700 leading-relaxed mt-1">
                        {selectedDescription || "No Description Selected / Chưa chọn Mô tả"}
                      </div>
                    </div>
                    {selectedDescription && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedDescription, "copy-idx-desc")}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black py-1.5 px-3 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] active:translate-y-0.5 mt-3 self-end cursor-pointer flex items-center gap-1"
                      >
                        {copyStates["copy-idx-desc"] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {lang === "en" ? "Copy Description" : "Copy Mô tả"}
                      </button>
                    )}
                  </div>

                  {/* Hashtags card */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937] flex flex-col justify-between md:col-span-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block mb-1">🏷️ Hashtags / Thẻ Hashtags</span>
                      <p className="text-xs font-bold text-slate-650 leading-relaxed mt-1">
                        {(selectedDescription && ((selectedDescription.match(/#[A-Za-z0-9_]+/g) || []).join(" "))) || "#kidslearning #animation #childrenstories"}
                      </p>
                    </div>
                    {selectedDescription && (
                      <button
                        type="button"
                        onClick={() => {
                          const tags = (selectedDescription.match(/#[A-Za-z0-9_]+/g) || []).join(" ");
                          copyToClipboard(tags || "#kidslearning #animation", "copy-idx-tags");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-black py-1.5 px-3 rounded-lg border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] active:translate-y-0.5 mt-3 self-end cursor-pointer flex items-center gap-1"
                      >
                        {copyStates["copy-idx-tags"] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {lang === "en" ? "Copy Hashtags" : "Copy Tags"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Parameter Panel */}
              <div className="lg:col-span-4 bg-white rounded-3xl border-4 border-slate-900 p-6 shadow-[8px_8px_0px_#1f2937] space-y-6 self-start">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 border-b-2 border-slate-900 pb-3">
                    <ImageIcon className="w-5 h-5 text-[#fb7185]" />
                    {t.thumbnailHeaderTitle}
                  </h3>
                  <p className="text-slate-600 text-xs font-bold mt-2">
                    {t.thumbnailHeaderDesc}
                  </p>
                </div>

                <form onSubmit={handleDesignThumbnail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">{t.thumbConceptLabel}</label>
                    <input
                      type="text"
                      className="w-full bg-white border-3 border-slate-900 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#1f2937] focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      placeholder={t.thumbConceptPlaceholder}
                      value={thumbKeyword}
                      onChange={(e) => setThumbKeyword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">{t.artStyleLabel}</label>
                    <select
                      className="w-full bg-white border-3 border-slate-900 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#1f2937] focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      value={thumbStyle}
                      onChange={(e) => setThumbStyle(e.target.value)}
                    >
                      <option value="Cute 3D Pixar">{lang === "en" ? "Cute 3D Pixar Style" : "Phong cách 3D Pixar Đáng yêu"}</option>
                      <option value="Flat 2D CoComelon Style">{lang === "en" ? "Flat 2D CoComelon Style (Bold, high contrast)" : "Phong cách Flat 2D CoComelon"}</option>
                      <option value="Classic Watercolor Whimsical">{lang === "en" ? "Classic Watercolor Whimsical" : "Hội họa màu nước Cổ điển Thần tiên"}</option>
                      <option value="Playful Claymation">{lang === "en" ? "Playful Claymation" : "Phong cách Đất sét nặn Playful Claymation"}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isDesigningThumb}
                    className="w-full bg-[#fb7185] hover:bg-[#fb7185]/95 text-white font-black py-3 px-4 rounded-xl text-xs border-3 border-slate-900 shadow-[3px_3px_0px_#1f2937] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isDesigningThumb ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        {t.btnDesigningConcept}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        {t.btnDesignConcept}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Results Panel */}
              <div className="lg:col-span-8 space-y-6">
                {thumbnailError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-5 text-sm font-semibold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-bold">{lang === "en" ? "Thumbnail Design Error" : "Lỗi Thiết kế Thumbnail"}</p>
                      <p className="text-xs text-rose-650 font-normal mt-0.5">{thumbnailError}</p>
                    </div>
                  </div>
                )}

                {thumbnailFallback && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-3xl p-5 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold">{lang === "en" ? "Dynamic Baseline Mode Active" : "Đang dùng Cơ sở dữ liệu Dự phòng"}</p>
                      <p className="text-xs text-amber-800 font-normal mt-0.5">
                        {lang === "en"
                          ? "Creative models are experiencing temporary high demand (503 Service Unavailable). We have generated high-CTR children cartoon outline concepts and title ideas using our local expert database."
                          : "Mô hình sáng tạo đang tạm bận (503 Service). Chúng tôi đã chuẩn bị sẵn gợi ý phác thảo Thumbnail có CTR cao & ý tưởng tự động bám sát đề tài của bạn."}
                      </p>
                    </div>
                  </div>
                )}

                {designedThumb ? (
                  <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937] space-y-8 animate-fade-in">
                    
                    {/* Headers & visual styles */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-3 border-slate-900 pb-5">
                      <div>
                        <span className="bg-amber-100 border-2 border-slate-900 text-slate-905 font-extrabold text-xs px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-3xs">
                          Dynamic Preset: {designedThumb.styleType}
                        </span>
                        <h4 className="text-xl font-black text-slate-900 mt-2 font-sans">{t.highCtrTitlesBreakdown}</h4>
                        <p className="text-slate-600 text-xs font-bold mt-1">
                          {lang === "en" 
                            ? "Step 2: Choose a High-CTR title below to instantly generate a complete interactive kids screenplay storyboard." 
                            : "Bước 2: Chọn một tiêu đề rực rỡ bên dưới để trực tiếp tạo kịch bản truyền thông & phân cảnh mầm non."}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                      {/* Sub-left: suggested titles */}
                      <div className="md:col-span-6 space-y-4 flex flex-col justify-between">
                        <div>
                          <div>
                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">🌟 5 High-CTR YouTube Video Titles:</h5>
                            <p className="text-slate-500 text-[10px] font-bold mt-1 italic">
                              {t.titleSelectionHint}
                            </p>
                          </div>
                          <div className="space-y-2 mt-3">
                            {designedThumb.suggestedTitles?.map((title, i) => {
                              const isSelected = selectedTitle === title;
                              return (
                                <div
                                  key={i}
                                  onClick={() => handleSelectTitle(title)}
                                  className={`group flex items-start gap-2.5 p-3 border-3 transition-all rounded-xl cursor-pointer ${
                                    isSelected
                                      ? "bg-[#fb7185]/15 border-slate-950 shadow-[3px_3px_0px_#1f2937]"
                                      : "bg-white border-slate-900 hover:border-[#fb7185] hover:shadow-[3px_3px_0px_#1f2937] shadow-[1px_1px_0px_#1f2937]"
                                  }`}
                                >
                                  <span className={`font-black text-xs w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border-2 border-slate-900 ${
                                    isSelected ? "bg-[#fb7185] text-white" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {i + 1}
                                  </span>
                                  <div className="flex-1 space-y-1">
                                    <p className="text-xs font-black text-slate-800 select-all leading-relaxed">
                                      {title}
                                    </p>
                                    {isSelected && (
                                      <span className="inline-flex items-center gap-1 bg-[#4ade80] border-2 border-slate-900 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full uppercase scale-90 origin-left shadow-3xs">
                                        <Check className="w-2.5 h-2.5 stroke-[3px]" /> {t.selectedTitleBadge}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(title, `title-${i}`);
                                    }}
                                    className="text-slate-500 hover:text-[#fb7185] transition-colors shrink-0 p-1 border-2 border-transparent hover:border-slate-900 hover:bg-slate-100 rounded-lg shadow-3xs"
                                    title="Copy Title"
                                  >
                                    {copyStates[`title-${i}`] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Script Generator Button inside same left col */}
                        {selectedTitle && !isRefiningTitle && (
                          <div className="bg-[#fb7185]/10 border-3 border-slate-900 rounded-2xl p-4 text-slate-900 space-y-3 shadow-[4px_4px_0px_#1f2937] animate-fade-in mt-4 font-bold">
                            <div>
                              <span className="bg-[#fb7185] text-white font-black border-2 border-slate-950 text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-3xs">
                                {lang === "en" ? "Interactive Pipeline" : "Quy trình Tương tác"}
                              </span>
                              <p className="text-xs font-extrabold mt-2 line-clamp-2 italic text-slate-705">
                                "{selectedTitle}"
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setScriptKeyword(selectedTitle);
                                handleGenerateScript(undefined, selectedTitle);
                                setTimeout(() => {
                                  document.getElementById("integrated-script-panel")?.scrollIntoView({ behavior: "smooth" });
                                }, 150);
                              }}
                              className="w-full bg-white hover:bg-slate-50 text-slate-950 font-black border-2 border-slate-900 text-xs py-2.5 px-4 rounded-xl shadow-[3px_3px_0px_#1f2937] transition-all flex items-center justify-center gap-1.5 active:translate-y-0.5 cursor-pointer"
                            >
                              {t.btnGenerateScriptFromTitle}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sub-right: design instructions (layout, text, color) */}
                      <div className="md:col-span-6 flex flex-col relative">
                        {isRefiningTitle ? (
                          <div className="flex flex-col items-center justify-center h-full min-h-[260px] p-6 text-center space-y-3 bg-slate-50 border-3 border-dashed border-slate-300 rounded-3xl animate-pulse flex-1">
                            <RotateCw className="w-8 h-8 text-[#fb7185] animate-spin" />
                            <h6 className="text-sm font-black text-slate-800">{t.refiningDetailsTitle}</h6>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs">{t.refiningDetailsDesc}</p>
                          </div>
                        ) : !selectedTitle ? (
                          <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-3 border-dashed border-slate-300 rounded-3xl h-full min-h-[340px] space-y-3 flex-1">
                            <span className="text-4xl animate-bounce">🎨</span>
                            <h6 className="text-sm font-black text-slate-700">{t.titleSelectPlaceholderTitle}</h6>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-xs font-semibold">
                              {t.titleSelectPlaceholderDesc}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-slate-50/50 border-3 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_#1f2937] flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">🎨 Composition Directions for Designers:</h5>
                            </div>
                            
                            <div className="space-y-3.5 text-xs flex-1 flex flex-col justify-between">
                              <div className="p-3 bg-white border-2 border-slate-900 rounded-xl space-y-1 shadow-[2px_2px_0px_#1f2937]">
                                <span className="font-extrabold text-slate-800 block">🔹 Hero Characters / Emotional Focal Points:</span>
                                <ul className="list-disc pl-4 space-y-1 text-slate-650 font-semibold">
                                  {designedThumb.focusElements?.map((elem, idx) => (
                                    <li key={idx}>{elem}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="p-3 bg-white border-2 border-slate-900 rounded-xl space-y-1 shadow-[2px_2px_0px_#1f2937]">
                                <span className="font-extrabold text-slate-800 block">🎨 Optimal Contrasting Color Palette:</span>
                                <p className="text-slate-650 leading-relaxed font-semibold">{designedThumb.colorScheme}</p>
                              </div>

                              <div className="p-3 bg-white border-2 border-slate-900 rounded-xl space-y-1 shadow-[2px_2px_0px_#1f2937]">
                                <span className="font-extrabold text-slate-800 block">🖼️ Background Scenic Concept:</span>
                                <p className="text-slate-650 leading-relaxed font-semibold">{designedThumb.backgroundIdea}</p>
                              </div>

                              <div className="p-3 bg-[#60a5fa]/10 border-2 border-slate-900 rounded-xl space-y-1 shadow-[2px_2px_0px_#1f2937]">
                                <span className="font-black text-slate-950 block">✍️ Giant Overlay Cartoon Text:</span>
                                <p className="font-black text-rose-700 uppercase tracking-wide bg-white border border-slate-300 px-2.5 py-1 rounded inline-block mt-0.5">{designedThumb.overlayText}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Prompt blocks - only shown if a title is selected */}
                    {selectedTitle && (
                      <div className={`space-y-6 transition-all duration-300 ${isRefiningTitle ? "opacity-30 pointer-events-none" : "opacity-100"} animate-fade-in`}>
                        
                        {/* Ultimate Master Copycenter */}
                        <div className="bg-slate-50 border-3 border-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[4px_4px_0px_#1f2937]">
                          <div>
                            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">⚡ Master Copycenter / Tổng hợp sao chép</span>
                            <p className="text-xs font-bold text-slate-700 mt-1">
                              {lang === "en" ? "Instantly copy both AI Art Prompts & campaign metadata in one clean sweep!" : "Sao chép toàn bộ các câu lệnh vẽ ảnh & siêu dữ liệu chiến dịch chỉ với 1 chạm!"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const dualPromptText = `PROMPT THUMBNAIL (Art):\n${designedThumb.aiImagePrompt}\n\nPROMPT SCENE (Storyboard):\n${designedThumb.scriptScenesPrompt || `Generate kids toy animation storyboard setup with high-contrast sensory guides based on "${selectedTitle}"`}`;
                                copyToClipboard(dualPromptText, "copy-dual-prompts");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2 px-3 rounded-lg border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#1f2937] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                            >
                              {copyStates["copy-dual-prompts"] ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{lang === "en" ? "Copy Both Prompts" : "Chép 2 Prompts"}</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const hashtags = selectedDescription ? (selectedDescription.match(/#[A-Za-z0-9_]+/g) || []).join(" ") : "";
                                const allInOne = `=== YOUTUBE CAMPAIGN METADATA ===\nTITLE: ${selectedTitle}\n\nDESCRIPTION:\n${selectedDescription}\n\nHASHTAGS: ${hashtags}\n\n=== AI IMAGERY PROMPTS ===\nPROMPT THUMBNAIL:\n${designedThumb?.aiImagePrompt || ""}\n\nPROMPT SCENE STORIES:\n${designedThumb?.scriptScenesPrompt || `Generate comprehensive kids storyboard for "${selectedTitle}"`}`;
                                copyToClipboard(allInOne, "copy-ultimate-all");
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] py-2 px-3 rounded-lg border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#1f2937] active:translate-y-0.5 cursor-pointer flex items-center gap-1"
                            >
                              {copyStates["copy-ultimate-all"] ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-300" />}
                              <span>{lang === "en" ? "Copy Prompts + Metadata" : "Chép Mọi Thứ"}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* 1. Prompt Thumbnail Panel */}
                          <div id="prompt-thumbnail-panel" className="bg-slate-900 text-white rounded-2xl border-4 border-slate-900 p-5 space-y-3.5 shadow-[4px_4px_0px_#1f2937] flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center gap-2 border-b border-slate-800 pb-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa] font-sans flex items-center gap-1.5">
                                  <span>🖼️</span> Prompt Thumbnail (Midjourney / Imagen)
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(designedThumb.aiImagePrompt, "ai-prompt")}
                                  className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-black py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all border-2 border-slate-900 shadow-[1px_1px_0px_white] active:translate-y-0.5 cursor-pointer shrink-0"
                                >
                                  {copyStates["ai-prompt"] ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                                      {lang === "en" ? "Copied!" : "Đã chép!"}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      {lang === "en" ? "Copy" : "Sao chép"}
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-slate-400 text-[10px] leading-normal font-sans font-semibold">
                                {lang === "en" ? "Optimized visual directives to feed into Midjourney or Stable Diffusion for amazing covers." : "Từ khóa trực quan hóa bìa video chất lượng cao gửi cho Midjourney/Stable Diffusion."}
                              </p>
                              <div className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono leading-relaxed select-all border-2 border-slate-800 text-slate-200 max-h-28 overflow-y-auto">
                                {designedThumb.aiImagePrompt}
                              </div>
                            </div>
                          </div>

                          {/* 2. Prompt Script Scenes Video Panel */}
                          <div id="prompt-script-scenes-panel" className="bg-slate-900 text-white rounded-2xl border-4 border-slate-900 p-5 space-y-3.5 shadow-[4px_4px_0px_#1f2937] flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center gap-2 border-b border-slate-800 pb-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#fb7185] font-sans flex items-center gap-1.5">
                                  <span>🎬</span> Prompt Script Scenes (Storyboard / Video)
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(designedThumb.scriptScenesPrompt || `Generate comprehensive 3-act kids toy story screenplay with visual cues & audio sound effect rules for "${selectedTitle}"`, "scenes-prompt")}
                                  className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-black py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all border-2 border-slate-900 shadow-[1px_1px_0px_white] active:translate-y-0.5 cursor-pointer shrink-0"
                                >
                                  {copyStates["scenes-prompt"] ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                                      {lang === "en" ? "Copied!" : "Đã chép!"}
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      {lang === "en" ? "Copy" : "Sao chép"}
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-slate-400 text-[10px] leading-normal font-sans font-semibold">
                                {lang === "en" ? "Detailed sequence instructions for storyboarding, visual actions, and developmental narrative beats." : "Ý tưởng bối cảnh, phân đoạn visual hoạt họa, và nhịp độ hội thoại giáo dục chuẩn mầm non."}
                              </p>
                              <div className="p-3 bg-slate-950 rounded-xl text-[10px] font-mono leading-relaxed select-all border-2 border-slate-800 text-slate-200 max-h-28 overflow-y-auto">
                                {designedThumb.scriptScenesPrompt || `Generate comprehensive 3-act kids toy animation storyboard setup with high-contrast sensory guides based on "${selectedTitle}"`}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* AI Thumbnail Painter Interactive Tool */}
                        <div className="bg-slate-900 text-white rounded-3xl border-4 border-slate-900 p-5 md:p-6 space-y-4 shadow-[6px_6px_0px_#1f2937]">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <h6 className="text-sm font-black text-white flex items-center gap-1.5 font-sans">
                                <Bot className="w-4 h-4 text-[#fb7185]" />
                                Google Imagen Instant Art Painter
                              </h6>
                              <p className="text-slate-400 text-[11px] mt-1 font-semibold font-sans">
                                Utilizes <strong>gemini-2.5-flash-image</strong> to physically render live kid cartoon preview mockups on correct 16:9 widescreen canvas.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleGenerateMockupImage}
                              disabled={isGeneratingMockImage}
                              className="bg-[#4ade80] hover:bg-[#4ade80]/90 text-slate-950 font-black py-3 px-5 rounded-xl text-xs transition-style border-3 border-slate-950 shadow-[3px_3px_0px_white] active:translate-y-0.5 disabled:opacity-50 font-sans cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                            >
                              {isGeneratingMockImage ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  Model is painting artwork...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                  Render Live 16:9 Image
                                </>
                              )}
                            </button>
                          </div>

                          {imageFallback && (
                            <div className="bg-amber-500/10 border-2 border-amber-500/25 text-amber-200 rounded-2xl p-4 text-xs flex items-start gap-3 font-semibold">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-extrabold text-amber-300">Dynamic Artwork Fallback Mode Active</p>
                                <p className="text-slate-300 font-normal mt-0.5 leading-relaxed">
                                  Image generation engines are currently experiencing high demand or API quota limits. We have dynamically generated an exquisite, custom kids-cartoon vector illustration matching your selected subject.
                                </p>
                              </div>
                            </div>
                          )}

                          {generatedImageUrl && (
                            <div className="bg-slate-950 border-2 border-indigo-950 rounded-2xl p-3 text-center space-y-3 animate-fade-in relative group">
                              <img 
                                src={generatedImageUrl} 
                                alt="Generated kids anime thumbnail mockup by Gemini" 
                                className="max-h-80 mx-auto rounded-xl object-contain border border-indigo-900 select-none shadow-md"
                              />
                              <div className="flex items-center justify-center gap-2 text-[11px] text-pink-300">
                                <span>🎨 Beautiful, kid-friendly automatic 16:9 illustration mockup!</span>
                                <a 
                                  href={generatedImageUrl} 
                                  download="thumbnail_mockup.png"
                                  className="bg-indigo-905 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 inline-flex shrink-0 ml-2 shadow-sm transition-all hover:scale-105"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Mockup
                                </a>
                              </div>
                            </div>
                          )}

                          {imageError && (
                            <div className="p-3.5 bg-rose-950/40 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-fade-in">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div>
                                <strong className="block mb-0.5">Image Generation Alert:</strong>
                                <span>{imageError}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}



                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-150 p-16 text-center shadow-xs">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-bounce-slow" />
                    <h4 className="text-lg font-bold text-slate-700">No layout concept analyzed yet</h4>
                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                      Fill in a core search word on the left panel or choose any keyword from the Playbook dashboard to outline characters, vivid themes, and custom Midjourney imagery prompts.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* 🎬 DYNAMIC INTEGRATED SCREENPLAY STORYBOARD - BƯỚC 4 */}
            {selectedTitle && (
              <div className="mt-8 space-y-8 animate-fade-in">
                
                {/* Visual Connector / Pipeline Arrow */}
                <div className="flex justify-center items-center gap-2 text-slate-400">
                  <div className="h-[2px] bg-slate-300 grow max-w-xs"></div>
                  <span className="text-xs font-black uppercase tracking-wider font-mono text-slate-500">
                    {lang === "en" ? "🎬 Sequence Flow: Designing Screenplay Playbook" : "🎬 Luồng tiến độ: Thiết kế Kịch bản phân cảnh"}
                  </span>
                  <div className="h-[2px] bg-slate-300 grow max-w-xs"></div>
                </div>

                {/* Main Script Panel */}
                <div id="integrated-script-panel" className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937] space-y-6">
                  
                  {/* Top Bar inside the integrated screenplay panel */}
                  <div className="border-b-3 border-slate-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                      <span className="bg-[#fb7185]/15 border-2 border-slate-900 text-slate-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-3xs">
                        {lang === "en" ? "Step 4: Kids Animation Screenplay Builder" : "Bước 4: Thiết kế Kịch Bản mầm non"}
                      </span>
                      <h4 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#fb7185]" />
                        {lang === "en" ? "Complete Interactive Video Screenplay" : "Kịch Bản Hoạt Hình Hoàn Chỉnh Mầm Non"}
                      </h4>
                      <p className="text-slate-600 text-xs font-bold leading-none mt-1">
                        {lang === "en"
                          ? `Story pacing matches developmental milestones specifically for "${scriptAge || "under 5"}" targets.`
                          : `Tốc độ lời thoại và bối cảnh đã được hiệu chỉnh cho nhóm tuổi "${scriptAge || "dưới 5 tuổi"}".`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateScript(undefined, selectedTitle)}
                      disabled={isGeneratingScript}
                      className="bg-[#4ade80] hover:bg-[#4ade80]/90 text-slate-950 font-black py-3 px-5 rounded-2xl text-xs border-3 border-slate-900 shadow-[3px_3px_0px_#1f2937] active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isGeneratingScript ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          {lang === "en" ? "Drafting Screenplay..." : "Đang tạo Kịch Bản..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          {generatedScript 
                            ? (lang === "en" ? "Regenerate Screenplay 🎬" : "Tạo Lại Kịch Bản Hoạt Hình 🎬")
                            : (lang === "en" ? "Bắt Đầu Tạo Kịch Bản Hoạt Hình 🎬" : "Bắt Đầu Tạo Kịch Bản Hoạt Hình 🎬")}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Loading / Screenplay Content rendering */}
                  {isGeneratingScript ? (
                    <div className="p-16 text-center space-y-4 font-sans border-3 border-slate-900 rounded-2xl bg-slate-50">
                      <div className="inline-flex p-4 bg-teal-55 border-3 border-slate-900 rounded-full animate-spin">
                        <RotateCw className="w-8 h-8 text-teal-600 font-black" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900">
                        {lang === "en" ? "AI Screenwriters assembling scenes..." : "Đang dựng kịch bản & ghép phân cảnh mầm non..."}
                      </h4>
                      <p className="text-slate-650 text-xs font-bold max-w-sm mx-auto leading-relaxed animate-pulse">
                        {lang === "en"
                          ? "Compiling beautiful visual blocks, playful character actions, baby laughter prompts, and interactive questions..."
                          : "Phác thảo khung hội thoại nhân vật ngộ nghĩnh, bối cảnh rực rỡ và các nhịp tương tác vỗ tay chuẩn mầm non..."}
                      </p>
                    </div>
                  ) : generatedScript ? (
                    <div className="space-y-6">
                      
                      {/* Summary Concept */}
                      <div className="space-y-2">
                        <span className="text-xs font-black text-slate-450 uppercase tracking-wider block">📌 {lang === "en" ? "Core Screenplay Concept" : "Tóm tắt Nội dung & Bài học Giáo dục"}:</span>
                        <p className="p-4 bg-yellow-50/15 border-2 border-slate-900 text-slate-800 text-xs font-extrabold leading-relaxed rounded-2xl shadow-3xs text-balance">
                          {generatedScript.summary}
                        </p>
                      </div>

                      {/* Header copy buttons */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fullScriptText = `GLOBAL KIDS CARTOON SCREENPLAY: ${generatedScript.title}\n\n` + 
                              `Narrative Summary: ${generatedScript.summary}\n\n` + 
                              generatedScript.segments.map((seg, i) => 
                                `SCENE ${i+1} (${seg.segmentType} - ${seg.durationSeconds}s):\n- Dialogue: ${seg.audioVoiceover}\n- Graphic Setting: ${seg.visualDescription}\n- Animated Gestures: ${seg.animationAction}`
                              ).join("\n\n");
                            copyToClipboard(fullScriptText, "full-script-unified");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-5 rounded-xl text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#121212] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:translate-y-0.5"
                        >
                          {copyStates["full-script-unified"] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                              {lang === "en" ? "Copied Screenplay!" : "Đã chép kịch bản!"}
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              {lang === "en" ? "Copy Full Screenplay" : "Chép toàn kịch bản"}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Storyboard Cards */}
                      <div className="space-y-4 pt-2">
                        <span className="text-xs font-black text-slate-450 uppercase tracking-wider block">📜 {lang === "en" ? "Timeline Segment breakdowns" : "Phát Thảo Cảnh Chi Tiết (Storyboard Timeline)"}:</span>
                        
                        <div className="space-y-6 border-l-3 border-slate-900 pl-4 md:pl-6 ml-1.5 font-sans">
                          {generatedScript.segments?.map((segment, idx) => (
                            <div key={idx} className="relative space-y-2.5">
                              
                              <div className="absolute -left-[24px] md:-left-[32px] bg-white border-3 border-slate-900 rounded-full w-4 h-4 flex items-center justify-center shadow-3xs top-3">
                                <div className="bg-[#fb7185] rounded-full w-1.5 h-1.5"></div>
                              </div>

                              <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937] hover:border-[#fb7185] transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                                  <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    segment.segmentType === "Hook" 
                                      ? "bg-rose-500 text-white border-rose-600" 
                                      : segment.segmentType === "Intro" 
                                        ? "bg-indigo-500 text-white border-indigo-600" 
                                        : segment.segmentType === "Engagement"
                                          ? "bg-amber-500 text-white border-amber-600"
                                          : "bg-slate-100 text-slate-800 border-slate-200"
                                  }`}>
                                    {segment.segmentType || "Scene"}
                                  </span>
                                  <h5 className="font-extrabold text-[#fb7185] text-xs font-mono">{segment.sceneName}</h5>
                                  <span className="bg-slate-100 text-slate-600 font-extrabold text-[9px] px-2 py-0.5 rounded shadow-3xs flex items-center gap-1 ml-auto">
                                    <Clock className="w-3 h-3" /> {segment.durationSeconds}s
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                                  
                                  <div className="md:col-span-8 space-y-2.5">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative shadow-3xs min-h-16">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block text-left">Dialogue Narrations:</span>
                                      <p className="text-slate-800 leading-normal font-sans text-[11px] font-extrabold pr-6 select-all text-left">{segment.audioVoiceover}</p>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if ("speechSynthesis" in window) {
                                            const utterance = new SpeechSynthesisUtterance(segment.audioVoiceover);
                                            utterance.lang = "en-US";
                                            utterance.rate = 0.85;
                                            window.speechSynthesis.cancel();
                                            window.speechSynthesis.speak(utterance);
                                          }
                                        }}
                                        className="absolute right-1.5 bottom-1.5 bg-white hover:bg-rose-500 hover:text-white border border-slate-350 hover:border-slate-950 p-1.5 rounded-lg transition-all cursor-pointer shadow-3xs animate-pulse"
                                        title="Click to Pronounce Dialogue with Voice Synthesizer"
                                      >
                                        <Volume2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="md:col-span-4 space-y-2 text-[10px]">
                                    <div className="p-2.5 bg-yellow-50/10 rounded-lg border border-slate-200 text-left">
                                      <span className="font-black text-slate-505 uppercase block">Graphics layout:</span>
                                      <p className="text-slate-750 leading-tight font-semibold mt-0.5">{segment.visualDescription}</p>
                                    </div>
                                    
                                    <div className="p-2.5 bg-blue-50/10 rounded-lg border border-slate-200 text-left">
                                      <span className="font-black text-slate-505 uppercase block">Animated Actions:</span>
                                      <p className="text-slate-750 leading-tight font-semibold mt-0.5">{segment.animationAction}</p>
                                    </div>
                                  </div>

                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Voiceover style directives */}
                      {generatedScript.promptForVoiceover && (
                        <div className="pt-4 border-t border-slate-200 text-left">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">🎤 Narrator Style Directives:</span>
                          <p className="text-slate-650 text-xs mt-0.5 font-bold leading-normal">{generatedScript.promptForVoiceover}</p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
                      <Video className="w-10 h-10 text-slate-400 mx-auto animate-bounce-slow" />
                      <h5 className="text-sm font-black text-slate-800">
                        {lang === "en" ? "Screenplay not compiled yet" : "Chưa biên soạn Kịch bản Hoạt hình"}
                      </h5>
                      <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                        {lang === "en"
                          ? `Ready to outline visual pacing, dialogues, sfx tags and scene directives tailored specifically for "${selectedTitle}".`
                          : `Sẵn sàng phác thảo tốc độ, hiệu ứng âm cảnh rực rỡ và nhịp tương tích cho tiêu đề đã chọn "${selectedTitle}".`}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleGenerateScript(undefined, selectedTitle)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-5 rounded-lg text-xs border-2 border-slate-900 shadow-3xs transition-all active:scale-98 cursor-pointer mt-2 inline-flex"
                      >
                        {lang === "en" ? "Generate Full Screenplay 🎬" : "Bắt đầu tạo kịch bản 🎬"}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: INTELLIGENT VIDEO SCRIPT (REMOVED - INTEGRATED TO THUMBNAIL TAB) */}
        {/* ====================================================================== */}
        {false && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* Header section */}
            <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b-3 border-slate-900 pb-5">
                <div>
                  <span className="bg-[#fb7185]/15 border-2 border-slate-900 text-slate-900 font-extrabold text-xs px-2.5 py-1.5 rounded-full uppercase tracking-wider shadow-3xs">
                    Pipeline Workspace
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                    <Video className="w-6 h-6 text-[#fb7185]" />
                    {lang === "en" ? "Interactive Kids Screenplay & Prompts Manager" : "Bộ Kịch Bản & Thiết Kế Phân Cảnh Hoạt Hình"}
                  </h3>
                  <p className="text-slate-600 text-xs font-bold mt-1">
                    {lang === "en" 
                      ? "Consolidated pipeline containing curated Title, Description, Hashtags, GenAI Prompts and complete Storyboard scene breakdowns." 
                      : "Trang tổng quan hợp nhất: Quản lý Tiêu đề, Mô tả, Hashtags, Prompts tạo ảnh và thông tin chi tiết từng Phân Cảnh."}
                  </p>
                </div>
                
                {/* Single action button to regenerate or generate screenplay */}
                <button
                  type="button"
                  onClick={() => handleGenerateScript(undefined, selectedTitle || scriptKeyword)}
                  disabled={isGeneratingScript}
                  className="bg-[#4ade80] hover:bg-[#4ade80]/90 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs border-3 border-slate-900 shadow-[4px_4px_0px_#1f2937] active:translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isGeneratingScript ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      {lang === "en" ? "Drafting Screenplay..." : "Đang tạo Kịch Bản..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      {generatedScript 
                        ? (lang === "en" ? "Regenerate Screenplay 🎬" : "Tạo Lại Kịch Bản Hoạt Hình 🎬")
                        : (lang === "en" ? "Generate Full Screenplay 🎬" : "Bắt Đầu Tạo Kịch Bản 🎬")}
                    </>
                  )}
                </button>
              </div>

              {/* Warnings/Fallbacks */}
              <div className="mt-4 space-y-3">
                {scriptError && (
                  <div className="bg-rose-50 border-3 border-slate-900 text-rose-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                    <div>
                      <strong className="block text-rose-900">{lang === "en" ? "Script Generation Error:" : "Lỗi Tạo Kịch Bản:"}</strong>
                      <span className="text-rose-700 font-semibold">{scriptError}</span>
                    </div>
                  </div>
                )}

                {scriptFallback && (
                  <div className="bg-amber-50 border-3 border-slate-900 text-amber-955 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <strong className="block text-amber-900">{lang === "en" ? "Dynamic Baseline Activated:" : "Chế độ Dự phòng Kích hoạt:"}</strong>
                      <span className="text-slate-700 font-semibold">
                        {lang === "en"
                          ? "Animation screenplay engines are at peak capacity. We've populated a pre-structured preschool blueprint matching your core concept."
                          : "Hệ thống AI đang quá tải. Chúng tôi đã chuẩn bị sẵn sơ đồ kịch bản chuẩn mầm non bám sát hoàn toàn đề tài của bạn."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Unified Screenboard container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT COLUMN: SELECTED METADATA & PROMPTS DISPENSARY */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Chosen SEO Details container (Title, Description, Hashtag) */}
                <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 shadow-[6px_6px_0px_#1f2937] space-y-5">
                  <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                      <span>🏷️</span> {lang === "en" ? "Selected SEO Metadata" : "Siêu Dữ Liệu SEO Đã Chọn"}
                    </h4>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const fullMeta = `TITLE:\n${selectedTitle || scriptKeyword || "No Title Selected"}\n\nDESCRIPTION:\n${selectedDescription || "No Description Selected"}\n\nHASHTAGS:\n${selectedDescription ? (selectedDescription.match(/#[A-Za-z0-0_]+/g) || []).join(" ") : ""}`;
                        copyToClipboard(fullMeta, "full-seo-meta");
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black py-1 px-2.5 rounded-lg border-2 border-slate-900 shrink-0 cursor-pointer shadow-[1px_1px_0px_#121212] flex items-center gap-1"
                    >
                      {copyStates["full-seo-meta"] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span className="text-[9px]">{lang === "en" ? "Copy All" : "Sao chép hết"}</span>
                    </button>
                  </div>

                  {/* Title Display */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                      <span>{lang === "en" ? "Selected Title:" : "Tiêu đề video:"}</span>
                      <button 
                        type="button" 
                        onClick={() => copyToClipboard(selectedTitle || scriptKeyword || "", "copy-meta-title")} 
                        className="text-rose-500 hover:text-rose-700 font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        {copyStates["copy-meta-title"] ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "en" ? "Copy Title" : "Chép tiêu đề"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-red-50/20 border-2 border-slate-900 rounded-xl text-xs text-slate-900 font-black leading-snug shadow-3xs">
                      {selectedTitle || scriptKeyword || (lang === "en" ? "No Title Selected (Choose a title on Analysis first)" : "Chưa chọn tiêu đề (Chọn tiêu đề ở Phân Tích trước)")}
                    </div>
                  </div>

                  {/* Description Display */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                      <span>{lang === "en" ? "Selected Description:" : "Mô tả video:"}</span>
                      <button 
                        type="button" 
                        onClick={() => copyToClipboard(selectedDescription || "", "copy-meta-desc")}
                        className="text-rose-500 hover:text-rose-700 font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        {copyStates["copy-meta-desc"] ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "en" ? "Copy Desc" : "Chép mô tả"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-55 border-2 border-slate-900 rounded-xl text-xs text-slate-800 font-bold leading-relaxed font-mono max-h-32 overflow-y-auto shadow-3xs">
                      {selectedDescription || (lang === "en" ? "No Description Selected." : "Chưa chọn mô tả ở tab Phân Tích.")}
                    </div>
                  </div>

                  {/* Hashtags Display */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                      <span>{lang === "en" ? "Selected Hashtags:" : "Hashtags đã chọn:"}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const tags = selectedDescription ? (selectedDescription.match(/#[A-Za-z0-9_]+/g) || []).join(" ") : "";
                          copyToClipboard(tags, "copy-meta-tags");
                        }} 
                        className="text-rose-500 hover:text-rose-700 font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        {copyStates["copy-meta-tags"] ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "en" ? "Copy Tags" : "Chép hashtags"}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-emerald-50/15 border-2 border-slate-900 rounded-xl min-h-12 shadow-3xs">
                      {selectedDescription && selectedDescription.match(/#[A-Za-z0-9_]+/g) ? (
                        selectedDescription.match(/#[A-Za-z0-9_]+/g)?.map((tag, idx) => (
                          <span key={idx} className="bg-emerald-100 text-emerald-800 border-2 border-slate-950 text-[10px] font-black py-0.5 px-2 rounded-lg shadow-3xs">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded border border-slate-300">#kidslearning</span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded border border-slate-300">#preschool</span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded border border-slate-300">
                            #{ (selectedTitle || scriptKeyword || "animation").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Artwork & Storyboard Prompts Dispenser (Thumbnail Prompts and Scene Prompts) */}
                <div className="bg-slate-900 text-white rounded-3xl border-4 border-slate-900 p-6 shadow-[6px_6px_0px_#1f2937] space-y-5">
                  <div>
                    <h4 className="text-sm font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span>🎨</span> {lang === "en" ? "Artwork & Scene GenAI Prompts" : "Phát Tạo Lệnh Vẽ (GenAI Prompts)"}
                    </h4>
                    <p className="text-slate-400 text-[10px] font-bold mt-1 leading-normal font-sans">
                      {lang === "en" ? "Optimized instructional prompts ready for Midjourney, Imagen, and Video screenplay generators." : "Sao chép trực tiếp để nhập vào các công cụ vẽ ảnh như Midjourney, Imagen và máy viết kịch bản dạng phim mầm non."}
                    </p>
                  </div>

                  {/* Thumbnail prompt */}
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
                      <span>{lang === "en" ? "1. Tool Prompt: Thumbnail Image (16:9)" : "1. Lệnh vẽ: Ảnh thu nhỏ (Thumbnail 16:9)"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const promptText = designedThumb?.aiImagePrompt || `Vivid cute 3D character design, Pixar style, high contrast, featuring themes of "${selectedTitle || scriptKeyword}", 16:9 widescreen`;
                          copyToClipboard(promptText, "copy-thumb-prompt");
                        }}
                        className="text-[#4ade80] hover:text-emerald-400 font-extrabold flex items-center gap-1 cursor-pointer select-none font-sans"
                      >
                        {copyStates["copy-thumb-prompt"] ? <Check className="w-3 h-3 text-emerald-400 stroke-[3px]" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "en" ? "Copy Prompt" : "Chép prompt ảnh"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-100 border-2 border-slate-950 rounded-xl text-[10px] font-mono leading-relaxed max-h-24 overflow-y-auto text-slate-800 select-all font-bold">
                      {designedThumb?.aiImagePrompt || `Cute 3D Pixar character cartoon style, high contrast, vibrant color panels, highly optimized, centering title concept "${selectedTitle || scriptKeyword || "preschool visual"}", 16:9 ratio`}
                    </div>
                  </div>

                  {/* Scene/Script prompt */}
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
                      <span>{lang === "en" ? "2. Tool Prompt: Screenplay Scenes" : "2. Lệnh viết: Kịch bản phân cảnh (Scenes)"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const sPrompt = designedThumb?.scriptScenesPrompt || `Generate comprehensive 3-act kids toy story screenplay with visual cues & audio sound effect rules for "${selectedTitle || scriptKeyword}"`;
                          copyToClipboard(sPrompt, "copy-scenes-prompt-tab");
                        }}
                        className="text-[#4ade80] hover:text-emerald-400 font-extrabold flex items-center gap-1 cursor-pointer select-none font-sans"
                      >
                        {copyStates["copy-scenes-prompt-tab"] ? <Check className="w-3 h-3 text-emerald-400 stroke-[3px]" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "en" ? "Copy Prompt" : "Chép prompt kịch bản"}</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-100 border-2 border-slate-950 rounded-xl text-[10px] font-mono leading-relaxed max-h-24 overflow-y-auto text-slate-800 select-all font-bold">
                      {designedThumb?.scriptScenesPrompt || `Arrange fully detailed children's toy cinematic narrative storyboard structure based on the video title "${selectedTitle || scriptKeyword || "preschool adventure"}" with sound effects, voiceover enunciation cues, and character gestures`}
                    </div>
                  </div>

                  {/* Quick trigger layout illustration */}
                  <div className="pt-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveTab("thumbnail")}
                      className="w-full bg-[#fb7185] hover:bg-[#fb7185]/90 text-white font-black py-2 rounded-xl text-[11px] border-2 border-slate-950 shadow-[2px_2px_0px_white] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1"
                    >
                      🎨 {lang === "en" ? "Go to Live Imagen Painter" : "Vẽ thử hình ảnh Live với Imagen"}
                    </button>
                  </div>
                </div>

              </div>
              
              {/* RIGHT COLUMN: DETAILED MOVEMENT SCENARIOS AND TIMELINES (Step 2 equivalent) */}
              <div className="lg:col-span-7 space-y-6">
                
                {isGeneratingScript && (
                  <div className="bg-white rounded-3xl border-4 border-slate-900 p-16 text-center shadow-[6px_6px_0px_#1f2937] space-y-4 animate-fade-in font-sans">
                    <div className="inline-flex p-4 bg-teal-50 border-3 border-slate-900 rounded-full animate-spin">
                      <RotateCw className="w-8 h-8 text-teal-600 font-black" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">
                      {lang === "en" ? "AI Screenwriters assembling scenes..." : "Đang dựng kịch bản & ghép phân cảnh mầm non..."}
                    </h4>
                    <p className="text-slate-600 text-xs font-bold max-w-sm mx-auto leading-relaxed animate-pulse">
                      {lang === "en"
                        ? "Compiling beautiful visual blocks, playful character actions, baby laughter prompts, and interactive questions..."
                        : "Phác thảo khung hội thoại nhân vật ngộ nghĩnh, bối cảnh rực rỡ và các nhịp tương tác vỗ tay chuẩn mầm non..."}
                    </p>
                  </div>
                )}

                {!isGeneratingScript && generatedScript ? (
                  <div className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937] space-y-6 animate-fade-in font-sans">
                    
                    {/* Header bar within the script panel */}
                    <div className="border-b-3 border-slate-900 pb-4 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#fb7185]/15 text-slate-1000 border-2 border-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#121212]">
                            👶 {generatedScript.targetAge || "3-5 years"}
                          </span>
                          <span className="bg-slate-100 text-slate-705 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-3xs">
                            ⏳ {generatedScript.videoDuration || "3-5 minutes"}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mt-2 font-sans">
                          {generatedScript.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const fullScriptText = `GLOBAL KIDS CARTOON SCREENPLAY: ${generatedScript.title}\n\n` + 
                            `Narrative Summary: ${generatedScript.summary}\n\n` + 
                            generatedScript.segments.map((seg, i) => 
                              `SCENE ${i+1} (${seg.segmentType} - ${seg.durationSeconds}s):\n- Dialogue: ${seg.audioVoiceover}\n- Graphic Setting: ${seg.visualDescription}\n- Animated Gestures: ${seg.animationAction}`
                            ).join("\n\n");
                          copyToClipboard(fullScriptText, "full-script-unified");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2 px-4 rounded-xl text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#121212] flex items-center justify-center gap-1 transition-all cursor-pointer active:translate-y-0.5"
                      >
                        {copyStates["full-script-unified"] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                            {lang === "en" ? "Copied Screenplay!" : "Đã chép kịch bản!"}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            {lang === "en" ? "Copy Full Screenplay" : "Chép toàn kịch bản"}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Summary Concept */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-slate-450 uppercase tracking-wider block">📌 {lang === "en" ? "Core Screenplay Concept" : "Tóm tắt Nội dung & Bài học Giáo dục"}:</span>
                      <p className="p-4 bg-yellow-50/15 border-2 border-slate-900 text-slate-800 text-xs font-extrabold leading-relaxed rounded-2xl shadow-3xs text-balance">
                        {generatedScript.summary}
                      </p>
                    </div>

                    {/* Storyboard Cards */}
                    <div className="space-y-4 pt-2">
                      <span className="text-xs font-black text-slate-450 uppercase tracking-wider block">📜 {lang === "en" ? "Timeline Segment breakdowns" : "Phát Thảo Cảnh Chi Tiết (Storyboard Timeline)"}:</span>
                      
                      <div className="space-y-6 border-l-3 border-slate-900 pl-4 md:pl-6 ml-1.5">
                        {generatedScript.segments?.map((segment, idx) => (
                          <div key={idx} className="relative space-y-2.5">
                            
                            {/* Connect dot */}
                            <div className="absolute -left-[24.5px] md:-left-[32.5px] bg-white border-3 border-slate-900 rounded-full w-4 h-4 flex items-center justify-center shadow-3xs">
                              <div className="bg-[#fb7185] rounded-full w-1.5 h-1.5"></div>
                            </div>

                            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937] hover:border-[#fb7185] transition-all">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                                <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  segment.segmentType === "Hook" 
                                    ? "bg-rose-500 text-white border-rose-600" 
                                    : segment.segmentType === "Intro" 
                                      ? "bg-indigo-500 text-white border-indigo-600" 
                                      : segment.segmentType === "Engagement"
                                        ? "bg-amber-500 text-white border-amber-600"
                                        : "bg-slate-100 text-slate-800 border-slate-200"
                                }`}>
                                  {segment.segmentType || "Scene"}
                                </span>
                                <h5 className="font-extrabold text-[#fb7185] text-xs font-mono">{segment.sceneName}</h5>
                                <span className="bg-slate-100 text-slate-600 font-extrabold text-[9px] px-2 py-0.5 rounded shadow-3xs flex items-center gap-1 ml-auto">
                                  <Clock className="w-3 h-3" /> {segment.durationSeconds}s
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                                
                                <div className="md:col-span-8 space-y-2.5">
                                  {/* Speech dialogue box */}
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 relative shadow-3xs min-h-16">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">Dialogue Narrations:</span>
                                    <p className="text-slate-800 leading-normal font-sans text-[11px] font-extrabold pr-6 select-all">{segment.audioVoiceover}</p>
                                    
                                    {/* Pronounce synthesis */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if ("speechSynthesis" in window) {
                                          const utterance = new SpeechSynthesisUtterance(segment.audioVoiceover);
                                          utterance.lang = "en-US";
                                          utterance.rate = 0.85;
                                          window.speechSynthesis.cancel();
                                          window.speechSynthesis.speak(utterance);
                                        }
                                      }}
                                      className="absolute right-1.5 bottom-1.5 bg-white hover:bg-rose-500 hover:text-white border border-slate-350 hover:border-slate-950 p-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                                      title="Click to Pronounce Dialogue with Voice Synthesizer"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="md:col-span-4 space-y-2 text-[10px]">
                                  {/* Visual blueprints */}
                                  <div className="p-2.5 bg-yellow-50/10 rounded-lg border border-slate-200">
                                    <span className="font-black text-slate-505 uppercase block">Graphics layout:</span>
                                    <p className="text-slate-700 leading-tight font-semibold mt-0.5">{segment.visualDescription}</p>
                                  </div>
                                  
                                  {/* Animated characters moves */}
                                  <div className="p-2.5 bg-blue-50/10 rounded-lg border border-slate-200">
                                    <span className="font-black text-slate-505 uppercase block">Animated Actions:</span>
                                    <p className="text-slate-700 leading-tight font-semibold mt-0.5">{segment.animationAction}</p>
                                  </div>
                                </div>

                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer instructions layout */}
                    {generatedScript.promptForVoiceover && (
                      <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">🎤 Narrator Style Directives:</span>
                          <p className="text-slate-600 text-xs mt-0.5 font-bold leading-normal">{generatedScript.promptForVoiceover}</p>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border-4 border-dashed border-slate-300 p-16 text-center shadow-[4px_4px_0px_#1f2937] space-y-4">
                    <Video className="w-12 h-12 text-slate-400 mx-auto animate-bounce-slow" />
                    <h4 className="text-lg font-black text-slate-900">
                      {lang === "en" ? "No screenplay generated yet" : "Chưa có kịch bản chi tiết"}
                    </h4>
                    <p className="text-slate-500 text-xs font-semibold max-w-sm mx-auto leading-relaxed">
                      {lang === "en" 
                        ? `Click "Generate Full Screenplay" button in header options to compile cute developmental interactive dialogue scenes immediately for "${selectedTitle || scriptKeyword || "your video"}"`
                        : `Nhấp nút "Bắt Đầu Tạo Kịch Bản" trên góc phải để tiến hành chuyển ngữ kịch bản rực rỡ và phân cảnh cho "${selectedTitle || scriptKeyword || "video của bạn"}"`}
                    </p>
                  </div>
                )}

              </div>
              
            </div>
            
          </div>
        )}

      </main>

      {/* Footer information */}
      <footer id="page-footer" className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 mt-20 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span className="text-white font-bold text-sm tracking-wider uppercase">ANIMATEKIDS BLUEPRINT ENGINE</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Helping independent creative channels design preschool and toddler-friendly visual universes with top-tier AI orchestration.
          </p>
          <div className="text-[11px] text-slate-600">
            © 2026 YouTube Kids Animation Development Planner. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
