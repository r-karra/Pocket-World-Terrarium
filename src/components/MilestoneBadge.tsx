import React from 'react';
import {
  Award,
  Camera,
  Crown,
  Rainbow,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trees,
  Trophy,
} from 'lucide-react';
import { JournalEntry } from '../types/world';

export type MilestoneType =
  | 'population_milestone'
  | 'first_snow'
  | 'biome_unlock'
  | 'genesis'
  | 'celestial'
  | 'rainbow_wonder'
  | 'keepsake_snapshot'
  | 'longevity'
  | 'general_milestone';

export interface MilestoneDetails {
  isMilestone: boolean;
  type: MilestoneType;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  iconFill?: string;
  bgClasses: string;
  borderClasses: string;
  textClasses: string;
  glowClasses: string;
  cardHighlightBorder?: string;
  cardHighlightBg?: string;
}

/**
 * Determines whether a JournalEntry represents a significant world milestone
 * and returns rich visual metadata for rendering badges and card accents.
 */
export function getMilestoneInfo(entry?: JournalEntry | null): MilestoneDetails {
  if (!entry) {
    return {
      isMilestone: false,
      type: 'general_milestone',
      label: 'Observation',
      icon: Sparkles,
      iconColor: '#a89987',
      bgClasses: 'bg-[#ede5d6]',
      borderClasses: 'border-[#d8ccba]',
      textClasses: 'text-[#5e4e3f]',
      glowClasses: '',
    };
  }

  // 1. First Snowfall Milestone
  const isFirstSnow =
    entry.badge.toLowerCase().includes('first snow') ||
    entry.id.includes('first-snow') ||
    entry.title.toLowerCase().includes('first snow') ||
    (entry.iconName === 'CloudSnow' && entry.category === 'weather');

  if (isFirstSnow) {
    return {
      isMilestone: true,
      type: 'first_snow',
      label: 'First Snow',
      sublabel: 'Winter Frost',
      icon: Snowflake,
      iconColor: '#0284c7',
      iconFill: 'none',
      bgClasses: 'bg-gradient-to-r from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]',
      borderClasses: 'border-[#38bdf8]/60 shadow-[0_1px_3px_rgba(56,189,248,0.25)]',
      textClasses: 'text-[#0369a1]',
      glowClasses: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]',
      cardHighlightBorder: 'border-[#7dd3fc]/80',
      cardHighlightBg: 'bg-gradient-to-r from-[#f4faff] to-[#faf6ee]',
    };
  }

  // 2. Population Milestones (Founding Hamlet & All-Time Population Peaks)
  const isPopulationRecord =
    entry.numericRecord?.type === 'population' ||
    entry.id.includes('record-pop') ||
    entry.id === 'hamlet-seed' ||
    entry.title.toLowerCase().includes('population');

  if (isPopulationRecord) {
    const isFirstHamlet =
      entry.id === 'hamlet-seed' ||
      entry.title.toLowerCase().includes('founding') ||
      entry.badge.toLowerCase() === 'hamlet';

    return {
      isMilestone: true,
      type: 'population_milestone',
      label: isFirstHamlet ? 'First Population Milestone' : 'Population Record',
      sublabel: `${entry.numericRecord?.value ?? 12} Citizens`,
      icon: Star,
      iconColor: '#d97706',
      iconFill: '#f59e0b',
      bgClasses: 'bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a]',
      borderClasses: 'border-[#f59e0b]/60 shadow-[0_1px_3px_rgba(245,158,11,0.25)]',
      textClasses: 'text-[#92400e]',
      glowClasses: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      cardHighlightBorder: 'border-[#fcd34d]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fffdf5] to-[#faf6ee]',
    };
  }

  // 3. Biome Unlocks
  const isBiomeUnlock =
    entry.category === 'biome' ||
    entry.badge.toLowerCase().includes('biome') ||
    entry.id.includes('biome-') ||
    entry.id === 'forest-seed';

  if (isBiomeUnlock) {
    return {
      isMilestone: true,
      type: 'biome_unlock',
      label: 'Biome Unlocked',
      sublabel: entry.badge,
      icon: Trees,
      iconColor: '#059669',
      iconFill: '#34d399',
      bgClasses: 'bg-gradient-to-r from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]',
      borderClasses: 'border-[#10b981]/50 shadow-[0_1px_3px_rgba(16,185,129,0.2)]',
      textClasses: 'text-[#065f46]',
      glowClasses: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      cardHighlightBorder: 'border-[#6ee7b7]',
      cardHighlightBg: 'bg-gradient-to-r from-[#f2fcf7] to-[#faf6ee]',
    };
  }

  // 4. Genesis of the Planet
  if (entry.badge.toLowerCase() === 'genesis' || entry.id === 'genesis-seed') {
    return {
      isMilestone: true,
      type: 'genesis',
      label: 'Genesis Milestone',
      sublabel: 'Day 1',
      icon: Crown,
      iconColor: '#b45309',
      iconFill: '#fcd34d',
      bgClasses: 'bg-gradient-to-r from-[#fefce8] via-[#fef08a] to-[#fde047]',
      borderClasses: 'border-[#eab308]/60 shadow-[0_1px_3px_rgba(234,179,8,0.25)]',
      textClasses: 'text-[#854d0e]',
      glowClasses: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]',
      cardHighlightBorder: 'border-[#fde047]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fffef0] to-[#faf6ee]',
    };
  }

  // 5. First Celestial Sun-to-Moon Arc
  if (entry.badge.toLowerCase() === 'celestial' || entry.id.includes('celestial')) {
    return {
      isMilestone: true,
      type: 'celestial',
      label: 'Celestial Transition',
      sublabel: 'Solar & Lunar Path',
      icon: Sun,
      iconColor: '#c2410c',
      iconFill: '#fb923c',
      bgClasses: 'bg-gradient-to-r from-[#fff7ed] via-[#ffedd5] to-[#fed7aa]',
      borderClasses: 'border-[#f97316]/50 shadow-[0_1px_3px_rgba(249,115,22,0.2)]',
      textClasses: 'text-[#9a3412]',
      glowClasses: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]',
      cardHighlightBorder: 'border-[#fdba74]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fff9f3] to-[#faf6ee]',
    };
  }

  // 6. First Rainbow / Atmospheric Wonder
  if (entry.badge.toLowerCase() === 'wonder' || entry.iconName === 'Rainbow') {
    return {
      isMilestone: true,
      type: 'rainbow_wonder',
      label: 'Wonder Sighted',
      sublabel: 'Prismatic Arch',
      icon: Rainbow,
      iconColor: '#be185d',
      bgClasses: 'bg-gradient-to-r from-[#fdf2f8] via-[#fce7f3] to-[#fbcfe8]',
      borderClasses: 'border-[#ec4899]/50 shadow-[0_1px_3px_rgba(236,72,153,0.2)]',
      textClasses: 'text-[#9d174d]',
      glowClasses: 'shadow-[0_0_12px_rgba(236,72,153,0.25)]',
      cardHighlightBorder: 'border-[#f472b6]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fdf4f9] to-[#faf6ee]',
    };
  }

  // 7. Keepsake / High-Resolution Snapshot
  if (entry.badge.toLowerCase() === 'keepsake' || entry.id.includes('snapshot')) {
    return {
      isMilestone: true,
      type: 'keepsake_snapshot',
      label: 'Historic Keepsake',
      sublabel: 'Archive Photo',
      icon: Camera,
      iconColor: '#7e22ce',
      bgClasses: 'bg-gradient-to-r from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff]',
      borderClasses: 'border-[#c084fc]/50 shadow-[0_1px_3px_rgba(192,132,252,0.2)]',
      textClasses: 'text-[#6b21a8]',
      glowClasses: 'shadow-[0_0_12px_rgba(192,132,252,0.25)]',
      cardHighlightBorder: 'border-[#d8b4fe]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fcf7ff] to-[#faf6ee]',
    };
  }

  // 8. Longevity & Day Milestones
  if (
    entry.numericRecord?.type === 'days' ||
    entry.id.includes('milestone-day-')
  ) {
    return {
      isMilestone: true,
      type: 'longevity',
      label: 'Solar Cycle Milestone',
      sublabel: `Day ${entry.numericRecord?.value ?? entry.dayCount}`,
      icon: Trophy,
      iconColor: '#b45309',
      iconFill: '#fbbf24',
      bgClasses: 'bg-gradient-to-r from-[#fefce8] via-[#fef3c7] to-[#fed7aa]',
      borderClasses: 'border-[#f59e0b]/50 shadow-[0_1px_3px_rgba(245,158,11,0.2)]',
      textClasses: 'text-[#92400e]',
      glowClasses: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      cardHighlightBorder: 'border-[#fcd34d]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fffdf5] to-[#faf6ee]',
    };
  }

  // 9. Other milestones & records
  if (entry.category === 'milestone' || entry.category === 'record') {
    return {
      isMilestone: true,
      type: 'general_milestone',
      label: entry.badge || 'Terrarium Milestone',
      icon: Award,
      iconColor: '#b45309',
      bgClasses: 'bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a]',
      borderClasses: 'border-[#f59e0b]/50 shadow-[0_1px_3px_rgba(245,158,11,0.2)]',
      textClasses: 'text-[#92400e]',
      glowClasses: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
      cardHighlightBorder: 'border-[#fcd34d]',
      cardHighlightBg: 'bg-gradient-to-r from-[#fffdf5] to-[#faf6ee]',
    };
  }

  // Default: Not a significant milestone (e.g. personal field note)
  return {
    isMilestone: false,
    type: 'general_milestone',
    label: entry.badge,
    icon: Sparkles,
    iconColor: '#8a7663',
    bgClasses: 'bg-[#ede5d6]',
    borderClasses: 'border-[#d8ccba]',
    textClasses: 'text-[#5e4e3f]',
    glowClasses: '',
  };
}

