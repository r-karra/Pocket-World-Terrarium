import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
  Calendar,
  Heart,
  Smile,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { JournalEntry, JournalStats, SeasonId } from '../types/world';
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
  category: string;
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

function CustomChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="p-3.5 rounded-2xl bg-[#231a15]/95 text-[#fbf7ee] border border-[#d97706]/40 shadow-2xl backdrop-blur-md max-w-xs font-sans">
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

      <p className="text-[11px] text-[#d4c6b5] leading-relaxed mb-2.5 line-clamp-2">
        {data.description}
      </p>

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
        <div className="mt-2 pt-1.5 text-center text-[10px] font-mono text-[#fcd34d] flex items-center justify-center gap-1">
          <Trophy className="w-3 h-3 text-[#f59e0b]" /> Significant World Milestone
        </div>
      )}
    </div>
  );
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
  const [activeMetric, setActiveMetric] = useState<'combined' | 'population' | 'happiness'>('combined');

  // Build sequential timeline progression data points
  const timelineData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);

    let runPop = 12;
    let runHap = 94;
    const peakPop = Math.max(stats.peakPopulation, population);
    const peakHap = Math.max(stats.peakHappiness, happiness);

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
      });
    });

    // Append final point for current terrarium state
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
    });

    return points;
  }, [entries, stats, population, happiness, dayCount, season, planetName]);

  // Overall metric statistics
  const currentPop = population;
  const currentHap = happiness;
  const initialPop = timelineData[0]?.population || 12;
  const popGrowthDelta = currentPop - initialPop;
  const milestonesCount = entries.filter((e) => {
    const m = getMilestoneInfo(e);
    return m.isMilestone || e.tags?.includes('Milestone');
  }).length;

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
              <Trophy className="w-3.5 h-3.5 text-[#f59e0b]" /> Milestones
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] font-semibold">
              {milestonesCount} cataloged
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono-tabular">
            <span className="text-xl sm:text-2xl font-bold text-[#2f261e]">
              {milestonesCount}
            </span>
            <span className="text-xs text-[#7c6955]">
              breakthroughs
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[#8a7764]">
            Significant planetary milestones unlocked
          </div>
        </div>

        {/* Timeline Span Card */}
        <div className="p-3.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#db2777]" /> Age & Seasons
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
            {timelineData.length} chronicle data points recorded
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fdfaf3] border border-[#dcd1be] shadow-sm flex flex-col gap-4">
        {/* Chart Header & Metric Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ded0] pb-3.5">
          <div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#2f261e] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#d97706]" />
              Population Growth & Citizen Happiness Trends
            </h3>
            <p className="text-xs text-[#786755]">
              Chronological progression over {timelineData.length} planetary events and milestones
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

        {/* Recharts Chart Viewport */}
        <div className="w-full h-72 sm:h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 15, right: 25, left: -10, bottom: 25 }}
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

              {/* Population Area */}
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
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              )}

              {/* Happiness Trend Area / Line */}
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
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend & Insights Strip */}
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
            <div className="flex items-center gap-1.5 text-[11px] text-[#8c7866]">
              <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Hover over chart markers to view associated journal events</span>
            </div>
          </div>

          <div className="font-mono text-[11px] text-[#8a7764]">
            {entries.length} historical chronicle records
          </div>
        </div>
      </div>

      {/* Timeline Milestones Progression Table */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fdfaf3] border border-[#dcd1be] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-serif font-bold text-[#352a20] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#d97706]" />
            Key Chronicle Progression Milestones
          </h4>
          <span className="text-[11px] font-mono text-[#8a7764]">
            Sorted Chronologically
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#e2d6c3] text-[10px] font-mono uppercase tracking-wider text-[#857361]">
                <th className="py-2 px-3 font-semibold">Timestamp</th>
                <th className="py-2 px-3 font-semibold">Event</th>
                <th className="py-2 px-3 font-semibold">Badge</th>
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
                    pt.isMilestone ? 'bg-[#fef9ee]/70 font-medium' : ''
                  } ${onNavigateToEntry ? 'cursor-pointer' : ''}`}
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#786755] whitespace-nowrap">
                    {pt.day} • {pt.season}
                  </td>
                  <td className="py-2.5 px-3 text-[#2b211a] font-serif font-semibold">
                    {pt.event}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#ede4d4] border border-[#ded2bd] text-[10px] font-mono text-[#615141]">
                      {pt.badge}
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
