export type ToolId =
  // Original Tools
  | 'tree'
  | 'house'
  | 'windmill'
  | 'lighthouse'
  | 'mountain'
  | 'lake'
  | 'flower'
  | 'cloud'
  | 'villager'
  | 'sheep'
  | 'raise'
  | 'lower'
  | 'remove'
  // A. Water & Coastal Life
  | 'sailboat'
  | 'dock'
  | 'duck'
  // B. Cozy Village & Countryside Landmarks
  | 'campfire'
  | 'balloon'
  | 'watchtower'
  | 'beehive'
  | 'lantern'
  // C. Weather & Elemental Powers
  | 'rainbow'
  | 'snowcloud'
  | 'shootingstar';

export type ToolCategory = 'all' | 'village' | 'water' | 'nature' | 'weather' | 'sculpt';

export type CameraViewId = 'orb' | 'surface' | 'orbit' | 'village';

export type TimeMode = 'auto' | 'day' | 'twilight' | 'night';

export type WeatherMode =
  | 'auto'
  | 'snow'
  | 'rain'
  | 'pollen'
  | 'sea_spray'
  | 'mountain_frost'
  | 'embers'
  | 'rainbow'
  | 'stardust'
  | 'dust'
  | 'clear';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherIntensity = 'gentle' | 'moderate' | 'dense';

export interface WorldState {
  planetName: string;
  population: number;
  happiness: number;
  dayCount: number;
  activeTool: ToolId;
  activeView: CameraViewId;
  timeMode: TimeMode;
  /** 0..1 where 0.25 = warm noon/afternoon, 0.52 = blue twilight, 0.78 = deep night */
  timeOfDay: number;
  season: SeasonId;
  weatherMode: WeatherMode;
  weatherCondition: string;
  weatherIntensity: WeatherIntensity;
  audioEnabled: boolean;
  audioVolume: number;
  audioTrackName: string;
  tourActive: boolean;
  tourElapsed: number;
  tourPhase: string;
  objectCounts: {
    houses: number;
    trees: number;
    windmills: number;
    lighthouses: number;
    villagers: number;
    sheep: number;
    clouds: number;
    flowers: number;
    boats: number;
  };
}

export interface ToolDefinition {
  id: ToolId;
  label: string;
  category: Exclude<ToolCategory, 'all'>;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  description: string;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Village & Landmarks
  {
    id: 'house',
    label: 'Houses',
    category: 'village',
    accentBg: 'bg-[#fce4d6]',
    accentBorder: 'border-[#ebb69b]',
    accentText: 'text-[#6e3820]',
    description: 'Build a pastel cottage with roof tiles & glowing windows',
  },
  {
    id: 'windmill',
    label: 'Windmills',
    category: 'village',
    accentBg: 'bg-[#fdf2d0]',
    accentBorder: 'border-[#e5cc87]',
    accentText: 'text-[#665014]',
    description: 'Erect a white windmill with turning canvas sails',
  },
  {
    id: 'lighthouse',
    label: 'Lighthouses',
    category: 'village',
    accentBg: 'bg-[#fadadd]',
    accentBorder: 'border-[#e59fa6]',
    accentText: 'text-[#70232b]',
    description: 'Build a striped coastal lighthouse with sweeping beam',
  },
  {
    id: 'watchtower',
    label: 'Watchtower',
    category: 'village',
    accentBg: 'bg-[#e6e2f5]',
    accentBorder: 'border-[#b8b0d9]',
    accentText: 'text-[#3c345c]',
    description: 'Build a fairytale stone keep with a waving pennant flag',
  },
  {
    id: 'campfire',
    label: 'Campfire',
    category: 'village',
    accentBg: 'bg-[#fde2c8]',
    accentBorder: 'border-[#eba972]',
    accentText: 'text-[#70360f]',
    description: 'Light a crackling stone campfire where villagers gather at night',
  },
  {
    id: 'lantern',
    label: 'Lantern Road',
    category: 'village',
    accentBg: 'bg-[#fef0c9]',
    accentBorder: 'border-[#e5c777]',
    accentText: 'text-[#634b10]',
    description: 'Place a wrought-iron streetlamp & cobblestone path that glows at dusk',
  },
  {
    id: 'balloon',
    label: 'Hot Air Balloon',
    category: 'village',
    accentBg: 'bg-[#f9d9e6]',
    accentBorder: 'border-[#e39db9]',
    accentText: 'text-[#6b2543]',
    description: 'Launch a striped pastel hot air balloon with a glowing burner',
  },

