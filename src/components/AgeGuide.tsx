import React, { useState } from "react";
import { Award, Compass, Eye, Volume2, Music, Clock, FileText, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { AgeGuideline } from "../types";

const ageGuidelinesData: AgeGuideline[] = [
  {
    range: "1-3 years",
    title: "Sensory & Cognitive Play (Toddlers & Babies)",
    psychology: "Toddlers are in their prime phase of sensory, auditory, and visual development. They love bright contrasting colors, repetitive physical loops, familiar animal voices, and friendly soft tones.",
    animationStyle: "Simple large 2D or 3D characters, oversized smiling eyes (CoComelon / BabyBus aesthetic). Slow and smooth panning movements to avoid eye fatigue.",
    musicPacing: "Calm yet cheerful nursery rhymes, repetitive rhythmic sequences, high-pitched playful mallet sounds, gentle instrumentals.",
    recommendedDuration: "1 - 3 minutes (Highly suited for fast-paced viral YouTube Shorts or basic song clips)",
    contentDo: [
      "Use sweet, warm voice-overs or funny gentle animal noises.",
      "Repeat core learning vocabulary (e.g. 'Red Color', 'Three Apples') 3 to 5 times in a sing-along chant.",
      "Vibrant baby-safe primary color palettes: lollipop red, sunny yellow, bright playground green."
    ],
    contentDont: [
      "Avoid rapid zoom-in/zoom-out or shaky chaotic tracking shots.",
      "No sudden scary loud sound effects or angry character voice overtones.",
      "Do not clutter the frame with more than two key interacting elements."
    ],
    popularExamples: ["Animated Baby Shark Sing-Along", "Cute Bear Eating Colorful Fruits", "Lullaby of the Sleeping Angels"],
    hotHooks: [
      "🎁 Peek-a-boo! What is hiding inside this magical birthday box?",
      "🐶 Woof woof! Can you help Spot the rescue pup find his missing bone?",
      "🍎 Look, a shiny red apple! Let's count them one by one with Teddy!"
    ]
  },
  {
    range: "3-5 years",
    title: "Intuitive Thinking & Pretend Play (Preschoolers)",
    psychology: "Kids start to role-play, showing intense curiosity about real-world scenarios like emergency vehicles, tiny friendly dinosaurs, and color mixing. They crave interactive rewards.",
    animationStyle: "Bright 3D animation with active heroic vehicle rescues (Paw Patrol style) or cozy episodic family interactions (Peppa Pig style). Characters should directly dialogue with the viewer.",
    musicPacing: "Nostalgic adventure beats, energetic clapping, cheering sound effects, and clear sound indicators (e.g., 'DING!' when answering correctly).",
    recommendedDuration: "3 - 5 minutes (Perfect pocket stories for early childhood engagement)",
    contentDo: [
      "Embed visual quizzes choosing colors, shapes, counting with a 3-second friendly countdown.",
      "Simple hero story arcs: a fire engine putting out funny cartoon clouds, or a baby dinosaur finding its nest.",
      "Always praise the child for participating: 'Great job! You are so smart!'"
    ],
    contentDont: [
      "Avoid scary monsters or sharp teeth that could cause nightmares.",
      "Do not explain abstract math or grammar theories; keep it fully intuitive."
    ],
    popularExamples: ["Rescue Car Team: Saving the Lost Black Cat", "Baby Dinosaur T-Rex learning to count watermelons", "Bunny Sharing Rainbow Cotton Candies"],
    hotHooks: [
      "🚨 Whee-woo! Whee-woo! The Fire Rescue Team is ready for a big adventure!",
      "🦕 Oh no! Baby T-Rex lost his yummy yellow banana! Let's search together!",
      "🎨 Magical color mix time! What happens when we mix blue and yellow?"
    ]
  },
  {
    range: "5-8 years",
    title: "Early Explored & Storyworld Adventures (Early Schoolers)",
    psychology: "Equipped with elementary logic, kids love learning about Space, Earth science, animal habits, and the human body. They enjoy heroic battles between cute good/bad setups.",
    animationStyle: "Rich and expressive. Faster pacing, dynamic camera angles, and immersive cartoon landscapes to maintain curiosity.",
    musicPacing: "Inspiring cinematic background music, curious exploration melodies, and whimsical fantasy sound designs.",
    recommendedDuration: "5 - 8 minutes (Comprehensive narrative content with a soft moral/scientific lesson)",
    contentDo: [
      "Incorporate simple visual animated mechanics to explain clean science (e.g., how rain patterns form).",
      "Develop storylines where characters must cooperate or show kindness to succeed.",
      "Incorporate daily healthy habits like brushing teeth, school courtesy, or keeping toys clean."
    ],
    contentDont: [
      "Do not resolve cartoon conflict using physical aggression.",
      "Avoid boring monologues; keep explanations dynamic with active character examples."
    ],
    popularExamples: ["Space Robot Exploring the Milky Way", "Why Does It Rain? Animated Kids Guide", "Amazon Rainforest: The Quest for the Golden Turtle"],
    hotHooks: [
      "🚀 Rocket ship launch! What secrets are hiding on the hot Surface of the Sun?",
      "🦷 Watch out! The Sugar Monster is attacking our shiny teeth! Let's brush them away!",
      "🦕 How did dinosaurs actually live millions of years ago? Hop onto our Time Machine!"
    ]
  },
  {
    range: "8-10 years",
    title: "Creative Logic, Gaming & Brain Teasers (Pre-Teens)",
    psychology: "Pre-teens love quirky humor, gaming environments (Minecraft/Roblox styles), mind-boggling interactive riddles, and mystery solver challenges.",
    animationStyle: "Pixelated voxel blocky styles, playful comic cartoon expressions, modern clean cartoon designs with funny twists.",
    musicPacing: "Groovy upbeat tempos, wholesome funny meme-like sound effects, cozy instrumental study lo-fi.",
    recommendedDuration: "5 - 10 minutes (Ideal for interactive detective scenarios and IQ mystery challenges)",
    contentDo: [
      "Format as a 'Detective Challenge' giving visual clues so kid viewers guess the puzzle.",
      "Embrace friendly gaming styles and casual slang suitable for young kids.",
      "Keep the humor silly, slapstick, lighthearted, and highly relatable to school life."
    ],
    contentDont: [
      "Do not show dangerous practical jokes that children might copy at home.",
      "Avoid overly simple themes that might feel 'too childish' for this smart group."
    ],
    popularExamples: ["10 Wholesome Kid Detective Riddles (Only 5% Can Solve!)", "Minecraft Blocky Village: The Case of the Wandering Sheep", "Weird Scientific Inventions That Are Actually Real"],
    hotHooks: [
      "🔍 Calling all kid detectives! Who ate the principal's principal chocolate cake?",
      "🌋 The floor is hot red lava! Escaping the school island with the Clever Bunny!",
      "💡 Can a simple paper airplane fly all the way to Antarctica? Let's trace it!"
    ]
  }
];

export function AgeGuide() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const guide = ageGuidelinesData[activeTab];

  return (
    <div id="age-guide-container" className="bg-white rounded-3xl border-4 border-slate-900 p-6 md:p-8 shadow-[8px_8px_0px_#1f2937]">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b-3 border-slate-900 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-7 h-7 text-rose-500 animate-pulse" />
            Global YouTube Kids Development Playbook
          </h2>
          <p className="text-slate-600 text-xs font-semibold mt-1">
            Build content tailored to children's core developmental psychology to skyrocket organic audience retention.
          </p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border-2 border-slate-900 shadow-[3px_3px_0px_#1f2937]">
          {ageGuidelinesData.map((item, idx) => (
            <button
              id={`age-tab-btn-${idx}`}
              key={item.range}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all duration-300 cursor-pointer ${
                activeTab === idx
                  ? "bg-[#fb7185] text-white border-2 border-slate-900 shadow-[1px_1px_0px_#1f2937] scale-105"
                  : "text-slate-600 hover:text-[#fb7185] hover:bg-white/50"
              }`}
            >
              {item.range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Core Psychology Info Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#fb7185]/10 rounded-2xl p-6 border-3 border-slate-900 shadow-[4px_4px_0px_#1f2937] transition-all">
            <h3 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-rose-500" />
              {guide.title}
            </h3>
            <p className="text-slate-700 font-semibold leading-relaxed text-sm md:text-base">
              {guide.psychology}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border-3 border-slate-900 rounded-xl shadow-[3px_3px_0px_#1f2937] space-y-1">
              <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Animation Style</span>
              <div className="flex items-start gap-2 pt-1">
                <Eye className="w-5 h-5 text-indigo-550 shrink-0 mt-0.5" />
                <p className="text-slate-800 text-xs font-semibold leading-relaxed">{guide.animationStyle}</p>
              </div>
            </div>

            <div className="p-4 bg-white border-3 border-slate-900 rounded-xl shadow-[3px_3px_0px_#1f2937] space-y-1">
              <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Music & Sound Pacing</span>
              <div className="flex items-start gap-2 pt-1">
                <Music className="w-5 h-5 text-emerald-555 shrink-0 mt-0.5" />
                <p className="text-slate-800 text-xs font-semibold leading-relaxed">{guide.musicPacing}</p>
              </div>
            </div>

            <div className="p-4 bg-white border-3 border-slate-900 rounded-xl shadow-[3px_3px_0px_#1f2937] space-y-1">
              <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Recommended Length</span>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-5 h-5 text-amber-555 shrink-0 mt-0.5" />
                <p className="text-slate-800 text-xs font-extrabold leading-relaxed">{guide.recommendedDuration}</p>
              </div>
            </div>
          </div>

          {/* DOs & DONTs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-[#4ade80]/10 border-3 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0px_#1f2937]">
              <h4 className="text-slate-900 font-extrabold mb-3 flex items-center gap-2 text-sm md:text-base">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Do's (Recommended)
              </h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-700 font-semibold">
                {guide.contentDo.map((doItem, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{doItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#fb7185]/10 border-3 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0px_#1f2937]">
              <h4 className="text-slate-900 font-extrabold mb-3 flex items-center gap-2 text-sm md:text-base">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Don'ts (Avoid)
              </h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-700 font-semibold">
                {guide.contentDont.map((dontItem, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{dontItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Hooks & Ideas */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#fb923c]/10 border-3 border-slate-900 rounded-2xl p-5 space-y-3 shadow-[4px_4px_0px_#1f2937]">
            <h4 className="text-slate-900 font-black flex items-center gap-2 text-sm md:text-base">
              <Lightbulb className="w-5 h-5 text-amber-500 animate-bounce" />
              Viral Hook Ideas (First 5 Seconds)
            </h4>
            <p className="text-slate-600 text-xs font-semibold text-balance">
              Hooking your little viewers in the first 5 seconds is extremely critical to trigger the YouTube recommendation algorithm:
            </p>
            <div className="space-y-2.5 pt-1">
              {guide.hotHooks.map((hook, i) => (
                <div key={i} className="p-3 bg-white border-2 border-slate-900 rounded-xl text-xs text-slate-850 font-bold leading-relaxed italic shadow-[2px_2px_0px_#1f2937]">
                  {hook}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#c084fc]/10 border-3 border-slate-900 rounded-2xl p-5 space-y-3 shadow-[4px_4px_0px_#1f2937]">
            <h4 className="text-slate-900 font-black flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-indigo-500" />
              Trending Concept Examples:
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {guide.popularExamples.map((example, i) => (
                <span key={i} className="bg-white border-2 border-slate-900 text-slate-900 font-extrabold text-xs px-2.5 py-1.5 rounded-lg shadow-[2px_2px_0px_#1f2937]">
                  ✨ {example}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
