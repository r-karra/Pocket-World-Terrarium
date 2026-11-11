import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  Compass,
  Filter,
  Flame,
  Heart,
  Layers,
  MapPin,
  Mountain,
  Smile,
  Sparkles,
  TrendingUp,
  Trees,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { JournalCategory, JournalEntry, JournalStats, SeasonId } from '../types/world';
import { getMilestoneInfo } from './MilestoneBadge';

export interface JournalStatsViewProps {
  entries: JournalEntry[];
  stats: JournalStats;
  planetName: string;
  dayCount: number;
  season: SeasonId;
  population?: number;
  happiness?: number;
  onNavigateToEntry?: (entryId: string) => void;
}

export type SpikeType = 'population' | 'biome' | 'weather' | 'general';

export interface TimelineDataPoint {
  id: string;
  index: number;
  label: string;
  day: string;
  dayCount: number;
  season: string;
  event: string;
  badge: string;
  isMilestone: boolean;
  population: number;
  happiness: number;
  timestamp: string;
  description: string;
  category: JournalCategory;

  // Event spike data for Recharts
  popSpike: number;
  biomeSpike: number;
  weatherSpike: number;
  generalSpike: number;
  totalSpike: number;
  spikeType: SpikeType;
  spikeColor: string;
  spikeBadge: string;
  isMajorSpike: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: TimelineDataPoint;
  }>;
}

/** Custom Tooltip for Population & Happiness Growth Curves */
function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="p-3.5 rounded-2xl bg-[#231a15]/95 text-[#fbf7ee] border border-[#d97706]/40 shadow-2xl backdrop-blur-md max-w-sm w-76 sm:w-84 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded-md bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#fcd34d] text-[10px] font-mono uppercase font-bold shrink-0">
            {data.badge || 'Event'}
          </span>
          <span className="text-xs font-serif font-bold text-[#fef3c7] truncate">
            {data.event}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#a89987] shrink-0">
          {data.day}
        </span>
      </div>

      {/* Specific Event Description Card */}
      <div className="mb-2.5 p-2.5 rounded-xl bg-[#2e231c] border border-[#d97706]/35 shadow-inner flex flex-col gap-1 text-left">
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono uppercase tracking-wider text-[#f59e0b] font-bold">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
            Specific Event Description
          </span>
          {data.isMajorSpike && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#f59e0b]/20 text-[#fde047] border border-[#f59e0b]/40 text-[9px] font-bold">
              Milestone Spike
            </span>
          )}
        </div>
        <p className="text-xs font-serif italic text-[#fbf7ee] leading-relaxed pl-1.5 border-l-2 border-[#f59e0b]/70">
          "{data.description}"
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1.5 rounded-xl border border-white/5">
          <Users className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-[#9c8976] uppercase">Citizens</div>
            <div className="font-bold text-[#fef3c7]">{data.population}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1.5 rounded-xl border border-white/5">
          <Heart className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
          <div className="min-w-0">
            <div className="text-[9px] text-[#9c8976] uppercase">Wellness</div>
            <div className="font-bold text-[#a7f3d0]">{data.happiness}%</div>
          </div>
        </div>
      </div>

      {data.isMilestone && (
        <div className="mt-2 pt-1.5 text-center text-[10px] font-mono text-[#fcd34d] flex items-center justify-center gap-1 border-t border-white/5">
          <Trophy className="w-3 h-3 text-[#f59e0b]" /> Significant World Milestone • Click to inspect
        </div>
      )}
    </div>
  );
}

