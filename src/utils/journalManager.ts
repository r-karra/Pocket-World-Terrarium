import {
  JournalEntry,
  JournalExportData,
  JournalStats,
  SeasonId,
} from '../types/world';

const STORAGE_KEY_PREFIX = 'pocket_world_journal_';

function sanitizeKey(name: string): string {
  return (name || 'little_meadow').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export function formatTimeOfDayLabel(timeOfDay: number): string {
  const t = ((timeOfDay % 1) + 1) % 1;
  if (t < 0.35) return 'Morning';
  if (t < 0.50) return 'Afternoon';
  if (t < 0.70) return 'Twilight';
  return 'Midnight';
}

export function formatRealTime(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

export function formatFullDate(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Today';
  }
}

function getDefaultStats(): JournalStats {
  return {
    peakPopulation: 12,
    peakHappiness: 96,
    totalDays: 1,
    biomesDiscovered: ['meadow', 'forest'],
    firstSnowRecorded: false,
    firstRainbowRecorded: false,
    firstNightfallRecorded: false,
    firstSnapshotRecorded: false,
    firstCelestialTransitionRecorded: false,
  };
}

export function deriveTagsForEntry(entry: Partial<JournalEntry>): string[] {
  const tags = new Set<string>();

  if (
    entry.category === 'milestone' ||
    entry.badge?.toLowerCase().includes('milestone') ||
    entry.badge?.toLowerCase().includes('genesis') ||
    entry.badge?.toLowerCase().includes('first snow') ||
    entry.badge?.toLowerCase().includes('record') ||
    entry.numericRecord?.type === 'population' ||
    entry.numericRecord?.type === 'days'
  ) {
    tags.add('Milestone');
  }

  if (
    entry.category === 'biome' ||
    entry.badge?.toLowerCase().includes('biome') ||
    entry.badge?.toLowerCase().includes('unlocked') ||
    entry.badge?.toLowerCase().includes('wonder') ||
    entry.title?.toLowerCase().includes('discovered') ||
    entry.title?.toLowerCase().includes('founding') ||
    entry.id?.includes('biome-')
  ) {
    tags.add('Discovery');
  }

  if (entry.category === 'record' || entry.numericRecord) {
    tags.add('Record');
  }

  if (entry.category === 'note' || entry.isCustomNote) {
    tags.add('Observation');
  }

  tags.add('Event');
  return Array.from(tags);
}

function getDefaultEntries(planetName: string): JournalEntry[] {
  const now = Date.now();
  return [
    {
      id: 'genesis-seed',
      category: 'milestone',
      title: `Genesis of ${planetName}`,
      description:
        'A miniature world was brought to life inside the glass terrarium, resting quietly upon its hand-turned walnut windowsill stand.',
      badge: 'Genesis',
      tags: ['Milestone', 'Event'],
      iconName: 'Sparkles',
      accentColor: '#fbbf24',
      dayCount: 1,
      timeOfDayLabel: 'Morning',
      season: 'spring',
      realTimestamp: formatRealTime(now - 120000),
      createdAt: now - 120000,
    },
    {
      id: 'hamlet-seed',
      category: 'village',
      title: 'Founding of the Meadow Hamlet',
      description:
        'The first pastel cottages were raised with terracotta shingles and soft window sills, welcoming twelve settlers to the planet.',
      badge: 'Hamlet',
      tags: ['Milestone', 'Discovery', 'Record', 'Event'],
      iconName: 'Home',
      accentColor: '#34d399',
      dayCount: 1,
      timeOfDayLabel: 'Morning',
      season: 'spring',
      realTimestamp: formatRealTime(now - 80000),
      createdAt: now - 80000,
      numericRecord: {
        type: 'population',
        value: 12,
      },
    },
    {
      id: 'forest-seed',
      category: 'biome',
      title: 'Whispering Canopy Rooted',
      description:
        'Ancient oaks, flowering elderberry, and fragrant coastal pines established a thriving verdant canopy across the northern hills.',
      badge: 'Biome Unlocked',
      tags: ['Discovery', 'Milestone', 'Event'],
      iconName: 'Trees',
      accentColor: '#10b981',
      dayCount: 1,
      timeOfDayLabel: 'Afternoon',
      season: 'spring',
      realTimestamp: formatRealTime(now - 40000),
      createdAt: now - 40000,
    },
  ];
}

export function loadJournalData(planetName: string): {
  entries: JournalEntry[];
  stats: JournalStats;
} {
  const key = `${STORAGE_KEY_PREFIX}${sanitizeKey(planetName)}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.entries) && parsed.stats) {
        const normalizedEntries: JournalEntry[] = parsed.entries.map(
          (e: JournalEntry) => ({
            ...e,
            tags:
              Array.isArray(e.tags) && e.tags.length > 0
                ? e.tags
                : deriveTagsForEntry(e),
          }),
        );
        return {
          entries: normalizedEntries,
          stats: { ...getDefaultStats(), ...parsed.stats },
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse saved journal data:', err);
  }

  // Fallback initial seeded data
  const entries = getDefaultEntries(planetName);
  const stats = getDefaultStats();
  saveJournalData(planetName, entries, stats);
  return { entries, stats };
}

export function saveJournalData(
  planetName: string,
  entries: JournalEntry[],
  stats: JournalStats,
): void {
  const key = `${STORAGE_KEY_PREFIX}${sanitizeKey(planetName)}`;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        entries,
        stats,
        savedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.warn('Failed to save journal data:', err);
  }
}

export interface MilestoneContext {
  planetName: string;
  dayCount: number;
  timeOfDay: number;
  season: SeasonId;
  population: number;
  happiness: number;
  activeWeather?: string;
  actionType?:
    | 'placed_tool'
    | 'weather_change'
    | 'season_change'
    | 'time_mode_change'
    | 'snapshot_taken'
    | 'stat_sync';
  toolId?: string;
}

export function evaluateMilestone(
  ctx: MilestoneContext,
  currentEntries: JournalEntry[],
  currentStats: JournalStats,
): { newEntry: JournalEntry; updatedStats: JournalStats } | null {
  const result = evaluateMilestoneInternal(ctx, currentEntries, currentStats);
  if (result && result.newEntry) {
    if (!result.newEntry.tags || result.newEntry.tags.length === 0) {
      result.newEntry.tags = deriveTagsForEntry(result.newEntry);
    }
  }
  return result;
}

function evaluateMilestoneInternal(
  ctx: MilestoneContext,
  currentEntries: JournalEntry[],
  currentStats: JournalStats,
): { newEntry: JournalEntry; updatedStats: JournalStats } | null {
  const updatedStats = { ...currentStats };
  const now = Date.now();
  const timeLabel = formatTimeOfDayLabel(ctx.timeOfDay);
  const timeStr = formatRealTime(now);

  // 1. Highest Population Achieved (Record)
  if (ctx.population > updatedStats.peakPopulation) {
    const prev = updatedStats.peakPopulation;
    updatedStats.peakPopulation = ctx.population;

    const entry: JournalEntry = {
      id: `record-pop-${ctx.population}-${now}`,
      category: 'record',
      title: `New Population Peak: ${ctx.population} Inhabitants`,
      description: `Wanderers arrived across the meadow trails, elevating ${ctx.planetName}'s population to an all-time record of ${ctx.population} thriving souls!`,
      badge: 'New Record',
      iconName: 'Trophy',
      accentColor: '#f59e0b',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
      numericRecord: {
        type: 'population',
        value: ctx.population,
        prevValue: prev,
      },
    };
    return { newEntry: entry, updatedStats };
  }

  // 2. First Snowfall (First Snow milestone)
  const isSnowEvent =
    ctx.toolId === 'snowcloud' ||
    ctx.activeWeather === 'snow' ||
    (ctx.actionType === 'season_change' && ctx.season === 'winter');

  if (isSnowEvent && !updatedStats.firstSnowRecorded) {
    updatedStats.firstSnowRecorded = true;
    const entry: JournalEntry = {
      id: `milestone-first-snow-${now}`,
      category: 'weather',
      title: 'First Snowfall in the Terrarium',
      description:
        'Soft crystalline flakes began falling quietly from the upper atmosphere, blanketing the alpine ridges and cottage rooftops in pure winter frost.',
      badge: 'First Snow',
      iconName: 'CloudSnow',
      accentColor: '#38bdf8',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
    };
    return { newEntry: entry, updatedStats };
  }

  // 3. First Snapshot Taken
  if (ctx.actionType === 'snapshot_taken' && !updatedStats.firstSnapshotRecorded) {
    updatedStats.firstSnapshotRecorded = true;
    const entry: JournalEntry = {
      id: `milestone-first-snapshot-${now}`,
      category: 'milestone',
      title: 'First High-Res Keepsake Captured',
      description:
        'A brass mechanical shutter click preserved a pristine portrait of the miniature terrarium for the historical archives.',
      badge: 'Keepsake',
      iconName: 'Camera',
      accentColor: '#c084fc',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
    };
    return { newEntry: entry, updatedStats };
  }

  // 4. First Celestial Sun-to-Moon Transition
  if (
    ctx.actionType === 'time_mode_change' &&
    !updatedStats.firstCelestialTransitionRecorded
  ) {
    updatedStats.firstCelestialTransitionRecorded = true;
    const entry: JournalEntry = {
      id: `milestone-first-celestial-${now}`,
      category: 'weather',
      title: 'First Celestial Arc Witnessed',
      description:
        'The sun traversed along its tilted orbital track, setting against a golden-hour horizon as the pearlescent moon ascended into the night skybox.',
      badge: 'Celestial',
      iconName: 'Sun',
      accentColor: '#fb923c',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
    };
    return { newEntry: entry, updatedStats };
  }

  // 5. First Rainbow
  if (
    (ctx.toolId === 'rainbow' || ctx.activeWeather === 'rainbow') &&
    !updatedStats.firstRainbowRecorded
  ) {
    updatedStats.firstRainbowRecorded = true;
    const entry: JournalEntry = {
      id: `milestone-first-rainbow-${now}`,
      category: 'weather',
      title: 'First Rainbow Arch Summoned',
      description:
        'A spectrum of radiant crystalline light arched gracefully between the drifting clouds, bathing the countryside in wonder.',
      badge: 'Wonder',
      iconName: 'Rainbow',
      accentColor: '#ec4899',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
    };
    return { newEntry: entry, updatedStats };
  }

  // 6. Biome Unlocks
  if (ctx.toolId) {
    // Maritime Archipelago Biome
    if (
      (ctx.toolId === 'sailboat' || ctx.toolId === 'dock') &&
      !updatedStats.biomesDiscovered.includes('archipelago')
    ) {
      updatedStats.biomesDiscovered.push('archipelago');
      const entry: JournalEntry = {
        id: `biome-archipelago-${now}`,
        category: 'biome',
        title: 'Maritime Coastal Archipelago Discovered',
        description:
          'Timber piers and billowing canvas sailboats opened navigation across the turquoise tidal lagoon, establishing trade and coastal seafaring.',
        badge: 'Biome Unlocked',
        iconName: 'Waves',
        accentColor: '#0ea5e9',
        dayCount: ctx.dayCount,
        timeOfDayLabel: timeLabel,
        season: ctx.season,
        realTimestamp: timeStr,
        createdAt: now,
      };
      return { newEntry: entry, updatedStats };
    }

    // Alpine Highlands Biome
    if (
      (ctx.toolId === 'mountain' || ctx.toolId === 'raise') &&
      !updatedStats.biomesDiscovered.includes('highlands')
    ) {
      updatedStats.biomesDiscovered.push('highlands');
      const entry: JournalEntry = {
        id: `biome-highlands-${now}`,
        category: 'biome',
        title: 'Alpine Highlands & Peaks Formed',
        description:
          'Steep granite escarpments were thrust toward the sky, giving birth to highland crags where mountain winds gather and morning frost clings.',
        badge: 'Biome Unlocked',
        iconName: 'Mountain',
        accentColor: '#6366f1',
        dayCount: ctx.dayCount,
        timeOfDayLabel: timeLabel,
        season: ctx.season,
        realTimestamp: timeStr,
        createdAt: now,
      };
      return { newEntry: entry, updatedStats };
    }

    // Sky Sanctuary Biome
    if (
      ctx.toolId === 'balloon' &&
      !updatedStats.biomesDiscovered.includes('sky_sanctuary')
    ) {
      updatedStats.biomesDiscovered.push('sky_sanctuary');
      const entry: JournalEntry = {
        id: `biome-sky-${now}`,
        category: 'biome',
        title: 'Sky Realm & Aerial Heights Reached',
        description:
          'A colorful hot air balloon ascended into the upper atmosphere, floating gently beneath the glass dome to chart the thermal air currents.',
        badge: 'Biome Unlocked',
        iconName: 'Wind',
        accentColor: '#eab308',
        dayCount: ctx.dayCount,
        timeOfDayLabel: timeLabel,
        season: ctx.season,
        realTimestamp: timeStr,
        createdAt: now,
      };
      return { newEntry: entry, updatedStats };
    }

    // Cozy Hearth Biome / Nocturnal Beacon
    if (
      (ctx.toolId === 'campfire' || ctx.toolId === 'lantern') &&
      !updatedStats.biomesDiscovered.includes('hearth')
    ) {
      updatedStats.biomesDiscovered.push('hearth');
      const entry: JournalEntry = {
        id: `biome-hearth-${now}`,
        category: 'village',
        title: 'First Hearth & Village Bonfire Kindled',
        description:
          'Crackling birch embers lit up the twilight dusk, creating a warm gathering point for storytelling and fireside camaraderie.',
        badge: 'Cozy Haven',
        iconName: 'Flame',
        accentColor: '#f97316',
        dayCount: ctx.dayCount,
        timeOfDayLabel: timeLabel,
        season: ctx.season,
        realTimestamp: timeStr,
        createdAt: now,
      };
      return { newEntry: entry, updatedStats };
    }
  }

  // 7. Days Passed Milestones (Day 2, Day 5, Day 10)
  if (
    ctx.dayCount > updatedStats.totalDays &&
    (ctx.dayCount === 2 || ctx.dayCount === 5 || ctx.dayCount === 10)
  ) {
    updatedStats.totalDays = ctx.dayCount;
    const entry: JournalEntry = {
      id: `milestone-day-${ctx.dayCount}-${now}`,
      category: 'milestone',
      title: `Planetary Longevity: Day ${ctx.dayCount}`,
      description: `The tiny planet has flourished through ${ctx.dayCount} full day-and-night cycles inside its glass sanctuary.`,
      badge: 'Milestone',
      iconName: 'Calendar',
      accentColor: '#10b981',
      dayCount: ctx.dayCount,
      timeOfDayLabel: timeLabel,
      season: ctx.season,
      realTimestamp: timeStr,
      createdAt: now,
      numericRecord: {
        type: 'days',
        value: ctx.dayCount,
      },
    };
    return { newEntry: entry, updatedStats };
  }

  return null;
}