  // Water & Coastal Life
  {
    id: 'sailboat',
    label: 'Sailboats',
    category: 'water',
    accentBg: 'bg-[#d6eff7]',
    accentBorder: 'border-[#8ec9de]',
    accentText: 'text-[#1c5166]',
    description: 'Launch a wooden sailboat with pastel sails & night lantern',
  },
  {
    id: 'dock',
    label: 'Docks & Bridges',
    category: 'water',
    accentBg: 'bg-[#efe4d4]',
    accentBorder: 'border-[#cbb393]',
    accentText: 'text-[#543d22]',
    description: 'Build a timber pier on shores or an arched bridge across channels',
  },
  {
    id: 'duck',
    label: 'Swans & Ducks',
    category: 'water',
    accentBg: 'bg-[#e2f5ef]',
    accentBorder: 'border-[#9ad1c0]',
    accentText: 'text-[#1f5747]',
    description: 'Add paddling white swans & ducks that leave water ripples',
  },

  // Nature & Life
  {
    id: 'tree',
    label: 'Trees',
    category: 'nature',
    accentBg: 'bg-[#dff0d8]',
    accentBorder: 'border-[#a6cfa0]',
    accentText: 'text-[#2c5227]',
    description: 'Plant oaks on hills, pines on peaks, or palms on beaches',
  },
  {
    id: 'flower',
    label: 'Flowers',
    category: 'nature',
    accentBg: 'bg-[#f5dff7]',
    accentBorder: 'border-[#d6a9dc]',
    accentText: 'text-[#5b2a61]',
    description: 'Scatter pastel meadow blossoms',
  },
  {
    id: 'beehive',
    label: 'Beehives',
    category: 'nature',
    accentBg: 'bg-[#fcf0c2]',
    accentBorder: 'border-[#e3c76b]',
    accentText: 'text-[#5e480d]',
    description: 'Place a painted apiary box with fluttering butterflies & bees',
  },
  {
    id: 'villager',
    label: 'Villagers',
    category: 'nature',
    accentBg: 'bg-[#fde8c8]',
    accentBorder: 'border-[#e6be83]',
    accentText: 'text-[#664414]',
    description: 'Welcome a villager who travels between homes, campfires & well',
  },
  {
    id: 'sheep',
    label: 'Sheep',
    category: 'nature',
    accentBg: 'bg-[#f2efe9]',
    accentBorder: 'border-[#ccc5b8]',
    accentText: 'text-[#474137]',
    description: 'Add a fluffy white grazing sheep',
  },

  // Weather & Elemental Powers
  {
    id: 'cloud',
    label: 'Rain Cloud',
    category: 'weather',
    accentBg: 'bg-[#e1ecf7]',
    accentBorder: 'border-[#a4c2e3]',
    accentText: 'text-[#264669]',
    description: 'Summon a puffy rain cloud that waters & grows trees below',
  },
  {
    id: 'snowcloud',
    label: 'Snow Cloud',
    category: 'weather',
    accentBg: 'bg-[#e4f2fc]',
    accentBorder: 'border-[#9ec8e8]',
    accentText: 'text-[#1e4b6e]',
    description: 'Summon a frosty cloud that dusts hills & roofs in white snow',
  },
  {
    id: 'rainbow',
    label: 'Rainbow',
    category: 'weather',
    accentBg: 'bg-[#fce3f0]',
    accentBorder: 'border-[#e3a1c4]',
    accentText: 'text-[#662247]',
    description: 'Arch a translucent pastel rainbow across the sky',
  },
  {
    id: 'shootingstar',
    label: 'Shooting Star',
    category: 'weather',
    accentBg: 'bg-[#e5dff7]',
    accentBorder: 'border-[#b3a3e3]',
    accentText: 'text-[#392769]',
    description: 'Send a sparkling shooting star across the orb sky',
  },

