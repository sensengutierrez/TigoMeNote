/* TigoMeNote · tigo/catalog.js — lahat ng puwedeng isuot/gamitin ni Tigo (closet at shop)
   Sariling disenyo lahat (gawa sa code ng outfit.js, backdrops.js at buddies.js).
   Bawat item: { id, slot, name, icon, price (coins), level (kailangang level) }
   Ang price/level ay kapareho ng ITEMS sa backend/pet-fast.ts (doon ang tunay na check). */
export const SLOTS = [
  { id: "set", name: "Sets", icon: "🎁" },
  { id: "hat", name: "Hats", icon: "🧢" },
  { id: "face", name: "Face", icon: "🕶️" },
  { id: "body", name: "Clothes", icon: "👕" },
  { id: "hand", name: "Hand", icon: "🍦" },
  { id: "buddy", name: "Buddies", icon: "🐶" },
  { id: "backdrop", name: "Places", icon: "🏝️" },
];

export const ITEMS = [
  // ---------- hats ----------
  { id: "sprout", slot: "hat", name: "Sprout", icon: "🌱", price: 0, level: 2 },
  { id: "bow", slot: "hat", name: "Bow", icon: "🎀", price: 0, level: 3 },
  { id: "cap", slot: "hat", name: "Cap", icon: "🧢", price: 0, level: 4 },
  { id: "headphones", slot: "hat", name: "Headphones", icon: "🎧", price: 0, level: 5 },
  { id: "crown", slot: "hat", name: "Crown", icon: "👑", price: 0, level: 7 },
  { id: "beanie", slot: "hat", name: "Beanie", icon: "🧶", price: 40, level: 1 },
  { id: "party", slot: "hat", name: "Party hat", icon: "🥳", price: 30, level: 1 },
  { id: "bunny", slot: "hat", name: "Bunny ears", icon: "🐰", price: 60, level: 2 },
  { id: "sampaguita", slot: "hat", name: "Sampaguita crown", icon: "🌼", price: 80, level: 3 },
  { id: "salakot", slot: "hat", name: "Salakot", icon: "👒", price: 90, level: 4 },
  { id: "chef", slot: "hat", name: "Chef hat", icon: "👨‍🍳", price: 70, level: 3 },
  { id: "halo", slot: "hat", name: "Halo", icon: "😇", price: 150, level: 6 },
  // ---------- face ----------
  { id: "shades", slot: "face", name: "Shades", icon: "🕶️", price: 40, level: 1 },
  { id: "round", slot: "face", name: "Round glasses", icon: "👓", price: 30, level: 1 },
  { id: "hearts", slot: "face", name: "Heart glasses", icon: "😍", price: 60, level: 2 },
  { id: "stars", slot: "face", name: "Star glasses", icon: "🤩", price: 60, level: 2 },
  { id: "goggles", slot: "face", name: "Goggles", icon: "🥽", price: 80, level: 3 },
  { id: "mustache", slot: "face", name: "Mustache", icon: "🥸", price: 50, level: 2 },
  { id: "mask", slot: "face", name: "Hero mask", icon: "🦸", price: 90, level: 4 },
  // ---------- clothes ----------
  { id: "scarf", slot: "body", name: "Scarf", icon: "🧣", price: 40, level: 1 },
  { id: "bowtie", slot: "body", name: "Bow tie", icon: "🎀", price: 30, level: 1 },
  { id: "hoodie", slot: "body", name: "Hoodie", icon: "🧥", price: 90, level: 2 },
  { id: "cape", slot: "body", name: "Hero cape", icon: "🦸", price: 120, level: 4 },
  { id: "backpack", slot: "body", name: "Backpack", icon: "🎒", price: 70, level: 3 },
  { id: "lei", slot: "body", name: "Flower lei", icon: "🌺", price: 60, level: 2 },
  { id: "medal", slot: "body", name: "Gold medal", icon: "🥇", price: 200, level: 6 },
  // ---------- hand ----------
  { id: "icecream", slot: "hand", name: "Ice cream", icon: "🍦", price: 25, level: 1 },
  { id: "balloon", slot: "hand", name: "Balloon", icon: "🎈", price: 25, level: 1 },
  { id: "flag-ph", slot: "hand", name: "PH flag", icon: "🇵🇭", price: 20, level: 1 },
  { id: "flag-bh", slot: "hand", name: "BH flag", icon: "🇧🇭", price: 20, level: 1 },
  { id: "umbrella", slot: "hand", name: "Umbrella", icon: "☂️", price: 60, level: 2 },
  { id: "guitar", slot: "hand", name: "Guitar", icon: "🎸", price: 120, level: 4 },
  { id: "wand", slot: "hand", name: "Star wand", icon: "🪄", price: 150, level: 5 },
  // ---------- buddies ----------
  { id: "puppy", slot: "buddy", name: "Puppy", icon: "🐶", price: 100, level: 2 },
  { id: "kitty", slot: "buddy", name: "Kitty", icon: "🐱", price: 100, level: 2 },
  { id: "birdie", slot: "buddy", name: "Maya bird", icon: "🐦", price: 80, level: 1 },
  { id: "bunbun", slot: "buddy", name: "Bunny", icon: "🐇", price: 120, level: 3 },
  { id: "turtle", slot: "buddy", name: "Pawikan", icon: "🐢", price: 150, level: 4 },
  { id: "chick", slot: "buddy", name: "Sisiw", icon: "🐥", price: 60, level: 1 },
  // ---------- places ----------
  { id: "island", slot: "backdrop", name: "Island", icon: "🏝️", price: 0, level: 1 },
  { id: "beach", slot: "backdrop", name: "Beach", icon: "🏖️", price: 80, level: 2 },
  { id: "coral", slot: "backdrop", name: "Coral reef", icon: "🪸", price: 120, level: 3 },
  { id: "snow", slot: "backdrop", name: "Snowland", icon: "⛄", price: 120, level: 3 },
  { id: "clouds", slot: "backdrop", name: "Cloud land", icon: "☁️", price: 150, level: 4 },
  { id: "desert", slot: "backdrop", name: "Desert oasis", icon: "🌴", price: 150, level: 4 },
  { id: "moon", slot: "backdrop", name: "Moon base", icon: "🌙", price: 250, level: 6 },
];
// Sets: isang pindot = buong outfit (kailangang pag-aari na ang bawat piraso)
export const SETS = [
  { id: "set-beach", name: "Beach day", icon: "🏖️", wear: { hat: "salakot", face: "shades", body: "lei", hand: "icecream", backdrop: "beach" } },
  { id: "set-winter", name: "Winter", icon: "⛄", wear: { hat: "beanie", body: "scarf", hand: "balloon", backdrop: "snow" } },
  { id: "set-hero", name: "Hero", icon: "🦸", wear: { face: "mask", body: "cape", hand: "wand", backdrop: "clouds" } },
  { id: "set-royal", name: "Royal", icon: "👑", wear: { hat: "crown", body: "medal", hand: "wand", backdrop: "moon" } },
  { id: "set-pinoy", name: "Pinoy pride", icon: "🇵🇭", wear: { hat: "salakot", body: "lei", hand: "flag-ph", buddy: "chick", backdrop: "island" } },
  { id: "set-gulf", name: "Gulf life", icon: "🇧🇭", wear: { face: "shades", hand: "flag-bh", buddy: "birdie", backdrop: "desert" } },
];
export const item = (id) => ITEMS.find((i) => i.id === id) || null;

// Growth journey: anong makukuha sa bawat level
export const JOURNEY = [
  { level: 1, title: "Hello, Tigo!", reward: "Island home", icon: "🏝️" },
  { level: 2, title: "Little sprout", reward: "🌱 Sprout + shop items", icon: "🌱" },
  { level: 3, title: "Best friends", reward: "🎀 Bow", icon: "🎀" },
  { level: 4, title: "Adventurer", reward: "🧢 Cap", icon: "🧢" },
  { level: 5, title: "Music lover", reward: "🎧 Headphones", icon: "🎧" },
  { level: 6, title: "Shining star", reward: "Halo, medal & Moon base in shop", icon: "⭐" },
  { level: 7, title: "Royal Tigo", reward: "👑 Crown", icon: "👑" },
  { level: 8, title: "Explorer", reward: "+100 coins", icon: "🧭" },
  { level: 9, title: "Legend", reward: "+150 coins", icon: "🏆" },
  { level: 10, title: "Tigo Master", reward: "Golden Tigo glow", icon: "🌟" },
];