export function createCustomFieldNote(
  planetName: string,
  title: string,
  text: string,
  ctx: {
    dayCount: number;
    timeOfDay: number;
    season: SeasonId;
  },
): JournalEntry {
  const now = Date.now();
  return {
    id: `note-${now}-${Math.random().toString(36).slice(2, 6)}`,
    category: 'note',
    title: title.trim() || 'Naturalist Field Observation',
    description: text.trim(),
    badge: 'Field Note',
    tags: ['Observation', 'Event'],
    iconName: 'BookOpen',
    accentColor: '#d97706',
    dayCount: ctx.dayCount,
    timeOfDayLabel: formatTimeOfDayLabel(ctx.timeOfDay),
    season: ctx.season,
    realTimestamp: formatRealTime(now),
    createdAt: now,
    isCustomNote: true,
  };
}

export function exportChronicleMarkdown(
  planetName: string,
  entries: JournalEntry[],
  stats: JournalStats,
): string {
  const lines: string[] = [];
  lines.push(`# 📖 Historical Chronicle of ${planetName}`);
  lines.push(`*Recorded from the Miniature Terrarium on the Walnut Windowsill*`);
  lines.push(`*Generated on ${new Date().toLocaleString()}*\n`);

  lines.push(`## 🏛️ Planetary Vital Records`);
  lines.push(`- **All-Time Peak Population**: ${stats.peakPopulation} Citizens`);
  lines.push(`- **Highest Happiness**: ${stats.peakHappiness}% Blissful Haven`);
  lines.push(`- **Total Solar Days Recorded**: Day ${stats.totalDays}`);
  lines.push(
    `- **Biomes Cataloged**: ${stats.biomesDiscovered.map((b) => b.toUpperCase()).join(', ')}`,
  );
  lines.push(
    `- **First Snow Status**: ${stats.firstSnowRecorded ? '✅ Sighted & Chronicled' : '⏳ Awaiting Winter Frost'}`,
  );
  lines.push('');

  lines.push(`## 📜 Timeline of Significant Events`);
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  sorted.forEach((e, idx) => {
    lines.push(`### ${idx + 1}. [${e.badge.toUpperCase()}] ${e.title}`);
    lines.push(`> *Day ${e.dayCount} • ${e.season.toUpperCase()} • ${e.timeOfDayLabel} (${e.realTimestamp})*`);
    lines.push(`${e.description}\n`);
  });

  return lines.join('\n');
}

