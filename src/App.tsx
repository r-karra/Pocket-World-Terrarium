import React, { useEffect, useRef, useState } from 'react';
import {
  Anchor,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bird,
  BookMarked,
  BookOpen,
  Bug,
  Camera,
  Castle,
  Check,
  Cloud,
  CloudSnow,
  Compass,
  Download,
  Eraser,
  Fan,
  Flame,
  Flower2,
  Home,
  LampFloor,
  Moon,
  Mountain,
  Pencil,
  Play,
  Rainbow,
  Sailboat,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Sunset,
  TowerControl,
  Trees,
  Users,
  Volume1,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PocketWorldController } from './three/PocketWorldScene';
import { JournalOverlay } from './components/JournalOverlay';
import { MilestoneBadge } from './components/MilestoneBadge';
import {
  CameraViewId,
  JournalEntry,
  JournalStats,
  SeasonId,
  SEASONS,
  TimeMode,
  TOOL_DEFINITIONS,
  ToolCategory,
  ToolId,
  WeatherIntensity,
  WeatherMode,
  WorldState,
} from './types/world';
import {
  evaluateMilestone,
  loadJournalData,
  MilestoneContext,
  saveJournalData,
} from './utils/journalManager';

function renderWeatherOptionIcon(name: string, cls = 'w-3.5 h-3.5 shrink-0') {
  switch (name) {
    case 'CloudSnow':
      return <CloudSnow className={`${cls} text-[#38bdf8]`} />;
    case 'Cloud':
      return <Cloud className={`${cls} text-[#38bdf8]`} />;
    case 'Mountain':
      return <Mountain className={`${cls} text-[#818cf8]`} />;
    case 'Waves':
      return <Waves className={`${cls} text-[#2dd4bf]`} />;
    case 'Flame':
      return <Flame className={`${cls} text-[#f97316]`} />;
    case 'Rainbow':
      return <Rainbow className={`${cls} text-[#f472b6]`} />;
    case 'Sparkles':
      return <Sparkles className={`${cls} text-[#c084fc]`} />;
    case 'Wind':
      return <Wind className={`${cls} text-[#ea580c]`} />;
    case 'Flower2':
      return <Flower2 className={`${cls} text-[#10b981]`} />;
    case 'Sun':
      return <Sun className={`${cls} text-[#f59e0b]`} />;
    default:
      return <Compass className={`${cls} text-[#8b5cf6]`} />;
  }
}

function renderWeatherIcon(condition: string, cls = 'w-3.5 h-3.5') {
  if (condition.includes('Snow')) {
    return <CloudSnow className={`${cls} text-[#38bdf8]`} />;
  }
  if (condition.includes('Rain')) {
    return <Cloud className={`${cls} text-[#60a5fa]`} />;
  }
  if (condition.includes('Frost') || condition.includes('Alpine') || condition.includes('Spindrift')) {
    return <Mountain className={`${cls} text-[#93c5fd]`} />;
  }
  if (condition.includes('Sea') || condition.includes('Spray') || condition.includes('Mist')) {
    return <Waves className={`${cls} text-[#2dd4bf]`} />;
  }
  if (condition.includes('Embers') || condition.includes('Hearth')) {
    return <Flame className={`${cls} text-[#f97316]`} />;
  }
  if (condition.includes('Rainbow') || condition.includes('Shimmer')) {
    return <Rainbow className={`${cls} text-[#f472b6]`} />;
  }
  if (condition.includes('Stardust') || condition.includes('Astral')) {
    return <Sparkles className={`${cls} text-[#c084fc]`} />;
  }
  if (condition.includes('Dust') || condition.includes('Sand')) {
    return <Wind className={`${cls} text-[#fbbf24]`} />;
  }
  if (condition.includes('Clear')) {
    return <Sun className={`${cls} text-[#eab308]`} />;
  }
  return <Flower2 className={`${cls} text-[#86efac]`} />;
}

const TOOL_GROUPS: { category: Exclude<ToolCategory, 'all'>; title: string }[] = [
  { category: 'village', title: 'Village & Landmarks' },
  { category: 'water', title: 'Water & Coastal Life' },
  { category: 'nature', title: 'Nature & Life' },
  { category: 'weather', title: 'Weather & Sky' },
  { category: 'sculpt', title: 'Sculpt & Clear' },
];

