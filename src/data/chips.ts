export interface Chip {
  id: string;
  name: string;
  brand: string;
  description: string;
  characteristics: string[];
  spiceLevel: number; // 1-5
  crunchLevel: number; // 1-5
  color: string; // Tailwind gradient classes
  accentColor: string; // Tailwind hex or border class
  anecdote?: string;
  emoji: string;
}

export const CHIPS: Chip[] = [
  {
    id: "siete-nacho",
    name: "Grain Free Nacho Tortilla Chips",
    brand: "Siete Family Foods",
    description: "A dairy-free, grain-free take on classic nacho cheese tortilla chips. Made with cassava flour and avocado oil, seasoned with nutritional yeast, garlic, and tomato.",
    characteristics: ["Grain-Free", "Avocado Oil", "Dairy-Free", "Vegan Friendly"],
    spiceLevel: 1,
    crunchLevel: 4,
    color: "from-orange-600 to-amber-800",
    accentColor: "border-orange-500 shadow-orange-950/50",
    emoji: "🥑",
  },
  {
    id: "tj-elote-dippers",
    name: "Organic Elote Corn Chip Dippers",
    brand: "Trader Joe's",
    description: "Sturdy, scoop-shaped organic corn chips packed with a sweet, smoky, and spicy street corn seasoning. Dusted with chipotle, habanero, cheese, and a hint of lime.",
    characteristics: ["Organic Corn", "Street Corn Spices", "Scoop Shape", "Smoky & Cheesy"],
    spiceLevel: 3,
    crunchLevel: 5,
    color: "from-yellow-500 to-amber-600",
    accentColor: "border-yellow-400 shadow-yellow-950/50",
    emoji: "🌽",
  },
  {
    id: "tj-chili-lime",
    name: "Rolled Corn Tortilla Chips (Chili & Lime)",
    brand: "Trader Joe's",
    description: "Heavily dusted rolled corn chips offering an intense crunch with a sharp, fiery kick of chili powder and tart lime juice. The ultimate bold snack challenge.",
    characteristics: ["Extremely Crunchy", "Intense Acid", "Takis Style", "Fiery Heat"],
    spiceLevel: 5,
    crunchLevel: 5,
    color: "from-red-600 to-rose-900",
    accentColor: "border-red-500 shadow-red-950/50",
    emoji: "🔥",
  },
  {
    id: "popcorners-kettle-corn",
    name: "Sweet & Salty Kettle Corn Chips",
    brand: "PopCorners",
    description: "Popped, never fried triangular corn chips that strike the perfect balance of sweet cane sugar and savory sea salt. Light, airy, and highly addictive.",
    characteristics: ["Never Fried", "Sweet & Salty", "Airy Texture", "Low Calorie"],
    spiceLevel: 0,
    crunchLevel: 3,
    color: "from-red-500 to-rose-700",
    accentColor: "border-red-400 shadow-red-900/50",
    emoji: "🍿",
  },
  {
    id: "simple-truth-sweet-potato",
    name: "Organic Sweet Potato Corn Tortilla Chips",
    brand: "Simple Truth Organic",
    description: "Crispy tortilla chips crafted from organic sweet potato and yellow corn. Delivers a subtle, natural sweetness that pairs wonderfully with fresh guacamole.",
    characteristics: ["Sweet Potato", "Organic", "Subtly Sweet", "Guacamole Friendly"],
    spiceLevel: 0,
    crunchLevel: 4,
    color: "from-amber-700 to-orange-950",
    accentColor: "border-amber-600 shadow-amber-950/50",
    emoji: "🍠",
  },
  {
    id: "tj-patio-chips",
    name: "Patio Potato Chips (Seasonal Mix)",
    brand: "Trader Joe's",
    description: "A legendary seasonal mix of four distinct potato chip flavors in one single bag: Sea Salt & Vinegar, Delicious Dill, Homestyle Ketchup, and Smokin' Sweet BBQ.",
    characteristics: ["4-in-1 Mix", "Seasonal Release", "Tangy & Herby", "BBQ & Ketchup"],
    spiceLevel: 1,
    crunchLevel: 4,
    color: "from-sky-600 to-blue-800",
    accentColor: "border-sky-500 shadow-sky-950/50",
    emoji: "🏖️",
  },
  {
    id: "tj-dark-russet",
    name: "Dark Russet Kettle-Cooked Chips",
    brand: "Trader Joe's",
    description: "Extra-toasty kettle-cooked potato chips made from dark russet potatoes. They have a deep caramelized, slightly sweet and rich, caramelized potato taste.",
    characteristics: ["Caramelized", "Toasty Flavor", "Dark Russet", "Extra Kettle Crunch"],
    spiceLevel: 0,
    crunchLevel: 5,
    color: "from-stone-600 to-amber-950",
    accentColor: "border-stone-500 shadow-stone-950/50",
    emoji: "🥔",
  },
  {
    id: "tj-carolina-gold",
    name: "Carolina Gold BBQ Ridge Cut Chips",
    brand: "Trader Joe's",
    description: "Ridge-cut chips flavored with mustard-based Carolina Gold BBQ sauce. Sweet, tangy, and smoky, with a distinct mustard tang.",
    characteristics: ["Mustard BBQ", "Ridge Cut", "Tangy & Sweet", "Employee Idea"],
    spiceLevel: 2,
    crunchLevel: 4,
    color: "from-amber-500 to-yellow-700",
    accentColor: "border-amber-400 shadow-amber-950/50",
    anecdote: "An employee at the Boulder, CO Trader Joe's revealed that these chips exist because their store submitted the idea to corporate in January to combine their best-selling Carolina Gold mustard BBQ sauce with a classic ridge-cut chip! Who knew TJ's stores could pitch new foods?",
    emoji: "👑",
  },
  {
    id: "tj-garlic-butter",
    name: "Garlic Butter Irish Potato Chips",
    brand: "Trader Joe's",
    description: "Decadent kettle chips imported directly from Ireland, seasoned with rich, creamy Irish butter and aromatic, savory garlic. Incredibly rich and savory.",
    characteristics: ["Imported from Ireland", "Rich Irish Butter", "Savory Garlic", "Decadent"],
    spiceLevel: 0,
    crunchLevel: 4,
    color: "from-emerald-600 to-teal-900",
    accentColor: "border-emerald-500 shadow-emerald-950/50",
    emoji: "🧄",
  },
];