/**
 * Generates and downloads a formatted JSON backup of the complete journal and chronicle data.
 */
export function exportJournalJSON(
  planetName: string,
  entries: JournalEntry[],
  stats: JournalStats,
): void {
  const exportPayload: JournalExportData = {
    version: 1,
    app: 'Pocket World Terrarium',
    exportedAt: new Date().toISOString(),
    planetName: planetName || 'Little Meadow',
    entries,
    stats,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = sanitizeKey(planetName);
  const dateStr = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `${safeName}_journal_${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Validates and parses imported JSON string, safely normalizing journal entries and stats.
 */
export function parseAndValidateJournalJSON(
  rawJson: string,
): { success: true; data: JournalExportData } | { success: false; error: string } {
  try {
    if (!rawJson || typeof rawJson !== 'string') {
      return { success: false, error: 'Empty or invalid file content.' };
    }

    const parsed = JSON.parse(rawJson);

    let rawEntries: unknown[] = [];
    let rawStats: Partial<JournalStats> = {};
    let planetName = 'Imported Planet';

    if (Array.isArray(parsed)) {
      rawEntries = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.entries)) {
        rawEntries = parsed.entries;
      } else {
        return { success: false, error: 'JSON does not contain a valid "entries" list.' };
      }
      if (parsed.stats && typeof parsed.stats === 'object') {
        rawStats = parsed.stats;
      }
      if (typeof parsed.planetName === 'string' && parsed.planetName.trim()) {
        planetName = parsed.planetName.trim();
      }
    } else {
      return { success: false, error: 'Unrecognized JSON format.' };
    }

    if (rawEntries.length === 0) {
      return { success: false, error: 'The imported file contains no journal entries.' };
    }

    const sanitizedEntries: JournalEntry[] = [];
    for (let i = 0; i < rawEntries.length; i++) {
      const item = rawEntries[i];
      if (!item || typeof item !== 'object') continue;

      const obj = item as Record<string, unknown>;
      const id = typeof obj.id === 'string' && obj.id ? obj.id : `imported-${Date.now()}-${i}`;
      const title = typeof obj.title === 'string' && obj.title ? obj.title : 'Historical Event';
      const description = typeof obj.description === 'string' ? obj.description : '';
      const category = (
        ['milestone', 'biome', 'weather', 'village', 'record', 'note'].includes(
          obj.category as string,
        )
          ? obj.category
          : 'milestone'
      ) as JournalEntry['category'];
      const badge = typeof obj.badge === 'string' ? obj.badge : 'Milestone';
      const iconName = typeof obj.iconName === 'string' ? obj.iconName : 'Sparkles';
      const accentColor = typeof obj.accentColor === 'string' ? obj.accentColor : '#f59e0b';
      const dayCount = typeof obj.dayCount === 'number' && !isNaN(obj.dayCount) ? obj.dayCount : 1;
      const timeOfDayLabel =
        typeof obj.timeOfDayLabel === 'string' ? obj.timeOfDayLabel : 'Morning';
      const season = (
        ['spring', 'summer', 'autumn', 'winter'].includes(obj.season as string)
          ? obj.season
          : 'spring'
      ) as SeasonId;
      const createdAt =
        typeof obj.createdAt === 'number' && !isNaN(obj.createdAt)
          ? obj.createdAt
          : Date.now() - (rawEntries.length - i) * 60000;
      const realTimestamp =
        typeof obj.realTimestamp === 'string'
          ? obj.realTimestamp
          : formatRealTime(createdAt);

      const entry: JournalEntry = {
        id,
        category,
        title,
        description,
        badge,
        iconName,
        accentColor,
        dayCount,
        timeOfDayLabel,
        season,
        realTimestamp,
        createdAt,
      };

      if (obj.numericRecord && typeof obj.numericRecord === 'object') {
        const nr = obj.numericRecord as Record<string, unknown>;
        if (
          typeof nr.type === 'string' &&
          typeof nr.value === 'number' &&
          !isNaN(nr.value)
        ) {
          entry.numericRecord = {
            type: nr.type as 'population' | 'happiness' | 'days' | 'trees' | 'houses',
            value: nr.value,
            prevValue: typeof nr.prevValue === 'number' ? nr.prevValue : undefined,
          };
        }
      }

      if (obj.isCustomNote === true) {
        entry.isCustomNote = true;
      }

      const tags =
        Array.isArray(obj.tags) && obj.tags.length > 0
          ? (obj.tags as unknown[])
              .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
              .map((t) => t.trim())
          : deriveTagsForEntry({ category, badge, title, numericRecord: entry.numericRecord });

      entry.tags = tags;

      sanitizedEntries.push(entry);
    }

    if (sanitizedEntries.length === 0) {
      return { success: false, error: 'Could not parse any valid journal entries from file.' };
    }

    const defaultStats = getDefaultStats();
    const validatedStats: JournalStats = {
      peakPopulation:
        typeof rawStats.peakPopulation === 'number'
          ? rawStats.peakPopulation
          : defaultStats.peakPopulation,
      peakHappiness:
        typeof rawStats.peakHappiness === 'number'
          ? rawStats.peakHappiness
          : defaultStats.peakHappiness,
      totalDays:
        typeof rawStats.totalDays === 'number'
          ? rawStats.totalDays
          : defaultStats.totalDays,
      biomesDiscovered: Array.isArray(rawStats.biomesDiscovered)
        ? rawStats.biomesDiscovered.filter((b): b is string => typeof b === 'string')
        : defaultStats.biomesDiscovered,
      firstSnowRecorded: !!rawStats.firstSnowRecorded,
      firstRainbowRecorded: !!rawStats.firstRainbowRecorded,
      firstNightfallRecorded: !!rawStats.firstNightfallRecorded,
      firstSnapshotRecorded: !!rawStats.firstSnapshotRecorded,
      firstCelestialTransitionRecorded: !!rawStats.firstCelestialTransitionRecorded,
    };

    return {
      success: true,
      data: {
        version: 1,
        app: 'Pocket World Terrarium',
        exportedAt: new Date().toISOString(),
        planetName,
        entries: sanitizedEntries,
        stats: validatedStats,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse JSON file: ${err instanceof Error ? err.message : 'Syntax error'}`,
    };
  }
}