/** Custom Tooltip for Chronological Event Spikes Summary Chart */
function CustomEventSpikesTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="p-3.5 rounded-2xl bg-[#201813]/95 text-[#fbf7ee] border border-[#d97706]/40 shadow-2xl backdrop-blur-md max-w-sm w-76 sm:w-84 font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold shrink-0 border"
            style={{
              backgroundColor: `${data.spikeColor}22`,
              borderColor: `${data.spikeColor}55`,
              color: data.spikeColor === '#059669' ? '#34d399' : data.spikeColor === '#0284c7' ? '#38bdf8' : '#fcd34d',
            }}
          >
            {data.spikeBadge}
          </span>
          <span className="text-xs font-serif font-bold text-[#fef3c7] truncate">
            {data.event}
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#a89987] shrink-0">
          {data.day}
        </span>
      </div>

      {/* Spike Impact Meter */}
      <div className="mb-2 p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#a89987] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#f59e0b]" /> Milestone Spike Impact
          </span>
          <span className="font-bold text-[#fef3c7]">{data.totalSpike} / 100</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(10, data.totalSpike))}%`,
              backgroundColor: data.spikeColor,
            }}
          />
        </div>
      </div>

      {/* Specific Event Description Card */}
      <div className="mb-2.5 p-2.5 rounded-xl bg-[#2b2019] border border-[#d97706]/35 shadow-inner flex flex-col gap-1 text-left">
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono uppercase tracking-wider text-[#f59e0b] font-bold">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
            Specific Event Description
          </span>
          {data.isMajorSpike && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#f59e0b]/20 text-[#fde047] border border-[#f59e0b]/40 text-[9px] font-bold">
              Milestone Spike
            </span>
          )}
        </div>
        <p className="text-xs font-serif italic text-[#fbf7ee] leading-relaxed pl-1.5 border-l-2 border-[#f59e0b]/70">
          "{data.description}"
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1 rounded-lg border border-white/5">
          <Users className="w-3 h-3 text-[#f59e0b] shrink-0" />
          <span className="text-[10px] text-[#d4c6b5]">Pop: {data.population}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-1 rounded-lg border border-white/5">
          <Heart className="w-3 h-3 text-[#10b981] shrink-0" />
          <span className="text-[10px] text-[#a7f3d0]">Harmony: {data.happiness}%</span>
        </div>
      </div>

      <div className="mt-2 text-center text-[10px] font-mono text-[#fcd34d]/80 flex items-center justify-center gap-1">
        <span>Click spike marker to view entry in timeline</span>
      </div>
    </div>
  );
}

/** Small interactive milestone dot marker on the growth area curve */
function renderAreaMilestoneDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload || (!payload.isMilestone && !payload.isMajorSpike)) {
    return <g key={`dot-empty-${props.index || Math.random()}`} />;
  }
  const color = payload.spikeColor || '#f59e0b';

  return (
    <g className="cursor-pointer" key={`area-dot-${payload.id}-${cx}`}>
      {/* Outer subtle glow */}
      <circle cx={cx} cy={cy} r={8.5} fill={color} fillOpacity={0.25} />
      {/* Perimeter ring */}
      <circle cx={cx} cy={cy} r={5} fill="#fdfaf3" stroke={color} strokeWidth={2} />
      {/* Center jewel core */}
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </g>
  );
}

/** Active hover marker on the growth area curve */
function renderActiveAreaDot(props: any) {
  const { cx, cy, payload } = props;
  const color = payload?.spikeColor || '#f59e0b';

  return (
    <g className="cursor-pointer" key={`active-dot-${payload?.id || 'live'}`}>
      <circle cx={cx} cy={cy} r={13} fill={color} fillOpacity={0.25} className="animate-pulse" />
      <circle cx={cx} cy={cy} r={7.5} fill="#201813" stroke={color} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={3} fill="#ffffff" />
    </g>
  );
}

/** Small interactive marker pin on top of milestone spikes in the BarChart */
function renderBarMilestoneMarker(props: any, list: TimelineDataPoint[]) {
  const { x, y, width, index } = props;
  const pt = list[index];
  if (!pt || (!pt.isMajorSpike && !pt.isMilestone)) return null;

  const cx = Number(x) + Number(width) / 2;
  const cy = Math.max(14, Number(y) - 10);
  const color = pt.spikeColor || '#f59e0b';

  return (
    <g className="milestone-tooltip-marker pointer-events-none" key={`bar-marker-${pt.id}-${index}`}>
      {/* Connecting vertical tick stem */}
      <line
        x1={cx}
        y1={Number(y)}
        x2={cx}
        y2={cy + 6}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="2 2"
        opacity={0.85}
      />
      {/* Outer halo */}
      <circle cx={cx} cy={cy} r={7.5} fill={color} fillOpacity={0.25} />
      {/* Marker pin circle badge */}
      <circle cx={cx} cy={cy} r={5} fill="#241a14" stroke={color} strokeWidth={1.8} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </g>
  );
}

/** Classifies an event entry into distinct milestone and discovery spikes */
function classifyEventSpike(
  entry: JournalEntry,
  runningPop: number,
  runningHap: number
): {
  popSpike: number;
  biomeSpike: number;
  weatherSpike: number;
  generalSpike: number;
  totalSpike: number;
  spikeType: SpikeType;
  spikeColor: string;
  spikeBadge: string;
  isMajorSpike: boolean;
} {
  const normTitle = entry.title.toLowerCase();
  const normBadge = entry.badge.toLowerCase();
  const normCat = entry.category;
  const isPopRecord = entry.numericRecord?.type === 'population';

  // 1. Population Milestone or Hamlet / Settlement expansion
  const isPopMilestone =
    isPopRecord ||
    normCat === 'village' ||
    (normCat === 'milestone' &&
      (normTitle.includes('population') ||
        normTitle.includes('citizen') ||
        normTitle.includes('hamlet') ||
        normTitle.includes('genesis') ||
        normBadge.includes('hamlet') ||
        normBadge.includes('genesis'))) ||
    normTitle.includes('hamlet') ||
    normTitle.includes('settler') ||
    normTitle.includes('cottage') ||
    normTitle.includes('windmill') ||
    normBadge.includes('hamlet') ||
    normBadge.includes('village');

  // 2. Biome Change or Discovery
  const isBiomeChange =
    normCat === 'biome' ||
    normBadge.includes('biome') ||
    normTitle.includes('biome') ||
    normTitle.includes('canopy') ||
    normTitle.includes('forest') ||
    normTitle.includes('tree') ||
    normTitle.includes('meadow') ||
    normTitle.includes('peaks') ||
    normTitle.includes('mountain') ||
    normTitle.includes('coral') ||
    normTitle.includes('reef') ||
    normTitle.includes('tundra') ||
    normTitle.includes('desert') ||
    (entry.tags?.includes('Discovery') && !isPopMilestone);

  // 3. Weather / Celestial / Sky wonder
  const isWeatherShift =
    normCat === 'weather' ||
    normTitle.includes('snow') ||
    normTitle.includes('frost') ||
    normTitle.includes('rainbow') ||
    normTitle.includes('aurora') ||
    normTitle.includes('blizzard') ||
    normBadge.includes('snow') ||
    normBadge.includes('frost') ||
    normBadge.includes('wonder');

  if (isPopMilestone) {
    let magnitude = 80;
    if (normBadge.includes('genesis') || normTitle.includes('genesis')) magnitude = 95;
    else if (runningPop >= 50 || normTitle.includes('city')) magnitude = 100;
    else if (runningPop >= 25 || normTitle.includes('town')) magnitude = 90;
    else if (normCat === 'village' || normTitle.includes('hamlet')) magnitude = 85;

    return {
      popSpike: magnitude,
      biomeSpike: 0,
      weatherSpike: 0,
      generalSpike: 0,
      totalSpike: magnitude,
      spikeType: 'population',
      spikeColor: '#f59e0b',
      spikeBadge: 'Population Milestone',
      isMajorSpike: true,
    };
  }

  if (isBiomeChange) {
    let magnitude = 85;
    if (normBadge.includes('wonder') || normTitle.includes('ancient') || normTitle.includes('sacred')) magnitude = 95;
    else if (normTitle.includes('canopy') || normTitle.includes('forest') || normTitle.includes('peaks')) magnitude = 90;

    return {
      popSpike: 0,
      biomeSpike: magnitude,
      weatherSpike: 0,
      generalSpike: 0,
      totalSpike: magnitude,
      spikeType: 'biome',
      spikeColor: '#059669',
      spikeBadge: 'Biome Discovery',
      isMajorSpike: true,
    };
  }

  if (isWeatherShift) {
    const magnitude = normTitle.includes('snow') || normTitle.includes('rainbow') ? 80 : 70;
    return {
      popSpike: 0,
      biomeSpike: 0,
      weatherSpike: magnitude,
      generalSpike: 0,
      totalSpike: magnitude,
      spikeType: 'weather',
      spikeColor: '#0284c7',
      spikeBadge: 'Weather & Sky Wonder',
      isMajorSpike: true,
    };
  }

  // Baseline observation / field note pulse
  return {
    popSpike: 0,
    biomeSpike: 0,
    weatherSpike: 0,
    generalSpike: 25,
    totalSpike: 25,
    spikeType: 'general',
    spikeColor: '#b8a894',
    spikeBadge: 'Field Chronicle',
    isMajorSpike: false,
  };
}

export function JournalStatsView({
  entries,
  stats,
  planetName,
  dayCount,
  season,
  population = 12,
  happiness = 96,
  onNavigateToEntry,
}: JournalStatsViewProps) {
  // Chart visual settings
  const [activeMetric, setActiveMetric] = useState<'combined' | 'population' | 'happiness'>('combined');
  const [activeLayout, setActiveLayout] = useState<'dual' | 'spikes' | 'growth'>('dual');
  const [spikeFilter, setSpikeFilter] = useState<'all' | 'population' | 'biome' | 'major'>('all');

  // Build sequential timeline progression data points with spikes
  const timelineData: TimelineDataPoint[] = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);

    let runPop = 12;
    let runHap = 94;
    const peakPop = Math.max(stats.peakPopulation, population);

    const points: TimelineDataPoint[] = [];

    sorted.forEach((e, idx) => {
      const milestone = getMilestoneInfo(e);
      const isMilestone = milestone.isMilestone || e.tags?.includes('Milestone') || false;

      // Adjust population based on explicit records or narrative events
      if (e.numericRecord?.type === 'population') {
        runPop = e.numericRecord.value;
      } else if (e.category === 'village' || e.badge.toLowerCase().includes('hamlet')) {
        runPop = Math.max(runPop, (e.numericRecord?.value ?? runPop) + 3);
      } else if (e.category === 'biome' || e.id.includes('forest') || e.id.includes('biome')) {
        runPop += 2;
        runHap = Math.min(100, runHap + 2);
      }

      // Adjust happiness based on celestial wonders and weather
      if (e.numericRecord?.type === 'happiness') {
        runHap = e.numericRecord.value;
      } else if (e.title.toLowerCase().includes('snow') || e.title.toLowerCase().includes('frost')) {
        runHap = Math.min(100, runHap + 2);
      } else if (e.title.toLowerCase().includes('rainbow') || e.badge.toLowerCase().includes('wonder')) {
        runHap = Math.min(100, Math.max(runHap, 98));
      } else if (e.category === 'note') {
        runHap = Math.min(100, runHap + 1);
      }

      runPop = Math.min(runPop, peakPop);
      runHap = Math.max(70, Math.min(100, runHap));

      const spikeInfo = classifyEventSpike(e, runPop, runHap);

      points.push({
        id: e.id,
        index: idx + 1,
        label: `E${idx + 1}`,
        day: `Day ${e.dayCount}`,
        dayCount: e.dayCount,
        season: e.season,
        event: e.title,
        badge: e.badge || 'Event',
        isMilestone,
        population: runPop,
        happiness: runHap,
        timestamp: e.realTimestamp,
        description: e.description,
        category: e.category,
        ...spikeInfo,
      });
    });

    // Final live state reference point
    const liveSpike = {
      popSpike: 0,
      biomeSpike: 0,
      weatherSpike: 0,
      generalSpike: 30,
      totalSpike: 30,
      spikeType: 'general' as SpikeType,
      spikeColor: '#b8a894',
      spikeBadge: 'Live Terrarium',
      isMajorSpike: false,
    };

    points.push({
      id: 'current-state',
      index: points.length + 1,
      label: 'Now',
      day: `Day ${dayCount}`,
      dayCount,
      season,
      event: `Current State (${planetName})`,
      badge: 'Live',
      isMilestone: false,
      population,
      happiness,
      timestamp: 'Present',
      description: `Current thriving balance of citizens and terrarium harmony.`,
      category: 'record',
      ...liveSpike,
    });

    return points;
  }, [entries, stats, population, happiness, dayCount, season, planetName]);

  // Filtered timeline data for Event Spikes summary chart
  const filteredSpikeData = useMemo(() => {
    switch (spikeFilter) {
      case 'population':
        return timelineData.filter((p) => p.spikeType === 'population');
      case 'biome':
        return timelineData.filter((p) => p.spikeType === 'biome');
      case 'major':
        return timelineData.filter((p) => p.isMajorSpike);
      case 'all':
      default:
        return timelineData;
    }
  }, [timelineData, spikeFilter]);

  // Overall metric statistics
  const currentPop = population;
  const currentHap = happiness;
  const initialPop = timelineData[0]?.population || 12;
  const popGrowthDelta = currentPop - initialPop;

  // Counts of major spikes
  const popSpikesCount = timelineData.filter((p) => p.spikeType === 'population' && p.isMajorSpike).length;
  const biomeSpikesCount = timelineData.filter((p) => p.spikeType === 'biome' && p.isMajorSpike).length;
  const majorSpikesCount = timelineData.filter((p) => p.isMajorSpike).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar flex flex-col gap-5 bg-[#faf6ee]">
      {/* Top Vital Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {/* Population Growth Card */}
        <div className="p-3.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#d97706]" /> Population
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] font-semibold">
              +{popGrowthDelta >= 0 ? popGrowthDelta : 0} growth
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-tabular">
            <span className="text-xl sm:text-2xl font-bold text-[#2f261e]">
              {currentPop}
            </span>
            <span className="text-xs text-[#7c6955]">
              / Peak {stats.peakPopulation}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8a7764]">
            Settlers living in coastal & meadow hamlets
          </div>
        </div>

        {/* Happiness Trend Card */}
        <div className="p-3.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955] flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-[#059669]" /> Happiness
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#ecfdf5] text-[#065f46] font-semibold">
              {currentHap >= 90 ? 'Thriving' : 'Content'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-tabular">
            <span className="text-xl sm:text-2xl font-bold text-[#065f46]">
              {currentHap}%
            </span>
            <span className="text-xs text-[#7c6955]">
              / Peak {stats.peakHappiness}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8a7764]">
            Naturalist harmony and seasonal satisfaction
          </div>
        </div>

        {/* Milestones Achieved Card */}
        <div className="p-3.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#f59e0b]" /> Event Spikes
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] font-semibold">
              {majorSpikesCount} breakthroughs
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-tabular">
            <span className="text-xl sm:text-2xl font-bold text-[#2f261e]">
              {majorSpikesCount}
            </span>
            <span className="text-xs text-[#7c6955]">
              spikes logged
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8a7764]">
            {popSpikesCount} pop milestones • {biomeSpikesCount} biome shifts
          </div>
        </div>

        {/* Timeline Span Card */}
        <div className="p-3.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#db2777]" /> Age & Epoch
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#fdf2f8] text-[#9d174d] font-semibold capitalize">
              {season}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-tabular">
            <span className="text-xl sm:text-2xl font-bold text-[#2f261e]">
              Day {dayCount}
            </span>
            <span className="text-xs text-[#7c6955]">
              solar cycles
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8a7764]">
            {timelineData.length} chronological data points
          </div>
        </div>
      </div>

      {/* Main View Mode Selector (Dual Charts Alongside vs Single Focused Chart) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#ede4d4] px-4 py-2.5 rounded-2xl border border-[#ddcfba]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#8a684b]" />
          <span className="text-xs font-serif font-bold text-[#3d3023]">
            Recharts Visualizations Layout
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#dfd2be] p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveLayout('dual')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              activeLayout === 'dual'
                ? 'bg-[#3b2f27] text-[#fef3c7] shadow-xs'
                : 'text-[#615141] hover:text-[#2b221b]'
            }`}
          >
            <BarChart3 className="w-3 h-3 text-[#f59e0b]" />
            <span>Dual Charts (Alongside)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayout('growth')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              activeLayout === 'growth'
                ? 'bg-[#3b2f27] text-[#fef3c7] shadow-xs'
                : 'text-[#615141] hover:text-[#2b221b]'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-[#d97706]" />
            <span>Growth Trends Only</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayout('spikes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
              activeLayout === 'spikes'
                ? 'bg-[#3b2f27] text-[#fef3c7] shadow-xs'
                : 'text-[#615141] hover:text-[#2b221b]'
            }`}
          >
            <Zap className="w-3 h-3 text-[#059669]" />
            <span>Event Spikes Only</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* CHART 1: Growth Trend Graph (Population & Citizen Happiness) */}
      {/* ------------------------------------------------------------------------- */}
      {(activeLayout === 'dual' || activeLayout === 'growth') && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#fdfaf3] border border-[#dcd1be] shadow-sm flex flex-col gap-4">
          {/* Chart Header & Metric Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ded0] pb-3.5">
            <div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#2f261e] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d97706]" />
                Population Growth & Citizen Happiness Trends
              </h3>
              <p className="text-xs text-[#786755]">
                Continuous growth progression over {timelineData.length} planetary events and milestones
              </p>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex items-center gap-1 bg-[#ede5d6] p-1 rounded-xl border border-[#ded2be] text-xs">
              <button
                type="button"
                onClick={() => setActiveMetric('combined')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  activeMetric === 'combined'
                    ? 'bg-[#3b2f27] text-[#fef3c7] shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                Dual Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('population')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  activeMetric === 'population'
                    ? 'bg-[#b45309] text-[#fef3c7] shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                <Users className="w-3 h-3 text-[#d97706]" />
                <span>Population</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('happiness')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  activeMetric === 'happiness'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                <Heart className="w-3 h-3 text-[#34d399]" />
                <span>Happiness</span>
              </button>
            </div>
          </div>

          {/* Recharts Area Chart Viewport */}
          <div className="w-full h-64 sm:h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 15, right: 25, left: -10, bottom: 25 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const pt = state.activePayload[0].payload as TimelineDataPoint;
                    if (pt?.id && onNavigateToEntry) {
                      onNavigateToEntry(pt.id);
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="popAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="hapAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5d9c7"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#8a7764"
                  tick={{ fill: '#7c6955', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#d9ccb9' }}
                  interval="preserveStartEnd"
                />

                {/* Left Y Axis for Population */}
                {(activeMetric === 'combined' || activeMetric === 'population') && (
                  <YAxis
                    yAxisId="popAxis"
                    stroke="#b45309"
                    tick={{ fill: '#92400e', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#d9ccb9' }}
                    domain={[0, (dataMax: number) => Math.max(dataMax + 4, 20)]}
                  />
                )}

                {/* Right Y Axis for Happiness Percentage */}
                {(activeMetric === 'combined' || activeMetric === 'happiness') && (
                  <YAxis
                    yAxisId="hapAxis"
                    orientation={activeMetric === 'combined' ? 'right' : 'left'}
                    stroke="#059669"
                    tick={{ fill: '#065f46', fontSize: 10, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#d9ccb9' }}
                    domain={[60, 100]}
                    unit="%"
                  />
                )}

                <Tooltip content={<CustomChartTooltip />} />

                {/* Reference line for Peak Population */}
                {activeMetric !== 'happiness' && (
                  <ReferenceLine
                    yAxisId="popAxis"
                    y={stats.peakPopulation}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Peak Pop (${stats.peakPopulation})`,
                      fill: '#92400e',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                )}

                {/* Population Area with interactive milestone markers */}
                {(activeMetric === 'combined' || activeMetric === 'population') && (
                  <Area
                    yAxisId="popAxis"
                    type="monotone"
                    dataKey="population"
                    name="Population"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#popAreaGrad)"
                    dot={renderAreaMilestoneDot}
                    activeDot={renderActiveAreaDot}
                  />
                )}

                {/* Happiness Trend Area with interactive milestone markers */}
                {(activeMetric === 'combined' || activeMetric === 'happiness') && (
                  <Area
                    yAxisId="hapAxis"
                    type="monotone"
                    dataKey="happiness"
                    name="Happiness"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={activeMetric === 'happiness' ? 1 : 0.25}
                    fill="url(#hapAreaGrad)"
                    dot={renderAreaMilestoneDot}
                    activeDot={renderActiveAreaDot}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Chart Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e8ded0] text-xs text-[#736250]">
            <div className="flex items-center gap-4 flex-wrap">
              {(activeMetric === 'combined' || activeMetric === 'population') && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#d97706]" />
                  <span className="font-medium text-[#493a2c]">
                    Population Growth (Citizens)
                  </span>
                </div>
              )}
              {(activeMetric === 'combined' || activeMetric === 'happiness') && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#059669]" />
                  <span className="font-medium text-[#493a2c]">
                    Citizen Wellness Index (0-100%)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#736250] flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] text-[#8c7866]">
                <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Hover over milestone marker dots to read specific event descriptions</span>
              </div>
              <div className="font-mono text-[11px] text-[#8a7764]">
                {entries.length} historical chronicle records
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* CHART 2: Chronological Event Summary Chart (Milestone & Biome Spikes)   */}
      {/* ------------------------------------------------------------------------- */}
      {(activeLayout === 'dual' || activeLayout === 'spikes') && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#fdfaf3] border border-[#dcd1be] shadow-sm flex flex-col gap-4">
          {/* Header & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ded0] pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#2f261e] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#d97706]" />
                  Chronological Event Summary & Milestone Spikes
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] font-semibold">
                  Spike Analysis
                </span>
              </div>
              <p className="text-xs text-[#786755]">
                Impact spikes pinpointing major population breakthroughs, biome discoveries, and atmospheric shifts
              </p>
            </div>

            {/* Spike Filter Controls */}
            <div className="flex items-center gap-1 bg-[#ede5d6] p-1 rounded-xl border border-[#ded2be] text-xs flex-wrap">
              <button
                type="button"
                onClick={() => setSpikeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  spikeFilter === 'all'
                    ? 'bg-[#3b2f27] text-[#fef3c7] shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                All Spikes ({timelineData.length})
              </button>
              <button
                type="button"
                onClick={() => setSpikeFilter('population')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  spikeFilter === 'population'
                    ? 'bg-[#b45309] text-[#fef3c7] shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <span>Pop Milestones ({popSpikesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSpikeFilter('biome')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  spikeFilter === 'biome'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>Biome Changes ({biomeSpikesCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSpikeFilter('major')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  spikeFilter === 'major'
                    ? 'bg-[#78350f] text-[#fef3c7] shadow-xs'
                    : 'text-[#615141] hover:text-[#2b221b]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#fde047]" />
                <span>Major Only (≥50)</span>
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart with Spikes */}
          <div className="w-full h-64 sm:h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredSpikeData}
                margin={{ top: 15, right: 25, left: -10, bottom: 25 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const pt = state.activePayload[0].payload as TimelineDataPoint;
                    if (pt?.id && onNavigateToEntry) {
                      onNavigateToEntry(pt.id);
                    }
                  }
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5d9c7"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#8a7764"
                  tick={{ fill: '#7c6955', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#d9ccb9' }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="#7c6955"
                  tick={{ fill: '#7c6955', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#d9ccb9' }}
                  domain={[0, 105]}
                  ticks={[25, 50, 75, 100]}
                  unit=" pts"
                />

                <Tooltip content={<CustomEventSpikesTooltip />} />

                {/* Milestone Significance Threshold Line */}
                <ReferenceLine
                  y={75}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Major Milestone Threshold (75+ pts)',
                    fill: '#92400e',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />

                {/* Spikes Bar Series with small interactive milestone markers */}
                <Bar
                  dataKey="totalSpike"
                  name="Event Spike Magnitude"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={38}
                  cursor="pointer"
                >
                  <LabelList
                    dataKey="totalSpike"
                    content={(props: any) => renderBarMilestoneMarker(props, filteredSpikeData)}
                  />
                  {filteredSpikeData.map((pt, idx) => (
                    <Cell
                      key={`spike-${pt.id}-${idx}`}
                      fill={pt.spikeColor}
                      stroke={pt.isMajorSpike ? '#382b20' : 'transparent'}
                      strokeWidth={pt.isMajorSpike ? 1.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Visual Spike Legend & Insights Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e8ded0] text-xs text-[#736250]">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#f59e0b] border border-[#d97706]" />
                <span className="font-medium text-[#493a2c]">
                  Population Milestones
                </span>
                <span className="text-[10px] font-mono text-[#8c7866]">(Hamlet, Town, Citizen Marks)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#059669] border border-[#047857]" />
                <span className="font-medium text-[#493a2c]">
                  Biome Discoveries
                </span>
                <span className="text-[10px] font-mono text-[#8c7866]">(Canopy, Peaks, Reefs)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#0284c7] border border-[#0369a1]" />
                <span className="font-medium text-[#493a2c]">
                  Weather Wonders
                </span>
                <span className="text-[10px] font-mono text-[#8c7866]">(Snow, Rainbows, Solstices)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#b8a894] border border-[#9e8f7b]" />
                <span className="text-[#6d5b4a]">
                  Field Chronicles
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8c7866]">
              <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Hover over milestone spike markers to view specific event descriptions • Click to inspect</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* Timeline Milestones Progression Table */}
      {/* ------------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fdfaf3] border border-[#dcd1be] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-serif font-bold text-[#352a20] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d97706]" />
            Chronological Progression & Milestone Spikes Log
          </h4>
          <span className="text-[11px] font-mono text-[#8a7764]">
            {timelineData.length} records • Click row to inspect
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#e2d6c3] text-[10px] font-mono uppercase tracking-wider text-[#857361]">
                <th className="py-2 px-3 font-semibold">Timestamp</th>
                <th className="py-2 px-3 font-semibold">Event</th>
                <th className="py-2 px-3 font-semibold">Classification & Spike</th>
                <th className="py-2 px-3 font-semibold">Impact Score</th>
                <th className="py-2 px-3 font-semibold">Population</th>
                <th className="py-2 px-3 font-semibold">Happiness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece3d4]">
              {timelineData.map((pt) => (
                <tr
                  key={pt.id}
                  onClick={() => onNavigateToEntry && onNavigateToEntry(pt.id)}
                  className={`hover:bg-[#f3ebe0] transition-colors ${
                    pt.isMajorSpike ? 'bg-[#fef9ee]/75 font-medium' : ''
                  } ${onNavigateToEntry ? 'cursor-pointer' : ''}`}
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#786755] whitespace-nowrap">
                    {pt.day} • {pt.season}
                  </td>
                  <td className="py-2.5 px-3 text-[#2b211a] font-serif font-semibold">
                    <div className="flex items-center gap-1.5">
                      {pt.isMajorSpike && (
                        <Zap
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: pt.spikeColor }}
                        />
                      )}
                      <span>{pt.event}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium"
                      style={{
                        backgroundColor: `${pt.spikeColor}18`,
                        borderColor: `${pt.spikeColor}40`,
                        color: pt.spikeColor === '#059669' ? '#047857' : pt.spikeColor === '#0284c7' ? '#0369a1' : '#92400e',
                      }}
                    >
                      {pt.spikeBadge}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                    <span
                      style={{ color: pt.spikeColor }}
                      className="flex items-center gap-1"
                    >
                      {pt.totalSpike} pts
                      {pt.totalSpike >= 75 && (
                        <span className="text-[9px] px-1 py-0.2 rounded-xs bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                          SPIKE
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#b45309]">
                    {pt.population}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#059669]">
                    {pt.happiness}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
