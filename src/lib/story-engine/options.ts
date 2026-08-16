/** Human-friendly labels for the preference options, used by the onboarding UI. */

export const THEME_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "space", label: "Space & stars", emoji: "🚀" },
  { value: "dinosaurs", label: "Dinosaurs", emoji: "🦕" },
  { value: "fairies", label: "Fairies & magic", emoji: "🧚" },
  { value: "pirates", label: "Pirates", emoji: "🏴‍☠️" },
  { value: "animals", label: "Animals", emoji: "🦊" },
  { value: "ocean", label: "Under the sea", emoji: "🐋" },
  { value: "forest", label: "Forests & woods", emoji: "🌲" },
  { value: "dragons", label: "Dragons", emoji: "🐉" },
  { value: "vehicles", label: "Trains & vehicles", emoji: "🚂" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "everyday-adventures", label: "Everyday adventures", emoji: "🏡" },
  { value: "mystery", label: "Gentle mysteries", emoji: "🔍" },
  { value: "friendship", label: "Friendship", emoji: "🤝" },
  { value: "seasons", label: "Seasons & weather", emoji: "🍂" },
  { value: "fantasy-kingdoms", label: "Faraway kingdoms", emoji: "🏰" },
];

export const TONE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "gentle", label: "Gentle & calm", emoji: "🌙" },
  { value: "adventurous", label: "Adventurous", emoji: "🧭" },
  { value: "funny", label: "Funny & silly", emoji: "😄" },
  { value: "curious", label: "Curious & clever", emoji: "💡" },
  { value: "cosy", label: "Cosy & warm", emoji: "🧸" },
  { value: "magical", label: "Magical & dreamy", emoji: "✨" },
];

export const VALUE_OPTIONS: { value: string; label: string }[] = [
  { value: "kindness", label: "Kindness" },
  { value: "bravery", label: "Bravery" },
  { value: "sharing", label: "Sharing" },
  { value: "honesty", label: "Honesty" },
  { value: "curiosity", label: "Curiosity" },
  { value: "resilience", label: "Bouncing back" },
  { value: "patience", label: "Patience" },
  { value: "teamwork", label: "Teamwork" },
  { value: "gratitude", label: "Gratitude" },
  { value: "self-belief", label: "Self-belief" },
];

export const READING_LEVELS: { value: string; label: string; hint: string }[] = [
  { value: "pre-reader", label: "Pre-reader", hint: "Ages 2–4 · very simple, lots of repetition" },
  { value: "early", label: "Early reader", hint: "Ages 4–6 · short sentences, gentle plots" },
  { value: "confident", label: "Confident reader", hint: "Ages 6–8 · richer words, chapters" },
  { value: "advanced", label: "Advanced reader", hint: "Ages 8–10 · longer, more nuance" },
];