  // Sculpt & Clear
  {
    id: 'mountain',
    label: 'Mountains',
    category: 'sculpt',
    accentBg: 'bg-[#e3e6ee]',
    accentBorder: 'border-[#b2bacf]',
    accentText: 'text-[#363e52]',
    description: 'Raise a snowy faceted peak',
  },
  {
    id: 'lake',
    label: 'Lakes',
    category: 'sculpt',
    accentBg: 'bg-[#d4f1f4]',
    accentBorder: 'border-[#8fd3db]',
    accentText: 'text-[#1c5961]',
    description: 'Carve a shallow-to-deep turquoise basin',
  },
  {
    id: 'raise',
    label: 'Raise Land',
    category: 'sculpt',
    accentBg: 'bg-[#e6eed6]',
    accentBorder: 'border-[#b5c993]',
    accentText: 'text-[#3b4f1d]',
    description: 'Elevate spherical terrain facets',
  },
  {
    id: 'lower',
    label: 'Lower Land',
    category: 'sculpt',
    accentBg: 'bg-[#d8edf2]',
    accentBorder: 'border-[#96c9d6]',
    accentText: 'text-[#20515e]',
    description: 'Lower terrain facets to admit turquoise water',
  },
  {
    id: 'remove',
    label: 'Remove',
    category: 'sculpt',
    accentBg: 'bg-[#f7dede]',
    accentBorder: 'border-[#dfa4a4]',
    accentText: 'text-[#692626]',
    description: 'Clear an object from the planet surface',
  },
];

export interface SeasonWeatherOption {
  id: WeatherMode;
  label: string;
  sublabel: string;
  iconName: string;
}

export interface SeasonInfo {
  id: SeasonId;
  name: string;
  emoji: string;
  badge: string;
  tagline: string;
  description: string;
  themeColor: string;
  bgLight: string;
  borderLight: string;
  textDark: string;
  accentBg: string;
  allowedWeatherModes: SeasonWeatherOption[];
  defaultWeather: WeatherMode;
}

