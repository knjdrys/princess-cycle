/**
 * PrincessCycle - Artistic Affirmations & "Spicy Mode" Mood Comfort Engine
 * Emotional validation, artistic inspiration, and quick irritability soothing for a 21yo Princess
 */

export const ARTISTIC_AFFIRMATIONS = [
  {
    quote: "Ganda mo today, Princess! ✨ Valid ang feelings mo, hindi mo kailangang mag-explain sa mundo.",
    vibe: "🎨 Emotional Masterpiece",
    tip: "Mag-journal, mag-sketch, or just listen to your fave OPM/K-pop songs with no rush."
  },
  {
    quote: "Okay lang maging maldita or spicy today. Cute ka pa rin! Handle with care lang muna 💜",
    vibe: "😾 Softly Spicy / Maldita Vibe",
    tip: "Isaksak ang earphones, mag-burrito blanket sa aircon or electric fan, and ignore the noise."
  },
  {
    quote: "Napakabuti ng puso mo, Princess. Yakapin mo ang sarili mo today with a warm cup of Salabat or Tsokolate.",
    vibe: "🧁 Sweet Angel / Mabait Girlie",
    tip: "Order your favorite Boba Milk Tea or Mango Shake today — deserve mo 'yan!"
  },
  {
    quote: "Inhale fairy dust, exhale ang mga stress at toxic na tao. Royalty ka, hindi ka basta-basta!",
    vibe: "✨ Unbothered Royalty",
    tip: "Huminga nang malalim gamit ang Fairy Breathing Pacer para bumaba ang adrenaline."
  },
  {
    quote: "Ang bawat araw ay pastel canvas. Ikaw ang pipili ng kulay at vibe mo today, beautiful 🌸",
    vibe: "🌸 Creative Spark / Inspira",
    tip: "Gumawa ng something artistic o mag-picture ng aesthetic sunset for pure joy."
  },
  {
    quote: "Hindi mo kailangan maging hyper-productive para maging worthy of love and comfort food today.",
    vibe: "🧸 Cozy Hermit / Bahay Vibe",
    tip: "Kain ng mainit na Sinigang, Lugaw, or Champorado. Rest is sacred!"
  },
  {
    quote: "Marupok man today, malakas at resilient pa rin bukas. Trust the natural rhythm of your body 💜",
    vibe: "🥺 Soft & Emotional",
    tip: "Umiyak kung kailangan, tapos mag-hilamos at mag-skin care. Fresh ka pa rin!"
  }
];

export const SPICY_RESCUE_TIPS = [
  "🧋 Magpa-Grab / FoodPanda ng paborito mong Pearl Milk Tea or Peach Mango Pie right now!",
  "🎧 Isuot ang headphones, patugtugin ang favorite playlist, at i-mute muna ang group chat.",
  "🍲 Humigop ng mainit at maasim na sabaw ng Sinigang or Arroz Caldo — instant comfort sa puson at puso.",
  "💆‍♀️ 4-4-4-4 slow deep belly breathing: Hayaan mong kumalma ang nervous system mo, Princess.",
  "🛌 Blanket burrito mode + electric fan / AC on high: Off-limits ka muna sa mga nakakainis na bagay.",
  "🍫 Mag-tsokolate or kumain ng warm Pandesal / Ensaymada habang nanonood ng comfort series."
];

export class AffirmationManager {
  static getDailyAffirmation() {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % ARTISTIC_AFFIRMATIONS.length;
    return ARTISTIC_AFFIRMATIONS[index];
  }

  static getRandomSpicyTip() {
    return SPICY_RESCUE_TIPS[Math.floor(Math.random() * SPICY_RESCUE_TIPS.length)];
  }
}