function renderToolIcon(id: ToolId) {
  const cls = 'w-4 h-4 shrink-0';
  switch (id) {
    case 'tree':
      return <Trees className={cls} />;
    case 'house':
      return <Home className={cls} />;
    case 'windmill':
      return <Fan className={cls} />;
    case 'lighthouse':
      return <TowerControl className={cls} />;
    case 'watchtower':
      return <Castle className={cls} />;
    case 'campfire':
      return <Flame className={cls} />;
    case 'lantern':
      return <LampFloor className={cls} />;
    case 'balloon':
      return <Wind className={cls} />;
    case 'sailboat':
      return <Sailboat className={cls} />;
    case 'dock':
      return <Anchor className={cls} />;
    case 'duck':
      return <Bird className={cls} />;
    case 'mountain':
      return <Mountain className={cls} />;
    case 'lake':
      return <Waves className={cls} />;
    case 'flower':
      return <Flower2 className={cls} />;
    case 'beehive':
      return <Bug className={cls} />;
    case 'cloud':
      return <Cloud className={cls} />;
    case 'snowcloud':
      return <CloudSnow className={cls} />;
    case 'rainbow':
      return <Rainbow className={cls} />;
    case 'shootingstar':
      return <Sparkles className={cls} />;
    case 'villager':
      return <Users className={cls} />;
    case 'sheep':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cls}
          aria-hidden="true"
        >
          <path d="M8 15a4 4 0 0 1-2-7.5 4.5 4.5 0 0 1 8.5-1A3.5 3.5 0 0 1 18 10a3.5 3.5 0 0 1-1 6.8H8Z" />
          <path d="M9 17v3" />
          <path d="M15 17v3" />
        </svg>
      );
    case 'raise':
      return <ArrowUpFromLine className={cls} />;
    case 'lower':
      return <ArrowDownToLine className={cls} />;
    case 'remove':
      return <Eraser className={cls} />;
  }
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PocketWorldController | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [worldState, setWorldState] = useState<WorldState>({
    planetName: 'Little Meadow',
    population: 12,
    happiness: 96,
    dayCount: 1,
    activeTool: 'tree',
    activeView: 'orb',
    timeMode: 'auto',
    timeOfDay: 0.24,
    season: 'spring',
    weatherMode: 'auto',
    weatherCondition: 'Cherry Blossom Petals & Spring Pollen',
    weatherIntensity: 'moderate',
    audioEnabled: false,
    audioVolume: 0.65,
    audioTrackName: 'Meadow Birdsong & Summer Breeze',
    tourActive: false,
    tourElapsed: 0,
    tourPhase: '',
    objectCounts: {
      houses: 4,
      trees: 22,
      windmills: 1,
      lighthouses: 2,
      villagers: 12,
      sheep: 8,
      clouds: 3,
      flowers: 5,
      boats: 3,
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Snapshot capture state
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [snapshotNotification, setSnapshotNotification] = useState<string | null>(null);
  const [snapshotQuality, setSnapshotQuality] = useState<'2k' | '4k'>('2k');
  const [snapshotWatermark, setSnapshotWatermark] = useState(true);

  // Journal & Chronicle state
  const [journalOpen, setJournalOpen] = useState(false);
  const [unreadJournalCount, setUnreadJournalCount] = useState(0);
  const [journalToast, setJournalToast] = useState<JournalEntry | null>(null);
  const [journalData, setJournalData] = useState(() =>
    loadJournalData(worldState.planetName || 'Little Meadow'),
  );

  const journalEntriesRef = useRef(journalData.entries);
  const journalStatsRef = useRef(journalData.stats);
  const journalOpenRef = useRef(journalOpen);
  const planetNameRef = useRef(worldState.planetName);

  useEffect(() => {
    journalEntriesRef.current = journalData.entries;
    journalStatsRef.current = journalData.stats;
  }, [journalData]);

  useEffect(() => {
    journalOpenRef.current = journalOpen;
    if (journalOpen) {
      setUnreadJournalCount(0);
      setJournalToast(null);
    }
  }, [journalOpen]);

  useEffect(() => {
    planetNameRef.current = worldState.planetName;
  }, [worldState.planetName]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const controller = new PocketWorldController(container, setWorldState);
    controllerRef.current = controller;

    // Attach Milestone listener to record significant world events in the Journal
    controller.setOnMilestoneCallback((ctx: MilestoneContext) => {
      const result = evaluateMilestone(
        { ...ctx, planetName: planetNameRef.current },
        journalEntriesRef.current,
        journalStatsRef.current,
      );
      if (result) {
        const updatedEntries = [result.newEntry, ...journalEntriesRef.current];
        const updatedStats = result.updatedStats;
        journalEntriesRef.current = updatedEntries;
        journalStatsRef.current = updatedStats;
        setJournalData({ entries: updatedEntries, stats: updatedStats });
        saveJournalData(planetNameRef.current, updatedEntries, updatedStats);

        if (!journalOpenRef.current) {
          setUnreadJournalCount((c) => c + 1);
          setJournalToast(result.newEntry);
          setTimeout(() => {
            setJournalToast((t) => (t?.id === result.newEntry.id ? null : t));
          }, 4800);
        }
      }
    });

    const canvas = container.querySelector('canvas');
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };

    if (canvas) {
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
      }
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const handleCaptureSnapshot = async () => {
    if (!controllerRef.current || isCapturingSnapshot) return;
    setIsCapturingSnapshot(true);
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 240);

    try {
      const multiplier = snapshotQuality === '4k' ? 2.5 : 1.75;
      const res = await controllerRef.current.captureSnapshot({
        multiplier,
        planetName: worldState.planetName,
        watermark: snapshotWatermark,
      });
      setSnapshotNotification(`Saved snapshot "${res.filename}"!`);
      setTimeout(() => setSnapshotNotification(null), 3800);
    } catch (err) {
      console.error('Failed to capture snapshot:', err);
      setSnapshotNotification('Snapshot failed. Please try again.');
      setTimeout(() => setSnapshotNotification(null), 3000);
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  const handleCaptureSceneSnapshotDataUrl = async (): Promise<string | null> => {
    if (!controllerRef.current) return null;
    try {
      const res = await controllerRef.current.captureSnapshot({
        multiplier: 1.5,
        planetName: worldState.planetName,
        watermark: false,
        download: false,
      });
      return res.dataUrl;
    } catch (e) {
      console.warn('Failed to capture scene snapshot for chronicle card:', e);
      return null;
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (journalOpen) {
          setJournalOpen(false);
        } else if (filtersOpen) {
          setFiltersOpen(false);
        }
      } else if ((e.key === 's' || e.key === 'S') && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleCaptureSnapshot();
      } else if ((e.key === 'j' || e.key === 'J') && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setJournalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [journalOpen, filtersOpen, isCapturingSnapshot, snapshotQuality, snapshotWatermark, worldState.planetName]);

  const handleSelectTool = (tool: ToolId) => {
    controllerRef.current?.setTool(tool);
  };

  const handleSelectView = (view: CameraViewId) => {
    controllerRef.current?.stopTour();
    controllerRef.current?.applyCameraPreset(view);
  };

  const handleSelectTimeMode = (mode: TimeMode) => {
    controllerRef.current?.setTimeMode(mode);
  };

  const handleSelectSeason = (season: SeasonId) => {
    controllerRef.current?.setSeason(season);
  };

  const handleCycleSeason = () => {
    const seasonOrder: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
    const nextIdx = (seasonOrder.indexOf(worldState.season) + 1) % seasonOrder.length;
    controllerRef.current?.setSeason(seasonOrder[nextIdx]);
  };

  const handleSelectWeatherMode = (mode: WeatherMode) => {
    controllerRef.current?.setWeatherMode(mode);
  };

  const handleSelectWeatherIntensity = (intensity: WeatherIntensity) => {
    controllerRef.current?.setWeatherIntensity(intensity);
  };

  const handleToggleAudio = () => {
    controllerRef.current?.toggleAudio();
  };

  const handleVolumeChange = (vol: number) => {
    controllerRef.current?.setAudioVolume(vol);
  };

  const handleGrow = () => {
    controllerRef.current?.triggerGrowVillage();
  };

  const handleToggleTour = () => {
    setFiltersOpen(false);
    if (worldState.tourActive) {
      controllerRef.current?.stopTour();
    } else {
      controllerRef.current?.startTour();
    }
  };

  const orderedTools = TOOL_GROUPS.flatMap((group) =>
    TOOL_DEFINITIONS.filter((t) => t.category === group.category),
  );

  const currentSeasonInfo =
    SEASONS.find((s) => s.id === worldState.season) || SEASONS[0];
  const seasonalWeatherModes = currentSeasonInfo.allowedWeatherModes;

  return (
    <div className="flex w-screen h-screen overflow-hidden select-none bg-[#221d2b]">
      {/* Left Column: 3D Three.js Canvas Viewport */}
      <div className="relative flex-1 min-w-0 h-full">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D Pocket World Terrarium Planet"
        />

        {/* Shutter Flash Animation */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-40 bg-white/70 pointer-events-none transition-opacity duration-200 ${
            snapshotFlash ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Snapshot Download Toast Notification */}
        {snapshotNotification && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-16 left-4 z-30 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#2b2138]/95 border border-[#a855f7]/40 text-[#f5effc] shadow-2xl backdrop-blur-sm transition-all"
          >
            <Check className="w-4 h-4 text-[#4ade80] shrink-0" />
            <span className="text-xs font-mono tracking-tight">{snapshotNotification}</span>
          </div>
        )}

        {/* Floating Spec Badge & Live Weather Indicator */}
        {!worldState.tourActive && (
          <header className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1927]/90 border border-white/12 text-white/90 hover:bg-[#2c2438] hover:border-white/20 transition-all shadow-lg cursor-pointer"
              title="Click to open atmosphere, lighting, and world controls"
            >
              <span className="font-display font-medium text-xs tracking-wide text-[#f5eedc]">
                {worldState.planetName}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-[#d8cde6]">
                {renderWeatherIcon(worldState.weatherCondition, 'w-3 h-3')}
                <span className="font-medium">{worldState.weatherCondition}</span>
                {worldState.weatherMode === 'auto' ? (
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-white/10 text-white/70 uppercase tracking-wider font-mono">
                    Auto
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-[#38bdf8]/20 text-[#7dd3fc] uppercase tracking-wider font-mono">
                    {worldState.weatherMode}
                  </span>
                )}
              </div>
            </button>

            {/* Season Pill Switcher */}
            <button
              type="button"
              onClick={handleCycleSeason}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-tabular transition-all shadow-lg cursor-pointer active:scale-95 ${
                worldState.season === 'autumn'
                  ? 'bg-[#3d1f0f]/95 border-[#f97316]/40 text-[#fed7aa] hover:bg-[#4d2713]'
                  : worldState.season === 'winter'
                  ? 'bg-[#10233b]/95 border-[#38bdf8]/40 text-[#bae6fd] hover:bg-[#152e4e]'
                  : worldState.season === 'summer'
                  ? 'bg-[#3b2a0c]/95 border-[#f59e0b]/40 text-[#fde68a] hover:bg-[#4b350f]'
                  : 'bg-[#132c1e]/95 border-[#34d399]/40 text-[#a7f3d0] hover:bg-[#183927]'
              }`}
              title={`Active season: ${currentSeasonInfo.name} (${currentSeasonInfo.tagline}). Click to cycle seasons.`}
              aria-label={`Current season: ${currentSeasonInfo.name}`}
            >
              <span className="text-xs">{currentSeasonInfo.emoji}</span>
              <span className="hidden sm:inline font-sans text-[11px] font-medium">
                {currentSeasonInfo.name}
              </span>
            </button>

            {/* Audio Ambient Nature Soundscape Toggle */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-tabular transition-all shadow-lg cursor-pointer ${
                worldState.audioEnabled
                  ? 'bg-[#1a382b]/95 border-[#34d399]/40 text-[#a7f3d0] hover:bg-[#204535]'
                  : 'bg-[#1e1927]/90 border-white/12 text-white/70 hover:bg-[#2c2438] hover:text-white/95'
              }`}
              title={
                worldState.audioEnabled
                  ? `Nature audio active: ${worldState.audioTrackName}. Click to mute.`
                  : 'Click to play ambient nature sounds (wind, birds, rain)'
              }
              aria-label={worldState.audioEnabled ? 'Mute ambient nature sounds' : 'Play ambient nature sounds'}
            >
              {worldState.audioEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                  <span className="hidden sm:inline font-sans text-[11px] font-medium text-[#d1fae5]">
                    Nature Audio
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/45 shrink-0" />
                  <span className="hidden sm:inline font-sans text-[11px] text-white/60">
                    Audio Off
                  </span>
                </>
              )}
            </button>

            {/* Capture Snapshot Button */}
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              disabled={isCapturingSnapshot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-tabular transition-all shadow-lg cursor-pointer active:scale-95 ${
                isCapturingSnapshot
                  ? 'bg-[#3b2b48] border-[#a855f7]/60 text-[#e9d5ff]'
                  : 'bg-[#1e1927]/90 border-white/12 text-white/80 hover:bg-[#2c2438] hover:text-white/100'
              }`}
              title="Capture high-resolution snapshot (Press 'S')"
              aria-label="Capture high-resolution snapshot"
            >
              <Camera className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
              <span className="hidden sm:inline font-sans text-[11px] font-medium text-[#f3e8ff]">
                {isCapturingSnapshot ? 'Capturing...' : 'Snapshot'}
              </span>
            </button>

            {/* Planet Chronicle & Journal Overlay Button */}
            <button
              type="button"
              onClick={() => {
                setJournalOpen(true);
                setUnreadJournalCount(0);
                setJournalToast(null);
              }}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono-tabular transition-all shadow-lg cursor-pointer bg-[#1e1927]/90 border-white/12 text-white/80 hover:bg-[#2c2438] hover:text-white/100 active:scale-95"
              title="Open Planet Chronicle & Journal (Press 'J')"
              aria-label="Open Planet Chronicle & Journal"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
              <span className="hidden sm:inline font-sans text-[11px] font-medium text-[#fef3c7]">
                Journal
              </span>
              {unreadJournalCount > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold rounded-full bg-[#f59e0b] text-[#2f1b04] animate-pulse">
                  {unreadJournalCount}
                </span>
              )}
            </button>
          </header>
        )}

        {/* Live Milestone Toast Notification */}
        <AnimatePresence>
          {journalToast && !journalOpen && (
            <motion.aside
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              aria-label="New Journal Milestone Notification"
              className="absolute top-16 right-4 sm:right-6 z-40 max-w-sm w-full pointer-events-auto"
            >
              <div
                onClick={() => {
                  setJournalOpen(true);
                  setUnreadJournalCount(0);
                  setJournalToast(null);
                }}
                role="button"
                tabIndex={0}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#2a221b]/95 text-[#fbf7ee] border border-[#f59e0b]/45 shadow-2xl backdrop-blur-md cursor-pointer hover:bg-[#382e25] transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#fcd34d] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MilestoneBadge entry={journalToast} size="sm" showSublabel={false} />
                    <span className="text-[10px] text-[#baa897]">•</span>
                    <span className="text-[10px] text-[#baa897]">Just now</span>
                  </div>
                  <div className="text-xs font-serif font-semibold text-[#fef3c7] truncate mt-0.5">
                    {journalToast.title}
                  </div>
                  <div className="text-[11px] text-[#d1c2b0] line-clamp-1 mt-0.5">
                    {journalToast.description}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setJournalToast(null);
                  }}
                  className="text-[#9e8d7d] hover:text-[#fbf7ee] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* WebGL Context Lost Fallback */}
        {webglLost && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#231e2d]/90 text-[#faf6ee]">
            <div className="max-w-md p-6 text-center bg-[#322b3f] rounded-xl border border-white/10">
              <h2 className="text-xl font-semibold mb-2">
                Terrarium Viewport Paused
              </h2>
              <p className="text-sm text-[#d6cee2]">
                The 3D WebGL context was interrupted. Reload or restore the tab
                to resume inspecting {worldState.planetName}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Desktop Thin Icon-Only Side Panel (Hidden on mobile and during 30s Tour) */}
      {!worldState.tourActive && (
        <aside
          aria-label="Terrarium controls and tool dock"
          className="hidden md:flex w-16 shrink-0 h-full bg-[#faf5ec] border-l border-[#e2d7c5] text-[#382f27] flex-col items-center py-3 gap-2.5 z-20"
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            title="Filters"
            aria-label="Open Filters"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] hover:bg-[#4d4136] active:scale-95 transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleToggleAudio}
            title={worldState.audioEnabled ? `Mute nature sounds (${worldState.audioTrackName})` : 'Play ambient nature sounds'}
            aria-label={worldState.audioEnabled ? 'Mute nature sounds' : 'Play nature sounds'}
            className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer active:scale-95 ${
              worldState.audioEnabled
                ? 'bg-[#d1fae5] border-[#86efac] text-[#065f46] shadow-xs'
                : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
            }`}
          >
            {worldState.audioEnabled ? (
              <Volume2 className="w-4 h-4 shrink-0 text-[#059669]" />
            ) : (
              <VolumeX className="w-4 h-4 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            disabled={isCapturingSnapshot}
            title="Capture high-resolution snapshot (S)"
            aria-label="Capture snapshot"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-[#d8c3e8] bg-[#f4ebfa] text-[#6b21a8] hover:bg-[#ebdcf4] hover:text-[#581c87] active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              setJournalOpen(true);
              setUnreadJournalCount(0);
              setJournalToast(null);
            }}
            title="Planet Chronicle & Journal (J)"
            aria-label="Open Planet Journal"
            className="relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border border-[#d8c7ad] bg-[#fbf5eb] text-[#854d0e] hover:bg-[#f6ebd7] active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-[#b45309]" />
            {unreadJournalCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#f59e0b] text-[#2f1b04] text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
                {unreadJournalCount}
              </span>
            )}
          </button>

          <div className="w-8 h-px bg-[#e2d7c5] shrink-0" aria-hidden="true" />

          <div
            className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar py-0.5"
            role="toolbar"
            aria-orientation="vertical"
            aria-label="World building tools"
          >
            {orderedTools.map((tool) => {
              const isSelected = worldState.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  title={tool.label}
                  aria-label={tool.label}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs`
                      : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                  }`}
                >
                  {renderToolIcon(tool.id)}
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Desktop Modal for Filters (Planet Info, Grow & 30s Tour, Camera View, Lighting & Sky) */}
      <AnimatePresence>
        {!worldState.tourActive && filtersOpen && (
          <div className="hidden md:flex fixed inset-0 z-40 items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{
                type: 'spring',
                damping: 26,
                stiffness: 330,
                mass: 0.85,
              }}
              className="relative z-10 w-full max-w-sm max-h-[85vh] bg-[#faf5ec] text-[#382f27] rounded-2xl border border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
            >
            <div className="px-4 py-3 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close Filters"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5 overflow-y-auto">
              {/* 1. Planet Identity & Live Stats */}
              <section className="flex flex-col gap-1.5 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between gap-2">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={worldState.planetName}
                      maxLength={28}
                      onChange={(e) =>
                        setWorldState((prev) => ({
                          ...prev,
                          planetName: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (!worldState.planetName.trim()) {
                          setWorldState((prev) => ({
                            ...prev,
                            planetName: 'Little Meadow',
                          }));
                        }
                        setIsEditingName(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          nameInputRef.current?.blur();
                        }
                      }}
                      aria-label="Planet Name"
                      className="w-full px-2 py-0.5 text-lg font-semibold bg-[#fffdf9] border border-[#cbbba3] rounded text-[#2b221b] focus:outline-none focus:ring-2 focus:ring-[#a6cfa0]"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="group flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                      title="Click to rename planet"
                    >
                      <h3 className="text-lg font-semibold tracking-tight text-[#2b221b] group-hover:text-[#4e6e3a] transition-colors">
                        {worldState.planetName}
                      </h3>
                      <Pencil className="w-3.5 h-3.5 text-[#8c7d6b] opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#594d40] font-mono-tabular">
                  <span>
                    Pop{' '}
                    <strong className="font-semibold text-[#2b221b]">
                      {worldState.population}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Happy{' '}
                    <strong className="font-semibold text-[#2e5926]">
                      {worldState.happiness}%
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Day{' '}
                    <strong className="font-semibold text-[#2b221b]">
                      {worldState.dayCount}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#695b4c] font-mono-tabular pt-0.5">
                  <span>{worldState.objectCounts.houses} Homes</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.trees} Trees</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.boats} Boats</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.sheep} Sheep</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.clouds} Clouds</span>
                </div>
              </section>

              {/* 2. Terrarium Seasons & Foliage */}
              <section className="flex flex-col gap-2 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Terrarium Season & Foliage
                  </h3>
                  <span className="text-[11px] font-mono font-medium text-[#2b221b]">
                    {currentSeasonInfo.emoji} {currentSeasonInfo.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SEASONS.map((s) => {
                    const active = worldState.season === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSeason(s.id)}
                        className={`flex flex-col gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                          active
                            ? `${s.bgLight} ${s.borderLight} ${s.textDark} shadow-xs ring-1 ring-black/5`
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold font-mono px-1.5 py-0.5 rounded-full bg-white/70">
                            {s.badge}
                          </span>
                        </div>
                        <span className="text-xs font-semibold">{s.name}</span>
                        <span className="text-[10px] leading-tight opacity-75 line-clamp-2">
                          {s.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 3. Primary Actions: Grow & 30s Tour */}
              <section className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGrow}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#23451e] bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] rounded-xl transition-colors cursor-pointer"
                  title="Advance village development with new homes, paths, and trees"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Grow</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTour}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[#382f27] text-[#fcf8f0] border-[#261f19] hover:bg-[#4d4136] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>30s Tour</span>
                </button>
              </section>

              {/* 3. Camera Views */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  Camera View
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'orb', label: 'Orb' },
                      { id: 'surface', label: 'Surface' },
                      { id: 'orbit', label: 'Orbit' },
                      { id: 'village', label: 'Village' },
                    ] as { id: CameraViewId; label: string }[]
                  ).map((v) => {
                    const active =
                      worldState.activeView === v.id && !worldState.tourActive;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectView(v.id)}
                        className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4. Lighting & Time of Day */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  Lighting & Sky
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        id: 'auto',
                        label: 'Cycle',
                        icon: <Compass className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'day',
                        label: 'Day',
                        icon: <Sun className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'twilight',
                        label: 'Twilight',
                        icon: <Sunset className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'night',
                        label: 'Night',
                        icon: <Moon className="w-3.5 h-3.5" />,
                      },
                    ] as { id: TimeMode; label: string; icon: React.ReactNode }[]
                  ).map((m) => {
                    const active = worldState.timeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectTimeMode(m.id)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e1ecf7] text-[#264669] border-[#a4c2e3] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 5. Atmosphere & Weather Particles */}
              <section className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Atmosphere & Weather
                  </h3>
                  <span className="text-[10px] text-[#8c7d6b] font-medium font-mono-tabular">
                    {worldState.weatherCondition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {seasonalWeatherModes.map((m) => {
                    const active = worldState.weatherMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectWeatherMode(m.id)}
                        title={m.sublabel}
                        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer text-left ${
                          active
                            ? 'bg-[#e1ecf7] text-[#1e4b6e] border-[#9ec8e8] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {renderWeatherOptionIcon(m.iconName)}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-semibold">{m.label}</span>
                          <span className="text-[9px] text-[#786b5c] truncate">{m.sublabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#7a6b5a]">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Particle Density
                  </span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'gentle', label: 'Gentle' },
                        { id: 'moderate', label: 'Medium' },
                        { id: 'dense', label: 'Dense' },
                      ] as { id: WeatherIntensity; label: string }[]
                    ).map((lvl) => {
                      const active = worldState.weatherIntensity === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSelectWeatherIntensity(lvl.id)}
                          className={`px-2 py-1 text-[10px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#382f27] text-[#fcf8f0] border-[#261f19]'
                              : 'bg-[#f3ede2] border-[#e2d7c5] text-[#594d40] hover:bg-[#eae1d3]'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* 6. Ambient Nature Sounds */}
              <section className="flex flex-col gap-2.5 pt-2 border-t border-[#e6dccb]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Ambient Nature Audio
                  </h3>
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      worldState.audioEnabled
                        ? 'bg-[#d1fae5] border-[#86efac] text-[#065f46]'
                        : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3]'
                    }`}
                  >
                    {worldState.audioEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Mute</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Turn On</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f5ede0] border border-[#e2d6c2] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {worldState.audioEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#8c7d6b] shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8c7d6b]">
                        Active Soundscape
                      </span>
                      <span className="text-xs font-medium text-[#2b221b] truncate">
                        {worldState.audioEnabled ? worldState.audioTrackName : 'Audio Muted'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-[#e2d6c2]/80">
                    <Volume1 className="w-3.5 h-3.5 text-[#8c7d6b] shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={worldState.audioVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-[#dcd0be] rounded-lg appearance-none cursor-pointer accent-[#382f27]"
                      aria-label="Soundscape Volume"
                    />
                    <span className="text-[10px] font-mono-tabular text-[#695b4c] w-8 text-right">
                      {Math.round(worldState.audioVolume * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-[#8c7d6b] leading-tight">
                  Procedural Web Audio soundscapes (gentle wind, birdsong, rainfall, waves, campfire embers) that automatically shift as you select biome tools.
                </p>
              </section>

              {/* 7. Terrarium Snapshot Export */}
              <section className="flex flex-col gap-2.5 pt-2 border-t border-[#e6dccb]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Terrarium Snapshot
                  </h3>
                  <span className="text-[10px] font-mono text-[#8c7d6b]">PNG Export</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f5ede0] border border-[#e2d6c2] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#594d40] font-medium">Export Quality</span>
                    <div className="inline-flex p-0.5 rounded-lg bg-[#e8ded0] border border-[#d6c8b4]">
                      <button
                        type="button"
                        onClick={() => setSnapshotQuality('2k')}
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          snapshotQuality === '2k'
                            ? 'bg-[#ffffff] text-[#2b221b] shadow-xs font-semibold'
                            : 'text-[#695b4c] hover:text-[#2b221b]'
                        }`}
                      >
                        2K (FHD+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSnapshotQuality('4k')}
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          snapshotQuality === '4k'
                            ? 'bg-[#ffffff] text-[#2b221b] shadow-xs font-semibold'
                            : 'text-[#695b4c] hover:text-[#2b221b]'
                        }`}
                      >
                        4K Ultra
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-[#594d40] font-medium">Include Terrarium Stamp</span>
                    <input
                      type="checkbox"
                      checked={snapshotWatermark}
                      onChange={(e) => setSnapshotWatermark(e.target.checked)}
                      className="w-4 h-4 rounded border-[#cbbba3] text-[#6b21a8] focus:ring-[#c084fc] accent-[#6b21a8] cursor-pointer"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturingSnapshot}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#6b21a8] hover:bg-[#581c87] text-[#faf5ec] text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isCapturingSnapshot ? 'Generating Snapshot...' : 'Save High-Res Snapshot'}</span>
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Mobile Bottom Bar: Filters Button + Scrollable Row of Square Icon-Only Tool Buttons */}
      {!worldState.tourActive && (
        <div
          aria-label="Mobile tool dock"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#faf5ec]/95 backdrop-blur-md border-t border-[#e2d7c5] px-3 py-2.5 flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="h-11 px-3.5 shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-[#382f27] text-[#fcf8f0] border border-[#261f19] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            aria-label="Open Filters"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={handleToggleAudio}
            className={`h-11 px-3 shrink-0 flex items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold cursor-pointer active:scale-95 transition-transform ${
              worldState.audioEnabled
                ? 'bg-[#d1fae5] border-[#86efac] text-[#065f46]'
                : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c]'
            }`}
            aria-label={worldState.audioEnabled ? 'Mute nature sounds' : 'Play nature sounds'}
            title={worldState.audioEnabled ? `Mute nature sounds (${worldState.audioTrackName})` : 'Play nature sounds'}
          >
            {worldState.audioEnabled ? (
              <Volume2 className="w-4 h-4 shrink-0 text-[#059669]" />
            ) : (
              <VolumeX className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden xs:inline">{worldState.audioEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureSnapshot}
            disabled={isCapturingSnapshot}
            className="h-11 px-3 shrink-0 flex items-center justify-center gap-1.5 rounded-xl border border-[#d8c3e8] bg-[#f4ebfa] text-[#6b21a8] text-xs font-semibold cursor-pointer active:scale-95 transition-transform"
            aria-label="Capture snapshot"
            title="Capture snapshot"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">{isCapturingSnapshot ? 'Saving...' : 'Snap'}</span>
          </button>

          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 pr-1"
            role="toolbar"
            aria-label="World building tools"
          >
            {orderedTools.map((tool) => {
              const isSelected = worldState.activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleSelectTool(tool.id)}
                  title={tool.label}
                  aria-label={tool.label}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? `${tool.accentBg} ${tool.accentBorder} ${tool.accentText} shadow-xs`
                      : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                  }`}
                >
                  {renderToolIcon(tool.id)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet for Filters (Camera View, Lighting & Sky, World Info & Actions) */}
      <AnimatePresence>
        {!worldState.tourActive && filtersOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setFiltersOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 310,
              }}
              className="relative z-10 w-full max-h-[80vh] bg-[#faf5ec] text-[#382f27] rounded-t-3xl border-t border-[#e2d7c5] flex flex-col overflow-hidden shadow-2xl"
            >
            <div className="w-10 h-1.5 bg-[#d6c8b4] rounded-full mx-auto mt-3 mb-1 shrink-0" />
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#e6dccb] shrink-0">
              <h2 className="text-sm font-semibold text-[#2b221b]">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close Filters"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#594d40] hover:bg-[#eae1d3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-5 overflow-y-auto">
              {/* Planet Identity & Stats */}
              <section className="flex flex-col gap-1.5 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-[#2b221b]">
                    {worldState.planetName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-[#594d40] font-mono-tabular">
                    <span>
                      Pop <strong className="font-semibold text-[#2b221b]">{worldState.population}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Happy <strong className="font-semibold text-[#2e5926]">{worldState.happiness}%</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Day <strong className="font-semibold text-[#2b221b]">{worldState.dayCount}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-[#695b4c] font-mono-tabular">
                  <span>{worldState.objectCounts.houses} Homes</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.trees} Trees</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.boats} Boats</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.sheep} Sheep</span>
                  <span aria-hidden="true">·</span>
                  <span>{worldState.objectCounts.clouds} Clouds</span>
                </div>
              </section>

              {/* Terrarium Seasons & Foliage */}
              <section className="flex flex-col gap-2 pb-3 border-b border-[#e6dccb]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Terrarium Season & Foliage
                  </h3>
                  <span className="text-[11px] font-mono font-medium text-[#2b221b]">
                    {currentSeasonInfo.emoji} {currentSeasonInfo.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {SEASONS.map((s) => {
                    const active = worldState.season === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSeason(s.id)}
                        className={`flex flex-col gap-1 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                          active
                            ? `${s.bgLight} ${s.borderLight} ${s.textDark} shadow-xs ring-1 ring-black/5`
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{s.emoji}</span>
                          <span className="text-[9px] uppercase tracking-wider font-semibold font-mono px-1.5 py-0.5 rounded-full bg-white/70">
                            {s.badge}
                          </span>
                        </div>
                        <span className="text-xs font-semibold">{s.name}</span>
                        <span className="text-[10px] leading-tight opacity-75 line-clamp-2">
                          {s.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Primary Actions: Grow & 30s Tour */}
              <section className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGrow}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#23451e] bg-[#d4ebc8] hover:bg-[#c5e3b5] border border-[#a3cf8e] rounded-xl transition-colors cursor-pointer"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Grow</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleTour}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[#382f27] text-[#fcf8f0] border-[#261f19] hover:bg-[#4d4136] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>30s Tour</span>
                </button>
              </section>

              {/* Camera View */}
              <section className="flex flex-col gap-1.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  Camera View
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'orb', label: 'Orb' },
                      { id: 'surface', label: 'Surface' },
                      { id: 'orbit', label: 'Orbit' },
                      { id: 'village', label: 'Village' },
                    ] as { id: CameraViewId; label: string }[]
                  ).map((v) => {
                    const active =
                      worldState.activeView === v.id && !worldState.tourActive;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectView(v.id)}
                        className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e3eedc] text-[#23451e] border-[#a6cfa0] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Lighting & Sky */}
              <section className="flex flex-col gap-1.5 pb-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                  Lighting & Sky
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      {
                        id: 'auto',
                        label: 'Cycle',
                        icon: <Compass className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'day',
                        label: 'Day',
                        icon: <Sun className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'twilight',
                        label: 'Twilight',
                        icon: <Sunset className="w-3.5 h-3.5" />,
                      },
                      {
                        id: 'night',
                        label: 'Night',
                        icon: <Moon className="w-3.5 h-3.5" />,
                      },
                    ] as { id: TimeMode; label: string; icon: React.ReactNode }[]
                  ).map((m) => {
                    const active = worldState.timeMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectTimeMode(m.id)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e1ecf7] text-[#264669] border-[#a4c2e3] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Atmosphere & Weather Particles */}
              <section className="flex flex-col gap-2 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Atmosphere & Weather
                  </h3>
                  <span className="text-[10px] text-[#8c7d6b] font-medium font-mono-tabular">
                    {worldState.weatherCondition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {seasonalWeatherModes.map((m) => {
                    const active = worldState.weatherMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectWeatherMode(m.id)}
                        title={m.sublabel}
                        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer text-left ${
                          active
                            ? 'bg-[#e1ecf7] text-[#1e4b6e] border-[#9ec8e8] shadow-xs'
                            : 'bg-[#f3ede2] border-transparent text-[#594d40] hover:bg-[#eae1d3] hover:text-[#2b221b]'
                        }`}
                      >
                        {renderWeatherOptionIcon(m.iconName)}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate font-semibold">{m.label}</span>
                          <span className="text-[9px] text-[#786b5c] truncate">{m.sublabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#7a6b5a]">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Particle Density
                  </span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'gentle', label: 'Gentle' },
                        { id: 'moderate', label: 'Medium' },
                        { id: 'dense', label: 'Dense' },
                      ] as { id: WeatherIntensity; label: string }[]
                    ).map((lvl) => {
                      const active = worldState.weatherIntensity === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSelectWeatherIntensity(lvl.id)}
                          className={`px-2 py-1 text-[10px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#382f27] text-[#fcf8f0] border-[#261f19]'
                              : 'bg-[#f3ede2] border-[#e2d7c5] text-[#594d40] hover:bg-[#eae1d3]'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Ambient Nature Sounds */}
              <section className="flex flex-col gap-2.5 pt-2 border-t border-[#e6dccb] pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Ambient Nature Audio
                  </h3>
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      worldState.audioEnabled
                        ? 'bg-[#d1fae5] border-[#86efac] text-[#065f46]'
                        : 'bg-[#f3ede2] border-[#e2d7c5] text-[#54483c] hover:bg-[#eae1d3]'
                    }`}
                  >
                    {worldState.audioEnabled ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Mute</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Turn On</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f5ede0] border border-[#e2d6c2] flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {worldState.audioEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#8c7d6b] shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8c7d6b]">
                        Active Soundscape
                      </span>
                      <span className="text-xs font-medium text-[#2b221b] truncate">
                        {worldState.audioEnabled ? worldState.audioTrackName : 'Audio Muted'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-[#e2d6c2]/80">
                    <Volume1 className="w-3.5 h-3.5 text-[#8c7d6b] shrink-0" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={worldState.audioVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-[#dcd0be] rounded-lg appearance-none cursor-pointer accent-[#382f27]"
                      aria-label="Soundscape Volume"
                    />
                    <span className="text-[10px] font-mono-tabular text-[#695b4c] w-8 text-right">
                      {Math.round(worldState.audioVolume * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-[#8c7d6b] leading-tight">
                  Procedural Web Audio soundscapes (gentle wind, birdsong, rainfall, waves, campfire embers) that automatically shift as you select biome tools.
                </p>
              </section>

              {/* Terrarium Snapshot Export */}
              <section className="flex flex-col gap-2.5 pt-2 border-t border-[#e6dccb] pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#7a6b5a]">
                    Terrarium Snapshot
                  </h3>
                  <span className="text-[10px] font-mono text-[#8c7d6b]">PNG Export</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f5ede0] border border-[#e2d6c2] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#594d40] font-medium">Export Quality</span>
                    <div className="inline-flex p-0.5 rounded-lg bg-[#e8ded0] border border-[#d6c8b4]">
                      <button
                        type="button"
                        onClick={() => setSnapshotQuality('2k')}
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          snapshotQuality === '2k'
                            ? 'bg-[#ffffff] text-[#2b221b] shadow-xs font-semibold'
                            : 'text-[#695b4c] hover:text-[#2b221b]'
                        }`}
                      >
                        2K
                      </button>
                      <button
                        type="button"
                        onClick={() => setSnapshotQuality('4k')}
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          snapshotQuality === '4k'
                            ? 'bg-[#ffffff] text-[#2b221b] shadow-xs font-semibold'
                            : 'text-[#695b4c] hover:text-[#2b221b]'
                        }`}
                      >
                        4K Ultra
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="text-[#594d40] font-medium">Include Terrarium Stamp</span>
                    <input
                      type="checkbox"
                      checked={snapshotWatermark}
                      onChange={(e) => setSnapshotWatermark(e.target.checked)}
                      className="w-4 h-4 rounded border-[#cbbba3] text-[#6b21a8] focus:ring-[#c084fc] accent-[#6b21a8] cursor-pointer"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturingSnapshot}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#6b21a8] hover:bg-[#581c87] text-[#faf5ec] text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isCapturingSnapshot ? 'Generating Snapshot...' : 'Save High-Res Snapshot'}</span>
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Naturalist Archival Journal & Chronicle Overlay */}
      <JournalOverlay
        isOpen={journalOpen}
        onClose={() => setJournalOpen(false)}
        entries={journalData.entries}
        stats={journalData.stats}
        planetName={worldState.planetName}
        dayCount={worldState.dayCount}
        timeOfDay={worldState.timeOfDay}
        season={worldState.season}
        population={worldState.population}
        happiness={worldState.happiness}
        onAddNote={(newEntry) => {
          const updated = [newEntry, ...journalData.entries];
          setJournalData((prev) => ({ ...prev, entries: updated }));
          journalEntriesRef.current = updated;
          saveJournalData(planetNameRef.current, updated, journalData.stats);
        }}
        onDeleteEntry={(id) => {
          const updated = journalData.entries.filter((e) => e.id !== id);
          setJournalData((prev) => ({ ...prev, entries: updated }));
          journalEntriesRef.current = updated;
          saveJournalData(planetNameRef.current, updated, journalData.stats);
        }}
        onImportJournal={(importedEntries, importedStats, importedPlanetName) => {
          setJournalData({
            entries: importedEntries,
            stats: importedStats,
          });
          journalEntriesRef.current = importedEntries;
          journalStatsRef.current = importedStats;
          saveJournalData(planetNameRef.current, importedEntries, importedStats);
          if (
            importedPlanetName &&
            importedPlanetName.trim() &&
            importedPlanetName !== 'Imported Planet' &&
            importedPlanetName !== worldState.planetName
          ) {
            setWorldState((prev) => ({ ...prev, planetName: importedPlanetName.trim() }));
            planetNameRef.current = importedPlanetName.trim();
          }
        }}
        onCaptureSceneSnapshot={handleCaptureSceneSnapshotDataUrl}
      />
    </div>
  );
}
