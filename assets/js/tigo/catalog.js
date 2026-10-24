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
// Bahay ni Tigo (room-ui.js): gamit, dingding at sahig. Kapareho ng ITEMS sa backend/pet-fast.ts (slot furn / wall / floor)
export const HOME_TABS = [
  { id: "furn", name: "Furniture", icon: "🛋️" },
  { id: "wall", name: "Walls", icon: "🧱" },
  { id: "floor", name: "Floors", icon: "🟫" },
];
export const HOME_ITEMS = [
  { id: "bed", slot: "furn", name: "Bed", icon: "🛏️", price: 0, level: 1 },
  { id: "rug", slot: "furn", name: "Round rug", icon: "⭕", price: 0, level: 1 },
  { id: "plant", slot: "furn", name: "Plant", icon: "🪴", price: 0, level: 1 },
  { id: "lamp", slot: "furn", name: "Floor lamp", icon: "💡", price: 0, level: 1 },
  { id: "chair", slot: "furn", name: "Chair", icon: "🪑", price: 25, level: 1 },
  { id: "table", slot: "furn", name: "Table", icon: "🍽️", price: 40, level: 1 },
  { id: "banig", slot: "furn", name: "Banig mat", icon: "🧺", price: 30, level: 1 },
  { id: "cactus", slot: "furn", name: "Cactus", icon: "🌵", price: 30, level: 1 },
  { id: "toybox", slot: "furn", name: "Toy box", icon: "🧸", price: 40, level: 1 },
  { id: "beanbag", slot: "furn", name: "Bean bag", icon: "🫘", price: 50, level: 2 },
  { id: "fan", slot: "furn", name: "Electric fan", icon: "🌀", price: 60, level: 2 },
  { id: "bookshelf", slot: "furn", name: "Bookshelf", icon: "📚", price: 70, level: 2 },
  { id: "sofa", slot: "furn", name: "Sofa", icon: "🛋️", price: 90, level: 2 },
  { id: "desk", slot: "furn", name: "Desk", icon: "🖥️", price: 80, level: 3 },
  { id: "majlis", slot: "furn", name: "Majlis cushions", icon: "🕌", price: 100, level: 3 },
  { id: "fridge", slot: "furn", name: "Fridge", icon: "🧊", price: 110, level: 3 },
  { id: "tv", slot: "furn", name: "TV", icon: "📺", price: 120, level: 3 },
  { id: "aquarium", slot: "furn", name: "Aquarium", icon: "🐠", price: 150, level: 4 },
  { id: "piano", slot: "furn", name: "Piano", icon: "🎹", price: 200, level: 5 },
  { id: "painting", slot: "furn", name: "Painting", icon: "🖼️", price: 40, level: 1, wall: true },
  { id: "clock", slot: "furn", name: "Wall clock", icon: "🕰️", price: 35, level: 1, wall: true },
  { id: "shelf", slot: "furn", name: "Wall shelf", icon: "🗄️", price: 30, level: 1, wall: true },
  { id: "banner-ph", slot: "furn", name: "PH banner", icon: "🇵🇭", price: 20, level: 1, wall: true },
  { id: "banner-bh", slot: "furn", name: "BH banner", icon: "🇧🇭", price: 20, level: 1, wall: true },
  { id: "mirror", slot: "furn", name: "Mirror", icon: "🪞", price: 60, level: 2, wall: true },
  { id: "garland", slot: "furn", name: "Star lights", icon: "✨", price: 80, level: 2, wall: true },
  { id: "wall-cream", slot: "wall", name: "Cream", icon: "🤍", price: 0, level: 1, color: "#f6ecd9" },
  { id: "wall-sky", slot: "wall", name: "Sky", icon: "🩵", price: 30, level: 1, color: "#cfe8ff" },
  { id: "wall-mint", slot: "wall", name: "Mint", icon: "💚", price: 30, level: 1, color: "#cdf3e9" },
  { id: "wall-blush", slot: "wall", name: "Blush", icon: "🩷", price: 30, level: 1, color: "#ffd9e4" },
  { id: "wall-lilac", slot: "wall", name: "Lilac", icon: "💜", price: 40, level: 2, color: "#e5dcff" },
  { id: "wall-sawali", slot: "wall", name: "Sawali", icon: "🎋", price: 60, level: 2, color: "#e2c48f" },
  { id: "wall-stripes", slot: "wall", name: "Stripes", icon: "🍑", price: 60, level: 2, color: "#ffc9a8" },
  { id: "wall-wood", slot: "wall", name: "Wood", icon: "🪵", price: 70, level: 3, color: "#c99b6d" },
  { id: "wall-stars", slot: "wall", name: "Starry night", icon: "🌌", price: 80, level: 3, color: "#26306b" },
  { id: "floor-planks", slot: "floor", name: "Wood planks", icon: "🪵", price: 0, level: 1, color: "#c58f5e" },
  { id: "floor-tiles", slot: "floor", name: "Tiles", icon: "🔲", price: 40, level: 1, color: "#9ad2ff" },
  { id: "floor-carpet", slot: "floor", name: "Carpet", icon: "🟪", price: 50, level: 2, color: "#b9a2ff" },
  { id: "floor-bamboo", slot: "floor", name: "Bamboo", icon: "🎍", price: 60, level: 2, color: "#d8b878" },
  { id: "floor-grass", slot: "floor", name: "Grass", icon: "🌿", price: 70, level: 3, color: "#8fd18a" },
  { id: "floor-marble", slot: "floor", name: "Marble", icon: "🤍", price: 90, level: 4, color: "#f4f1ee" },
];
export const homeItem = (id) => HOME_ITEMS.find((i) => i.id === id) || null;
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
