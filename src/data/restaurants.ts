export interface MenuItem {
  id: string
  name: string
  description: string
  price: number // NGN
  category: string
  image: string
  ingredients: string[]
  allergens: string[]
  spicy?: boolean
  deal?: { percent: number; label: string }
}

export interface Restaurant {
  id: string
  /** links to the landing-page Menu listing id */
  listingId: string
  name: string
  handle: string
  monogram: string
  accent: string // primary brand color
  accentSoft: string // soft tint background
  gradient: string // css gradient for branding moments
  tagline: string
  location: string
  rating: number
  reviews: number
  cover: string
  logoBg: string // logo monogram background
  categories: string[]
  items: MenuItem[]
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'canton-cuisine',
    listingId: 'm1',
    name: 'Canton Cuisine',
    handle: '@cantoncuisine',
    monogram: 'CC',
    accent: '#c2410c',
    accentSoft: '#fff3ec',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
    tagline: 'Gather, eat, enjoy — African-inspired meals for friends & family.',
    location: '1132, Lekki, Lagos',
    rating: 4.8,
    reviews: 2134,
    cover: '/images/place-euphoria.jpg',
    logoBg: 'linear-gradient(135deg, #ea580c, #b91c1c)',
    categories: ['All', 'Mains', 'Grills', 'Sides', 'Drinks'],
    items: [
      {
        id: 'cc-1',
        name: 'Signature Jollof & Grilled Chicken',
        description: 'Smoky party jollof cooked over open fire, served with flame-grilled chicken and fried plantain.',
        price: 18999,
        category: 'Mains',
        image: '/images/menu-jollof.jpg',
        ingredients: ['Long-grain rice', 'Tomato & pepper base', 'Grilled chicken', 'Plantain', 'Palm oil', 'Smoked spices'],
        allergens: [],
        spicy: true,
        deal: { percent: 20, label: 'Black Friday Eats' },
      },
      {
        id: 'cc-2',
        name: 'Native Fried Rice & Peppered Fish',
        description: 'Golden village-style fried rice with vegetables, topped with peppered grilled croaker fish.',
        price: 16500,
        category: 'Mains',
        image: '/images/dish-fried-rice.jpg',
        ingredients: ['Rice', 'Croaker fish', 'Mixed vegetables', 'Scotch bonnet', 'Native spice blend'],
        allergens: ['Fish'],
        spicy: true,
      },
      {
        id: 'cc-3',
        name: 'Egusi & Pounded Yam',
        description: 'Rich melon-seed soup with spinach and assorted meat, paired with silky pounded yam.',
        price: 14500,
        category: 'Mains',
        image: '/images/dish-egusi.jpg',
        ingredients: ['Egusi (melon seeds)', 'Spinach', 'Assorted meat', 'Stockfish', 'Palm oil', 'Yam'],
        allergens: ['Fish', 'Shellfish'],
      },
      {
        id: 'cc-4',
        name: 'Dodo Bites & Pepper Dip',
        description: 'Caramelised fried plantain bites with a fiery house pepper dip.',
        price: 6500,
        category: 'Sides',
        image: '/images/dish-plantain.jpg',
        ingredients: ['Ripe plantain', 'Chili flakes', 'Sea salt', 'Pepper dip'],
        allergens: [],
        spicy: true,
      },
      {
        id: 'cc-5',
        name: 'Classic Chapman',
        description: 'The beloved Nigerian mocktail — grenadine, citrus and cucumber over crushed ice.',
        price: 4500,
        category: 'Drinks',
        image: '/images/dish-chapman.jpg',
        ingredients: ['Grenadine', 'Orange & lemon', 'Cucumber', 'Bitters', 'Soda'],
        allergens: [],
        deal: { percent: 15, label: 'Happy Hour' },
      },
    ],
  },
  {
    id: 'suya-central',
    listingId: 'm2',
    name: 'Suya Central',
    handle: '@suyacentral',
    monogram: 'SC',
    accent: '#b45309',
    accentSoft: '#fdf6ec',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    tagline: 'Open-coal grills, house-ground yaji, evenings done right.',
    location: 'Magodo, Lagos',
    rating: 4.9,
    reviews: 1540,
    cover: '/images/menu-suya.jpg',
    logoBg: 'linear-gradient(135deg, #f59e0b, #92400e)',
    categories: ['All', 'Grills', 'Sides', 'Drinks'],
    items: [
      {
        id: 'sc-1',
        name: 'Beef Suya Platter',
        description: 'Charred beef skewers in house-ground yaji spice, onions and fresh cucumber.',
        price: 9500,
        category: 'Grills',
        image: '/images/menu-suya.jpg',
        ingredients: ['Beef', 'Yaji (peanut spice)', 'Onions', 'Cucumber', 'Tomatoes'],
        allergens: ['Peanuts'],
        spicy: true,
        deal: { percent: 20, label: 'Suya Nights' },
      },
      {
        id: 'sc-2',
        name: 'Asun — Spicy Goat Meat',
        description: 'Smoky grilled goat meat tossed with scotch bonnet and bell peppers, cast-iron hot.',
        price: 12000,
        category: 'Grills',
        image: '/images/dish-asun.jpg',
        ingredients: ['Goat meat', 'Scotch bonnet', 'Bell peppers', 'Onions', 'Smoked paprika'],
        allergens: [],
        spicy: true,
      },
      {
        id: 'sc-3',
        name: 'Chicken Suya',
        description: 'Tender chicken skewers rubbed in yaji, finished over open coals.',
        price: 8000,
        category: 'Grills',
        image: '/images/dish-fried-rice.jpg',
        ingredients: ['Chicken', 'Yaji (peanut spice)', 'Onions', 'Garden egg'],
        allergens: ['Peanuts'],
        spicy: true,
      },
      {
        id: 'sc-4',
        name: 'Chilled Zobo',
        description: 'House-brewed hibiscus drink with pineapple and a hint of ginger.',
        price: 3000,
        category: 'Drinks',
        image: '/images/dish-zobo.jpg',
        ingredients: ['Hibiscus leaves', 'Pineapple', 'Ginger', 'Cloves'],
        allergens: [],
      },
    ],
  },
  {
    id: 'patio-cafe',
    listingId: 'm3',
    name: 'The Patio Café',
    handle: '@thepatiocafe',
    monogram: 'PC',
    accent: '#0d9488',
    accentSoft: '#effaf8',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    tagline: 'Slow brunches and specialty coffee under the courtyard sun.',
    location: 'Lekki Phase 1, Lagos',
    rating: 4.6,
    reviews: 918,
    cover: '/images/place-patio.jpg',
    logoBg: 'linear-gradient(135deg, #2dd4bf, #0f766e)',
    categories: ['All', 'Brunch', 'Coffee', 'Bowls'],
    items: [
      {
        id: 'pc-1',
        name: 'Latte Art Duo',
        description: 'Double-shot signature latte with our courtyard blend, poured to order.',
        price: 7200,
        category: 'Coffee',
        image: '/images/menu-latte.jpg',
        ingredients: ['Espresso', 'Steamed milk', 'House beans'],
        allergens: ['Dairy'],
      },
      {
        id: 'pc-2',
        name: 'Berry Stack Pancakes',
        description: 'Fluffy buttermilk stack with macerated berries, maple syrup and powdered sugar.',
        price: 9800,
        category: 'Brunch',
        image: '/images/dish-pancakes.jpg',
        ingredients: ['Buttermilk', 'Flour', 'Eggs', 'Berries', 'Maple syrup', 'Butter'],
        allergens: ['Gluten', 'Dairy', 'Egg'],
        deal: { percent: 10, label: 'Weekend Brunch' },
      },
      {
        id: 'pc-3',
        name: 'Avocado & Poached Egg Toast',
        description: 'Sourdough, smashed avocado, poached egg, chili flakes and microgreens.',
        price: 8500,
        category: 'Brunch',
        image: '/images/dish-avocado.jpg',
        ingredients: ['Sourdough', 'Avocado', 'Egg', 'Chili flakes', 'Microgreens', 'Olive oil'],
        allergens: ['Gluten', 'Egg'],
      },
      {
        id: 'pc-4',
        name: 'Açaí Smoothie Bowl',
        description: 'Açaí blend topped with granola, banana, strawberries and coconut flakes.',
        price: 9000,
        category: 'Bowls',
        image: '/images/dish-smoothie.jpg',
        ingredients: ['Açaí', 'Banana', 'Strawberries', 'Granola', 'Coconut', 'Honey'],
        allergens: ['Nuts', 'Gluten'],
      },
    ],
  },
  {
    id: 'neon-bar',
    listingId: 'm4',
    name: 'Neon Bar & Kitchen',
    handle: '@neonbar',
    monogram: 'NB',
    accent: '#a21caf',
    accentSoft: '#fdf0fe',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #7c3aed 100%)',
    tagline: 'Neon-lit cocktails and late-night plates till 2 AM.',
    location: 'Victoria Island, Lagos',
    rating: 4.7,
    reviews: 640,
    cover: '/images/event-nightbar.jpg',
    logoBg: 'linear-gradient(135deg, #d946ef, #7c3aed)',
    categories: ['All', 'Cocktails', 'Small Chops'],
    items: [
      {
        id: 'nb-1',
        name: 'Neon Signature Coupe',
        description: 'Butterfly-pea flower cocktail that shifts violet under the lights, edible blossom on top.',
        price: 12000,
        category: 'Cocktails',
        image: '/images/dish-neon-cocktail.jpg',
        ingredients: ['Gin', 'Butterfly pea flower', 'Citrus', 'Edible blossom'],
        allergens: [],
        deal: { percent: 25, label: 'Neon Nights' },
      },
      {
        id: 'nb-2',
        name: 'Classic Mojito',
        description: 'Crushed ice, fresh mint, lime and white rum — the night’s reset button.',
        price: 9500,
        category: 'Cocktails',
        image: '/images/dish-mojito.jpg',
        ingredients: ['White rum', 'Mint', 'Lime', 'Soda', 'Cane sugar'],
        allergens: [],
      },
      {
        id: 'nb-3',
        name: 'Small Chops Platter',
        description: 'Puff puff, spring rolls, samosas and peppered chicken with two house dips.',
        price: 11000,
        category: 'Small Chops',
        image: '/images/dish-smallchops.jpg',
        ingredients: ['Puff puff', 'Spring rolls', 'Samosas', 'Peppered chicken', 'House dips'],
        allergens: ['Gluten', 'Egg'],
        spicy: true,
      },
    ],
  },
]

export const formatNaira = (n: number) => '₦' + n.toLocaleString('en-NG')

export const discounted = (item: MenuItem) =>
  item.deal ? Math.round(item.price * (1 - item.deal.percent / 100) / 50) * 50 : item.price