/**
 * Combines existing and imported entries, avoiding duplicates by unique ID.
 */
export function mergeJournalEntries(
  existing: JournalEntry[],
  imported: JournalEntry[],
): JournalEntry[] {
  const map = new Map<string, JournalEntry>();
  existing.forEach((e) => map.set(e.id, e));
  imported.forEach((e) => map.set(e.id, e));
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Merges planetary records and stats conservatively preserving the highest achieved milestones.
 */
export function mergeJournalStats(
  existing: JournalStats,
  imported: Partial<JournalStats> | undefined,
): JournalStats {
  if (!imported) return existing;
  return {
    peakPopulation: Math.max(existing.peakPopulation, imported.peakPopulation ?? 0),
    peakHappiness: Math.max(existing.peakHappiness, imported.peakHappiness ?? 0),
    totalDays: Math.max(existing.totalDays, imported.totalDays ?? 1),
    biomesDiscovered: Array.from(
      new Set([...existing.biomesDiscovered, ...(imported.biomesDiscovered ?? [])]),
    ),
    firstSnowRecorded: existing.firstSnowRecorded || !!imported.firstSnowRecorded,
    firstRainbowRecorded: existing.firstRainbowRecorded || !!imported.firstRainbowRecorded,
    firstNightfallRecorded: existing.firstNightfallRecorded || !!imported.firstNightfallRecorded,
    firstSnapshotRecorded: existing.firstSnapshotRecorded || !!imported.firstSnapshotRecorded,
    firstCelestialTransitionRecorded:
      existing.firstCelestialTransitionRecorded || !!imported.firstCelestialTransitionRecorded,
  };
}
