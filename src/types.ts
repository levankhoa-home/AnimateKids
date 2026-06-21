export interface YouTubeKeyword {
  keyword: string;
  searchVolume: number; // monthly search volume
  trendPercentage: number; // e.g. +45% (growth in today's search)
  competition: "Low" | "Medium" | "High";
  difficultyScore: number; // 1 to 100 (lower is easier)
  avgCpc: number; // simulated cost or high-value indicator (USD)
  ageGroup: string; // e.g. "1-3 years", "3-5 years", "5-8 years", "8-10 years"
  subNiche: string; // e.g. "Nursery Rhymes", "Counting", "Dinosaur Educational", etc.
  intentDescription: string; // Search intent details
  viewerVelocity: "Exploding 🚀" | "Spiking 📈" | "Steady ➡️";
}

export interface AgeGuideline {
  range: string;
  title: string;
  psychology: string;
  animationStyle: string;
  musicPacing: string;
  recommendedDuration: string;
  contentDo: string[];
  contentDont: string[];
  popularExamples: string[];
  hotHooks: string[];
}

export interface ScriptSegment {
  id: string;
  sceneName: string;
  durationSeconds: number;
  visualDescription: string;
  audioVoiceover: string;
  animationAction: string; // Character gestures and movements
  segmentType: "Hook" | "Intro" | "Main" | "Engagement" | "CTA/Outro";
}

export interface VideoScript {
  id: string;
  title: string;
  keyword: string;
  targetAge: string;
  videoDuration: string;
  summary: string;
  segments: ScriptSegment[];
  promptForVoiceover: string;
}

export interface ThumbnailConcept {
  id: string;
  keyword: string;
  suggestedTitles: string[];
  focusElements: string[]; // Hero characters, emotional states
  colorScheme: string; // Dominant colors
  backgroundIdea: string; // Background setting instruction
  overlayText: string; // Bold text printed on the thumbnail
  aiImagePrompt: string; // Optimized prompt for Midjourney / Imagen
  scriptScenesPrompt?: string; // Prompt for screenplay or video scenes generator
  styleType: "Cute 3D Pixar" | "Flat 2D CoComelon Style" | "Classic Watercolor Whimsical" | "Playful Claymation";
}