export const SEASONS: SeasonInfo[] = [
  {
    id: 'spring',
    name: 'Spring',
    emoji: '🌸',
    badge: 'Blossom Bloom',
    tagline: 'Cherry blossoms, tender green shoots, and gentle floral breezes.',
    description: 'Fresh clover meadows and thawing peaks, adorned with blossom petals and morning birdsong.',
    themeColor: '#10b981',
    bgLight: 'bg-[#d1fae5]',
    borderLight: 'border-[#86efac]',
    textDark: 'text-[#065f46]',
    accentBg: 'bg-[#ecfdf5]',
    defaultWeather: 'pollen',
    allowedWeatherModes: [
      { id: 'auto', label: 'Seasonal Auto', sublabel: 'Adaptive Blossom Motes', iconName: 'Compass' },
      { id: 'pollen', label: 'Blossom Petals', sublabel: 'Sakura Petals & Pollen', iconName: 'Flower2' },
      { id: 'rain', label: 'Spring Showers', sublabel: 'Nourishing Rain Showers', iconName: 'Cloud' },
      { id: 'rainbow', label: 'Spring Rainbow', sublabel: 'Prismatic Arch & Chimes', iconName: 'Rainbow' },
      { id: 'sea_spray', label: 'Coastal Breeze', sublabel: 'Ocean Mist & Foam', iconName: 'Waves' },
      { id: 'clear', label: 'Clear Sky', sublabel: 'Gentle Warm Sunlight', iconName: 'Sun' },
    ],
  },
  {
    id: 'summer',
    name: 'Summer',
    emoji: '☀️',
    badge: 'Sunlit Solstice',
    tagline: 'Lush emerald forests, glowing fireflies, and sun-warmed turquoise bays.',
    description: 'Golden beaches and sunlit meadows alive with butterflies, sailboats, and stardust nights.',
    themeColor: '#f59e0b',
    bgLight: 'bg-[#fef3c7]',
    borderLight: 'border-[#fde68a]',
    textDark: 'text-[#78350f]',
    accentBg: 'bg-[#fffbeb]',
    defaultWeather: 'stardust',
    allowedWeatherModes: [
      { id: 'auto', label: 'Seasonal Auto', sublabel: 'Adaptive Summer Glow', iconName: 'Compass' },
      { id: 'stardust', label: 'Fireflies & Stars', sublabel: 'Meadow Firefly Swarm', iconName: 'Sparkles' },
      { id: 'sea_spray', label: 'Ocean Surf', sublabel: 'Breezy Tropical Spray', iconName: 'Waves' },
      { id: 'rain', label: 'Summer Rain', sublabel: 'Warm Afternoon Shower', iconName: 'Cloud' },
      { id: 'rainbow', label: 'Warm Rainbow', sublabel: 'Brilliant Sunlit Arc', iconName: 'Rainbow' },
      { id: 'embers', label: 'Campfire Glow', sublabel: 'Bonfire Embers & Hearth', iconName: 'Flame' },
      { id: 'clear', label: 'Clear Sky', sublabel: 'Sun-Drenched Horizon', iconName: 'Sun' },
    ],
  },
  {
    id: 'autumn',
    name: 'Autumn',
    emoji: '🍂',
    badge: 'Golden Harvest',
    tagline: 'Vibrant fiery foliage, swirling amber leaves, and cozy hearths.',
    description: 'Meadows of golden amber and burnt sienna with dancing autumn leaves and crackling campfires.',
    themeColor: '#ea580c',
    bgLight: 'bg-[#ffedd5]',
    borderLight: 'border-[#fed7aa]',
    textDark: 'text-[#7c2d12]',
    accentBg: 'bg-[#fff7ed]',
    defaultWeather: 'pollen',
    allowedWeatherModes: [
      { id: 'auto', label: 'Seasonal Auto', sublabel: 'Adaptive Leaf Swirl', iconName: 'Compass' },
      { id: 'pollen', label: 'Autumn Leaves', sublabel: 'Swirling Maple & Oak Leaves', iconName: 'Wind' },
      { id: 'embers', label: 'Hearth Embers', sublabel: 'Crackling Campfire Embers', iconName: 'Flame' },
      { id: 'rain', label: 'Autumn Drizzle', sublabel: 'Crisp Mist & Cold Drizzle', iconName: 'Cloud' },
      { id: 'mountain_frost', label: 'Morning Frost', sublabel: 'Early Alpine Frost Spindrift', iconName: 'Mountain' },
      { id: 'stardust', label: 'Harvest Stars', sublabel: 'Starry Autumn Constellations', iconName: 'Sparkles' },
      { id: 'clear', label: 'Clear Sky', sublabel: 'Crisp Harvest Air', iconName: 'Sun' },
    ],
  },
  {
    id: 'winter',
    name: 'Winter',
    emoji: '❄️',
    badge: 'Frost & Snow',
    tagline: 'Snow-capped mountain ranges, frosted evergreens, and swirling blizzards.',
    description: 'Gleaming white snow blankets the peaks and valleys with crystalline frost and cozy chimneys.',
    themeColor: '#38bdf8',
    bgLight: 'bg-[#e0f2fe]',
    borderLight: 'border-[#bae6fd]',
    textDark: 'text-[#075985]',
    accentBg: 'bg-[#f0f9ff]',
    defaultWeather: 'snow',
    allowedWeatherModes: [
      { id: 'auto', label: 'Seasonal Auto', sublabel: 'Adaptive Snow & Frost', iconName: 'Compass' },
      { id: 'snow', label: 'Snow Flurries', sublabel: 'Soft Falling Crystalline Snow', iconName: 'CloudSnow' },
      { id: 'mountain_frost', label: 'Alpine Blizzard', sublabel: 'Mountain Wind & Spindrift', iconName: 'Mountain' },
      { id: 'stardust', label: 'Aurora Crystals', sublabel: 'Glittering Diamond Ice Dust', iconName: 'Sparkles' },
      { id: 'rain', label: 'Freezing Sleet', sublabel: 'Icy Sleet & Frozen Mist', iconName: 'Cloud' },
      { id: 'clear', label: 'Crisp Winter Air', sublabel: 'Still Frozen Terrarium Sky', iconName: 'Sun' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Journal & Chronicle Types
// ---------------------------------------------------------------------------
export type JournalCategory =
  | 'milestone'
  | 'biome'
  | 'weather'
  | 'village'
  | 'record'
  | 'note';

export interface JournalEntry {
  id: string;
  category: JournalCategory;
  title: string;
  description: string;
  badge: string;
  iconName: string;
  accentColor: string;
  dayCount: number;
  timeOfDayLabel: string;
  season: SeasonId;
  realTimestamp: string;
  createdAt: number;
  numericRecord?: {
    type: 'population' | 'happiness' | 'days' | 'trees' | 'houses';
    value: number;
    prevValue?: number;
  };
  isCustomNote?: boolean;
}

export interface JournalStats {
  peakPopulation: number;
  peakHappiness: number;
  totalDays: number;
  biomesDiscovered: string[];
  firstSnowRecorded: boolean;
  firstRainbowRecorded: boolean;
  firstNightfallRecorded: boolean;
  firstSnapshotRecorded: boolean;
  firstCelestialTransitionRecorded: boolean;
}