export interface MilestoneBadgeProps {
  entry?: JournalEntry | null;
  /** Explicit override for label text */
  label?: string;
  /** Size variants */
  size?: 'sm' | 'md' | 'lg';
  /** Show badge only with icon and label, or with additional sublabel chip */
  showSublabel?: boolean;
  /** Custom className additions */
  className?: string;
}

/**
 * Visual badge component designed for displaying significant milestones
 * inside Journal entries (e.g., gold star for First Population Milestone,
 * crystalline snowflake for First Snow).
 */
export function MilestoneBadge({
  entry,
  label: customLabel,
  size = 'md',
  showSublabel = false,
  className = '',
}: MilestoneBadgeProps) {
  const details = getMilestoneInfo(entry);

  // If this entry is not a milestone, don't render an intrusive milestone badge
  if (!details.isMilestone && !customLabel) {
    return null;
  }

  const IconComponent = details.icon;
  const displayLabel = customLabel || details.label;

  // Size variations
  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
      icon: 'w-3 h-3',
      sublabel: 'text-[9px]',
    },
    md: {
      container: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
      icon: 'w-3.5 h-3.5',
      sublabel: 'text-[9.5px]',
    },
    lg: {
      container: 'px-3 py-1.5 text-xs gap-2 rounded-xl',
      icon: 'w-4 h-4',
      sublabel: 'text-[10px]',
    },
  }[size];

  return (
    <span
      title={`Milestone: ${displayLabel}`}
      className={`inline-flex items-center font-sans font-semibold border ${details.bgClasses} ${details.borderClasses} ${details.textClasses} ${sizeClasses.container} select-none transition-transform hover:scale-[1.02] ${className}`}
    >
      <IconComponent
        className={`${sizeClasses.icon} shrink-0 drop-shadow-xs`}
        style={{
          color: details.iconColor,
          fill: details.iconFill || 'none',
        }}
        aria-hidden="true"
      />
      <span className="tracking-tight truncate">{displayLabel}</span>
      {showSublabel && details.sublabel && (
        <span
          className={`opacity-75 font-mono font-normal pl-1 border-l border-current/25 ${sizeClasses.sublabel} hidden sm:inline`}
        >
          {details.sublabel}
        </span>
      )}
    </span>
  );
}

export default MilestoneBadge;
