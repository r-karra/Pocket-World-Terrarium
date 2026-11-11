import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  CloudSnow,
  Copy,
  Download,
  Eye,
  FileJson,
  Filter,
  Flame,
  Home,
  LineChart,
  Map,
  Moon,
  Mountain,
  Plus,
  Rainbow,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  Trees,
  Trophy,
  Upload,
  Users,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  JournalCategory,
  JournalEntry,
  JournalExportData,
  JournalStats,
  SeasonId,
} from '../types/world';
import {
  createCustomFieldNote,
  exportChronicleMarkdown,
  exportJournalJSON,
  formatTimeOfDayLabel,
  mergeJournalEntries,
  mergeJournalStats,
  parseAndValidateJournalJSON,
} from '../utils/journalManager';
import {
  generateWorldChronicleCard,
  GeneratedChronicleCard,
} from '../utils/chronicleImageGenerator';
import { MilestoneBadge, getMilestoneInfo } from './MilestoneBadge';
import { JournalStatsView } from './JournalStatsView';

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-[#fed7aa] text-[#7c2d12] font-semibold rounded-xs px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function getTagIcon(tag: string, className = 'w-3 h-3'): React.ReactNode {
  const norm = tag.toLowerCase();
  switch (norm) {
    case 'discovery':
      return <Map className={className} />;
    case 'milestone':
      return <Trophy className={className} />;
    case 'record':
      return <Award className={className} />;
    case 'observation':
      return <Eye className={className} />;
    case 'event':
    default:
      return <Sparkles className={className} />;
  }
}

export function getTagStyle(tag: string, isActive = false): string {
  const norm = tag.toLowerCase();
  if (isActive) {
    switch (norm) {
      case 'discovery':
        return 'bg-[#0284c7] text-[#f0f9ff] border-[#0369a1] font-bold shadow-xs';
      case 'milestone':
        return 'bg-[#b45309] text-[#fef3c7] border-[#92400e] font-bold shadow-xs';
      case 'record':
        return 'bg-[#be185d] text-[#fdf2f8] border-[#9d174d] font-bold shadow-xs';
      case 'observation':
        return 'bg-[#059669] text-[#ecfdf5] border-[#047857] font-bold shadow-xs';
      case 'event':
      default:
        return 'bg-[#3b2f27] text-[#fef3c7] border-[#2b2118] font-bold shadow-xs';
    }
  }

  switch (norm) {
    case 'discovery':
      return 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] hover:bg-[#bae6fd] hover:text-[#0c4a6e]';
    case 'milestone':
      return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] hover:bg-[#fde68a] hover:text-[#78350f]';
    case 'record':
      return 'bg-[#fce7f3] text-[#9d174d] border-[#fbcfe8] hover:bg-[#fbcfe8] hover:text-[#831843]';
    case 'observation':
      return 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0] hover:bg-[#a7f3d0] hover:text-[#064e3b]';
    case 'event':
    default:
      return 'bg-[#ede5d6] text-[#615141] border-[#ded2be] hover:bg-[#e2d6c3] hover:text-[#2b221b]';
  }
}

interface JournalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  stats: JournalStats;
  planetName: string;
  dayCount: number;
  timeOfDay: number;
  season: SeasonId;
  population?: number;
  happiness?: number;
  onAddNote: (newEntry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onImportJournal: (
    importedEntries: JournalEntry[],
    importedStats: JournalStats,
    importedPlanetName?: string,
  ) => void;
  onCaptureSceneSnapshot?: () => Promise<string | null>;
}

export function JournalOverlay({
  isOpen,
  onClose,
  entries,
  stats,
  planetName,
  dayCount,
  timeOfDay,
  season,
  population,
  happiness,
  onAddNote,
  onDeleteEntry,
  onImportJournal,
  onCaptureSceneSnapshot,
}: JournalOverlayProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'stats'>('timeline');
  const [selectedCategory, setSelectedCategory] = useState<
    JournalCategory | 'all'
  >('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [showTagFilters, setShowTagFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isComposingNote, setIsComposingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareModalCard, setShareModalCard] = useState<GeneratedChronicleCard | null>(null);
  const [copiedShareFeedback, setCopiedShareFeedback] = useState(false);
  const [importModalData, setImportModalData] = useState<JournalExportData | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Focus search input when pressing '/' shortcut while overlay is open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered and sorted entries
  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    if (selectedTag !== 'all') {
      list = list.filter((e) => e.tags && e.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.badge.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.season.toLowerCase().includes(q) ||
          e.timeOfDayLabel.toLowerCase().includes(q) ||
          (e.realTimestamp && e.realTimestamp.toLowerCase().includes(q)) ||
          (e.numericRecord &&
            (e.numericRecord.value.toString().includes(q) ||
              e.numericRecord.type.toLowerCase().includes(q))) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))),
      );
    }

    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );

    return list;
  }, [entries, selectedCategory, selectedTag, searchQuery, sortOrder]);

  const isFiltered =
    selectedCategory !== 'all' ||
    selectedTag !== 'all' ||
    Boolean(searchQuery.trim());

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: entries.length,
      Milestone: 0,
      Event: 0,
      Discovery: 0,
      Record: 0,
      Observation: 0,
    };
    entries.forEach((e) => {
      e.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [entries]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: entries.length,
      milestone: 0,
      record: 0,
      biome: 0,
      weather: 0,
      village: 0,
      note: 0,
    };
    entries.forEach((e) => {
      if (counts[e.category] !== undefined) {
        counts[e.category] += 1;
      }
    });
    return counts;
  }, [entries]);

  const handleCopyChronicle = async () => {
    try {
      const md = exportChronicleMarkdown(planetName, entries, stats);
      await navigator.clipboard.writeText(md);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2600);
    } catch (err) {
      console.error('Failed to copy chronicle:', err);
    }
  };

  const handleExportJSON = () => {
    try {
      exportJournalJSON(planetName, entries, stats);
      setExportFeedback(true);
      setStatusBanner({
        type: 'success',
        message: `Exported ${entries.length} chronicle events to JSON file!`,
      });
      setTimeout(() => setExportFeedback(false), 2600);
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      console.error('Failed to export journal JSON:', err);
      setStatusBanner({ type: 'error', message: 'Failed to export journal JSON.' });
      setTimeout(() => setStatusBanner(null), 4000);
    }
  };

  const handleGenerateChronicleShare = async () => {
    if (isGeneratingShare) return;
    setIsGeneratingShare(true);
    setStatusBanner({
      type: 'success',
      message: 'Generating stylized World Chronicle social card with recent milestones...',
    });

    try {
      let sceneSnapshot: string | null = null;
      if (onCaptureSceneSnapshot) {
        try {
          sceneSnapshot = await onCaptureSceneSnapshot();
        } catch (snapErr) {
          console.warn('Could not capture 3D viewport snapshot for chronicle card:', snapErr);
        }
      }

      const card = await generateWorldChronicleCard({
        planetName,
        dayCount,
        season,
        timeOfDayLabel: formatTimeOfDayLabel(timeOfDay),
        entries,
        stats,
        sceneSnapshotDataUrl: sceneSnapshot,
      });

      setShareModalCard(card);
      setStatusBanner({
        type: 'success',
        message: `World Chronicle card ready! Top ${card.topMilestones.length} milestones chronicled.`,
      });
      setTimeout(() => setStatusBanner(null), 4000);
    } catch (err) {
      console.error('Failed to generate chronicle card:', err);
      setStatusBanner({
        type: 'error',
        message: 'Could not generate chronicle share image. Please try again.',
      });
      setTimeout(() => setStatusBanner(null), 4000);
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const handleDownloadShareCard = () => {
    if (!shareModalCard) return;
    const link = document.createElement('a');
    link.download = shareModalCard.filename;
    link.href = shareModalCard.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyShareCard = async () => {
    if (!shareModalCard) return;
    try {
      if (typeof window !== 'undefined' && 'ClipboardItem' in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': shareModalCard.blob }),
        ]);
        setCopiedShareFeedback(true);
        setTimeout(() => setCopiedShareFeedback(false), 2600);
      } else {
        handleDownloadShareCard();
      }
    } catch (err) {
      console.warn('Clipboard write image failed, falling back to download:', err);
      handleDownloadShareCard();
    }
  };

  const handleNativeShare = async () => {
    if (!shareModalCard) return;
    try {
      const file = new File([shareModalCard.blob], shareModalCard.filename, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${planetName} World Chronicle`,
          text: `Check out the top recent milestones of my miniature planet ${planetName} in Pocket World Terrarium! Day ${dayCount} • ${season} season.`,
          files: [file],
        });
      } else {
        handleDownloadShareCard();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateJournalJSON(content);
      if (!res.success) {
        setStatusBanner({ type: 'error', message: res.error });
        setTimeout(() => setStatusBanner(null), 5000);
        return;
      }
      setImportModalData(res.data);
    };
    reader.onerror = () => {
      setStatusBanner({ type: 'error', message: 'Unable to read the chosen file.' });
      setTimeout(() => setStatusBanner(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmMerge = () => {
    if (!importModalData) return;
    const mergedEntries = mergeJournalEntries(entries, importModalData.entries);
    const mergedStats = mergeJournalStats(stats, importModalData.stats);
    onImportJournal(mergedEntries, mergedStats, importModalData.planetName);
    setStatusBanner({
      type: 'success',
      message: `Successfully merged ${importModalData.entries.length} historical events into ${planetName}'s chronicle!`,
    });
    setImportModalData(null);
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const handleConfirmReplace = () => {
    if (!importModalData) return;
    onImportJournal(importModalData.entries, importModalData.stats, importModalData.planetName);
    setStatusBanner({
      type: 'success',
      message: `Restored chronicle archive for ${importModalData.planetName} with ${importModalData.entries.length} events!`,
    });
    setImportModalData(null);
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const handleSaveCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote = createCustomFieldNote(planetName, noteTitle, noteText, {
      dayCount,
      timeOfDay,
      season,
    });
    onAddNote(newNote);
    setNoteTitle('');
    setNoteText('');
    setIsComposingNote(false);
  };

  function renderEntryIcon(iconName: string, color: string) {
    const cls = 'w-4 h-4 shrink-0';
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={cls} style={{ color }} />;
      case 'CloudSnow':
        return <CloudSnow className={cls} style={{ color }} />;
      case 'Trophy':
        return <Trophy className={cls} style={{ color }} />;
      case 'Mountain':
        return <Mountain className={cls} style={{ color }} />;
      case 'Waves':
        return <Waves className={cls} style={{ color }} />;
      case 'Home':
        return <Home className={cls} style={{ color }} />;
      case 'Trees':
        return <Trees className={cls} style={{ color }} />;
      case 'Flame':
        return <Flame className={cls} style={{ color }} />;
      case 'Camera':
        return <Camera className={cls} style={{ color }} />;
      case 'Sun':
        return <Sun className={cls} style={{ color }} />;
      case 'Moon':
        return <Moon className={cls} style={{ color }} />;
      case 'Rainbow':
        return <Rainbow className={cls} style={{ color }} />;
      case 'Wind':
        return <Wind className={cls} style={{ color }} />;
      case 'Calendar':
        return <Calendar className={cls} style={{ color }} />;
      case 'BookOpen':
      default:
        return <BookOpen className={cls} style={{ color }} />;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Planet Journal & Chronicle"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-auto"
        >
          {/* Framer Motion Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 bg-[#16121c]/75 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Framer Motion Main Journal Book Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 320,
              mass: 0.85,
            }}
            className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#fdfaf3] text-[#3b3227] rounded-3xl border border-[#dcd1be] shadow-2xl overflow-hidden"
          >
        {/* Leatherbound Header Bar */}
        <header className="px-5 py-4 bg-[#2f261f] text-[#fbf7ee] flex flex-wrap items-center justify-between gap-3 border-b border-[#231c16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#43362a] border border-[#63503f] flex items-center justify-center shadow-inner text-[#f59e0b]">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-[#fdf8ed]">
                  {planetName} Chronicles
                </h2>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-md bg-[#4a3c2f] text-[#fcd34d] border border-[#6b5844]">
                  Field Journal
                </span>

                {/* Counter indicator showing displayed entries based on active filters */}
                <div
                  role="status"
                  aria-label={`${displayedEntries.length} of ${entries.length} journal entries displayed based on active filters`}
                  title={
                    isFiltered
                      ? `Active filters: showing ${displayedEntries.length} of ${entries.length} entries`
                      : `Showing all ${entries.length} entries`
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs transition-colors border shadow-xs ${
                    isFiltered
                      ? 'bg-[#43301f] text-[#fef08a] border-[#8a5b28] ring-1 ring-[#f59e0b]/25'
                      : 'bg-[#3b3026] text-[#e5dbcf] border-[#594939]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFiltered ? 'bg-[#f59e0b] animate-pulse' : 'bg-[#10b981]'
                    }`}
                  />
                  <span className="font-semibold text-white">
                    {displayedEntries.length}
                  </span>
                  <span className="text-[#998675]">/</span>
                  <span className="text-[#cfc1b0]">{entries.length}</span>
                  <span className="text-[10px] font-sans font-medium text-[#c4b5a3]">
                    {displayedEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                  {isFiltered && (
                    <span className="text-[9px] uppercase font-sans font-bold px-1 py-0.2 rounded-xs bg-[#78350f] text-[#fde047]">
                      filtered
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#d1c4b2]">
                Significant events, biological breakthroughs & planetary records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export JSON Button */}
            <button
              type="button"
              onClick={handleExportJSON}
              title="Download world history as JSON backup file"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#43372c] hover:bg-[#544639] text-[#f5ede0] border border-[#5d4d3d] transition-colors cursor-pointer active:scale-95"
            >
              {exportFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span className="text-[#a7f3d0]">Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span className="hidden sm:inline">Export JSON</span>
                </>
              )}
            </button>

            {/* Import JSON Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import world history from previously saved JSON file"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#43372c] hover:bg-[#544639] text-[#f5ede0] border border-[#5d4d3d] transition-colors cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#c084fc]" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload journal JSON file"
            />

            {/* Export Markdown Chronicle */}
            <button
              type="button"
              onClick={handleCopyChronicle}
              title="Copy markdown transcript of all chronicled events"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#43372c] hover:bg-[#544639] text-[#f5ede0] border border-[#5d4d3d] transition-colors cursor-pointer active:scale-95"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span className="text-[#a7f3d0]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span>Markdown</span>
                </>
              )}
            </button>

            {/* Share World Chronicle Social Card */}
            <button
              type="button"
              onClick={handleGenerateChronicleShare}
              disabled={isGeneratingShare}
              title="Generate stylized World Chronicle card of top 3 milestones for social sharing"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-[#fef3c7] shadow-sm border border-[#f59e0b]/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isGeneratingShare ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#fde047]" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#fde047]" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsComposingNote((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-[#2b1704] transition-colors cursor-pointer font-sans shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Note</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Journal"
              className="w-8 h-8 rounded-xl bg-[#43372c] hover:bg-[#59493b] text-[#e8ded1] flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Status Notification Banner (Export/Import Alerts) */}
        <AnimatePresence>
          {statusBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className={`px-5 py-2.5 flex items-center justify-between text-xs font-medium border-b shrink-0 ${
                statusBanner.type === 'success'
                  ? 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]'
                  : 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusBanner.type === 'success' ? (
                  <Check className="w-4 h-4 text-[#059669] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
                )}
                <span>{statusBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-current opacity-70 hover:opacity-100 p-0.5 cursor-pointer ml-2"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Tab Navigation: Timeline Chronicle vs Population & Happiness Trends */}
        <div className="px-5 py-2.5 bg-[#ebdcc8] border-b border-[#ddccb4] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#dfceb9] border border-[#d2bfab] shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#2e241c] text-[#fef3c7] shadow-sm'
                  : 'text-[#695847] hover:text-[#2e241c] hover:bg-black/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Timeline Chronicle</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'timeline'
                    ? 'bg-white/20 text-[#fef3c7]'
                    : 'bg-[#cfbdab] text-[#5c4a3b]'
                }`}
              >
                {entries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-[#2e241c] text-[#fef3c7] shadow-sm'
                  : 'text-[#695847] hover:text-[#2e241c] hover:bg-black/5'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Stats & Trends</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#10b981]/20 text-[#065f46] font-bold">
                Recharts
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-[#736250]">
            {activeTab === 'timeline' ? (
              <span>Chronological field records & milestones</span>
            ) : (
              <span>Growth trends & milestone event spikes</span>
            )}
          </div>
        </div>

        {activeTab === 'stats' ? (
          <JournalStatsView
            entries={entries}
            stats={stats}
            planetName={planetName}
            dayCount={dayCount}
            season={season}
            population={population}
            happiness={happiness}
            onNavigateToEntry={(id) => {
              setActiveTab('timeline');
              const target = entries.find((e) => e.id === id);
              if (target) {
                setSearchQuery(target.title);
              }
            }}
          />
        ) : (
          <>
        {/* Top Search Bar */}
        <section
          aria-label="Chronicle Search Bar"
          className="px-5 py-3 bg-[#f6eee2] border-b border-[#e2d5c1] flex flex-col gap-2 shrink-0 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8f7d6a] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search chronicle by keyword, event, milestone, season, or tag (e.g. 'snow', 'population', 'forest')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm rounded-xl bg-[#faf6ed] border border-[#d8cbbb] text-[#2b221b] placeholder:text-[#9e8d7a] focus:outline-hidden focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20 transition-all shadow-inner"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    title="Clear search query"
                    className="p-1 rounded-md text-[#8c7866] hover:text-[#2b221b] hover:bg-[#ede3d1] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd
                    className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#8a7764] bg-[#ede3d1] border border-[#d6c7b3] rounded-md pointer-events-none"
                    title="Press / anywhere in Journal to search"
                  >
                    /
                  </kbd>
                )}
                {searchQuery && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#e2d4c0] text-[#4a3b2c] whitespace-nowrap">
                    {displayedEntries.length} {displayedEntries.length === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Keyword Discovery Chips */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#786755] overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#917d69] shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#d97706]" /> Quick Filter:
            </span>
            {['Snow', 'Population', 'Forest', 'Milestone', 'Hamlet', 'Nightfall', 'Autumn', 'Meadow'].map((keyword) => {
              const active = searchQuery.toLowerCase() === keyword.toLowerCase();
              return (
                <button
                  key={keyword}
                  type="button"
                  onClick={() =>
                    setSearchQuery((prev) =>
                      prev.toLowerCase() === keyword.toLowerCase() ? '' : keyword,
                    )
                  }
                  className={`px-2 py-0.5 text-[11px] rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#3b2f27] text-[#fef3c7] font-semibold shadow-xs'
                      : 'bg-[#ede4d4] hover:bg-[#e4d8c5] text-[#5e4e3f]'
                  }`}
                >
                  {keyword}
                </button>
              );
            })}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#b45309] hover:underline font-medium shrink-0 ml-1.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* Vital Records Showcase Strip */}
        <section
          aria-label="Planetary Vital Records"
          className="px-5 py-3.5 bg-[#f5ecdd] border-b border-[#e2d5c1] grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0"
        >
          {/* Peak Population */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5]">
            <div className="w-8 h-8 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955]">
                Peak Population
              </div>
              <div className="text-sm font-semibold text-[#2f261e] truncate font-mono-tabular">
                {stats.peakPopulation}{' '}
                <span className="text-xs font-normal text-[#6f5e4f]">
                  citizens
                </span>
              </div>
            </div>
          </div>

          {/* First Snow */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5]">
            <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
              <CloudSnow className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955]">
                First Snow
              </div>
              <div className="text-xs font-semibold text-[#2f261e] truncate">
                {stats.firstSnowRecorded ? (
                  <span className="text-[#0369a1] font-medium flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#0284c7]" /> Chronicled
                  </span>
                ) : (
                  <span className="text-[#8c7866] italic">Awaiting Frost</span>
                )}
              </div>
            </div>
          </div>

          {/* Biomes Cataloged */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5]">
            <div className="w-8 h-8 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
              <Trees className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955]">
                Biomes Known
              </div>
              <div className="text-sm font-semibold text-[#2f261e] font-mono-tabular">
                {stats.biomesDiscovered.length}{' '}
                <span className="text-xs font-normal text-[#6f5e4f]">
                  / 5 areas
                </span>
              </div>
            </div>
          </div>

          {/* Planetary Age */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#faf5eb] border border-[#e5d9c5]">
            <div className="w-8 h-8 rounded-xl bg-[#fdf2f8] text-[#db2777] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#7c6955]">
                Terrarium Age
              </div>
              <div className="text-sm font-semibold text-[#2f261e] font-mono-tabular capitalize">
                Day {dayCount} • {season}
              </div>
            </div>
          </div>
        </section>

        {/* Custom Note Composer (collapsible) */}
        <AnimatePresence>
          {isComposingNote && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onSubmit={handleSaveCustomNote}
              className="p-4 bg-[#f4ebdc] border-b border-[#ded1be] flex flex-col gap-3 shrink-0 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-semibold text-[#483a2b] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#d97706]" />
                  Record Naturalist Observation into the Chronicle
                </span>
                <button
                  type="button"
                  onClick={() => setIsComposingNote(false)}
                  className="text-xs text-[#7c6955] hover:text-[#2b221b] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                placeholder="Observation Title (e.g. Cherry blossoms planted along coastal pier)"
                value={noteTitle}
                maxLength={60}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl bg-[#faf6ed] border border-[#d8cbbb] text-[#2b221b] placeholder:text-[#9e8d7a] focus:outline-hidden focus:border-[#b45309]"
              />

              <textarea
                placeholder="What changes did you observe in the miniature world today? Describe the weather, villager life, flora growth, or celestial paths..."
                rows={2}
                value={noteText}
                maxLength={400}
                onChange={(e) => setNoteText(e.target.value)}
                required
                className="px-3.5 py-2 text-xs rounded-xl bg-[#faf6ed] border border-[#d8cbbb] text-[#2b221b] placeholder:text-[#9e8d7a] focus:outline-hidden focus:border-[#b45309] resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-[#7a6755]">
                <span>
                  Timestamped: Day {dayCount} • {season}
                </span>
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="px-4 py-1.5 text-xs font-medium rounded-xl bg-[#d97706] hover:bg-[#b45309] disabled:opacity-40 text-white transition-colors cursor-pointer"
                >
                  Save to Journal
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Filter Tabs & Search Controls */}
        <div className="px-5 py-3 border-b border-[#e8ded0] bg-[#faf6ee] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(
              [
                { id: 'all', label: 'All Chronicles' },
                { id: 'record', label: 'Records' },
                { id: 'milestone', label: 'Milestones' },
                { id: 'biome', label: 'Biomes' },
                { id: 'weather', label: 'Weather & Sky' },
                { id: 'village', label: 'Settlement' },
                { id: 'note', label: 'Field Notes' },
              ] as { id: JournalCategory | 'all'; label: string }[]
            ).map((cat) => {
              const active = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#3b2f27] text-[#fcf9f2] font-medium shadow-xs'
                      : 'bg-[#ede5d6] text-[#5e4e3f] hover:bg-[#e2d8c7] hover:text-[#2b221b]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      active
                        ? 'bg-white/20 text-[#fbf7ee]'
                        : 'bg-[#d8ccba] text-[#5e4e3f]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick Switch to Recharts Stats Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              title="Open Recharts trend curves for population and happiness"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] font-medium transition-all cursor-pointer whitespace-nowrap shadow-xs ml-1"
            >
              <LineChart className="w-3.5 h-3.5 text-[#059669]" />
              <span>Stats & Trends</span>
            </button>
          </div>

          {/* Category Controls: Filter Tags & Sort */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter by Tag Button */}
            <button
              type="button"
              onClick={() => setShowTagFilters((prev) => !prev)}
              aria-label="Filter entries by tag"
              aria-expanded={showTagFilters}
              title="Filter entries by tag category (Milestone, Event, Discovery...)"
              className={`px-2.5 py-1.5 text-xs rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedTag !== 'all' || showTagFilters
                  ? 'bg-[#3b2f27] text-[#fef3c7] border-[#2b2118] font-semibold'
                  : 'bg-[#ede5d6] hover:bg-[#e2d8c7] text-[#5e4e3f] border-transparent'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#d97706]" />
              <span>{selectedTag === 'all' ? 'Filter Tags' : selectedTag}</span>
              {selectedTag !== 'all' ? (
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              ) : (
                <ChevronDown
                  className={`w-3 h-3 text-[#7a6755] transition-transform ${
                    showTagFilters ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
              }
              title={`Sorting: ${sortOrder === 'newest' ? 'Newest first' : 'Chronological'}`}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-[#ede5d6] hover:bg-[#e2d8c7] text-[#5e4e3f] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <SlidersHorizontal className="w-3 h-3 text-[#7a6755]" />
              <span className="capitalize">{sortOrder}</span>
            </button>
          </div>
        </div>

        {/* Expandable Tag Filter Drawer */}
        <AnimatePresence>
          {showTagFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="px-5 py-2.5 bg-[#f6eee2] border-b border-[#e2d5c1] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73604f] flex items-center gap-1 mr-1">
                  <Tag className="w-3 h-3 text-[#d97706]" />
                  Categories:
                </span>

                {(
                  [
                    { id: 'all', label: 'All Entries' },
                    { id: 'Milestone', label: 'Milestone' },
                    { id: 'Discovery', label: 'Discovery' },
                    { id: 'Event', label: 'Event' },
                    { id: 'Record', label: 'Record' },
                    { id: 'Observation', label: 'Observation' },
                  ] as { id: string; label: string }[]
                ).map((tagItem) => {
                  const active = selectedTag === tagItem.id;
                  const count =
                    tagItem.id === 'all'
                      ? entries.length
                      : tagCounts[tagItem.id] || 0;

                  return (
                    <button
                      key={tagItem.id}
                      type="button"
                      onClick={() =>
                        setSelectedTag((prev) =>
                          prev === tagItem.id ? 'all' : tagItem.id,
                        )
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        active
                          ? 'bg-[#33261c] text-[#fef3c7] font-semibold shadow-xs ring-1 ring-black/10'
                          : 'bg-[#ede3d1] text-[#5e4e3f] hover:bg-[#e4d6bf] hover:text-[#2b221b]'
                      }`}
                    >
                      {tagItem.id !== 'all' && (
                        <span className={`shrink-0 ${active ? 'text-[#fcd34d]' : 'text-[#b45309]'}`}>
                          {getTagIcon(tagItem.id, 'w-3 h-3')}
                        </span>
                      )}
                      <span>{tagItem.label}</span>
                      <span
                        className={`text-[10px] font-mono px-1 rounded-md ${
                          active
                            ? 'bg-white/20 text-[#fef3c7]'
                            : 'bg-[#ded0bc] text-[#695847]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedTag !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTag('all')}
                  className="text-xs text-[#991b1b] hover:text-[#7f1d1d] hover:underline cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Tag</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Timeline Entries List with Connecting Vertical Line */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          {displayedEntries.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ede5d6] flex items-center justify-center text-[#9c8976]">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#483c2f]">
                No Chronicles Found
              </h3>
              <p className="text-xs text-[#857361] max-w-sm">
                {searchQuery
                  ? `No journal events matched "${searchQuery}". Clear your search to view all logged events.`
                  : 'Start placing elements, changing seasons, or sculpting terrain to chronicle new milestones!'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#ded3c1] text-[#3e3226] hover:bg-[#cebfab] cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="relative flex flex-col" aria-label="Chronicle Timeline">
              {displayedEntries.map((entry, index) => {
                const milestone = getMilestoneInfo(entry);
                const isMilestone = milestone.isMilestone;
                const isFirst = index === 0;
                const isLast = index === displayedEntries.length - 1;
                const primaryTag =
                  entry.tags?.find((t) =>
                    ['Milestone', 'Discovery', 'Record', 'Observation'].includes(t),
                  ) || entry.tags?.[0];

                return (
                  <article
                    key={entry.id}
                    className="relative flex items-stretch gap-3 sm:gap-4 group"
                  >
                    {/* Timestamp Axis Column (Desktop) */}
                    <div className="hidden sm:flex flex-col items-end justify-start pt-3 w-28 lg:w-32 shrink-0 pr-2 text-right select-none font-mono-tabular">
                      <div className="text-xs font-serif font-bold text-[#2d241c]">
                        Day {entry.dayCount}
                      </div>
                      <div className="text-[11px] font-medium text-[#7c6955] capitalize">
                        {entry.timeOfDayLabel}
                      </div>
                      <div className="text-[10px] text-[#9e8d7a] mt-0.5">
                        {entry.realTimestamp}
                      </div>
                    </div>

                    {/* Timeline Vertical Spine & Node */}
                    <div className="relative flex flex-col items-center shrink-0 w-8 sm:w-9">
                      {/* Top connecting line segment */}
                      <div
                        className={`w-[2px] transition-colors ${
                          isFirst ? 'bg-transparent' : 'bg-[#d0c1ad] group-hover:bg-[#b8a690]'
                        } h-3.5`}
                      />

                      {/* Timeline Node / Timestamp Marker with Dynamic Tag Badge */}
                      <div className="relative">
                        <div
                          className={`z-10 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 shrink-0 ${
                            isMilestone
                              ? `w-8 h-8 sm:w-9 sm:h-9 ${milestone.glowClasses} border-2`
                              : 'w-7 h-7 sm:w-8 sm:h-8 bg-[#faf6ee] border-[#c8b9a5]'
                          }`}
                          style={{
                            backgroundColor: `${entry.accentColor}18`,
                            borderColor: isMilestone ? undefined : `${entry.accentColor}40`,
                          }}
                        >
                          {renderEntryIcon(entry.iconName, isMilestone ? milestone.iconColor : entry.accentColor)}
                        </div>

                        {/* Dynamic Lucide Tag Indicator Badge */}
                        {primaryTag && (
                          <div
                            title={`Tag: ${primaryTag}`}
                            className="absolute -bottom-1 -right-1 z-20 w-4 h-4 rounded-full bg-[#fdfaf3] border border-[#d8cbbb] shadow-xs flex items-center justify-center text-[#5c4a3b] transition-transform group-hover:scale-110"
                          >
                            {getTagIcon(primaryTag, 'w-2.5 h-2.5')}
                          </div>
                        )}
                      </div>

                      {/* Bottom connecting line segment to next timestamp */}
                      <div
                        className={`w-[2px] flex-1 transition-colors ${
                          isLast ? 'bg-transparent' : 'bg-[#d0c1ad] group-hover:bg-[#b8a690]'
                        } min-h-[22px]`}
                      />
                    </div>

                    {/* Entry Card Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      {/* Mobile Timestamp Ribbon */}
                      <div className="sm:hidden flex items-center justify-between gap-1.5 text-[11px] font-mono-tabular text-[#786755] mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#3d3226]">Day {entry.dayCount}</span>
                          <span>•</span>
                          <span>{entry.timeOfDayLabel}</span>
                          <span className="text-[#a89987]">•</span>
                          <span className="text-[#8f7d6a]">{entry.realTimestamp}</span>
                        </div>
                        {primaryTag && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#786755] font-medium">
                            <span className="shrink-0">{getTagIcon(primaryTag, 'w-2.5 h-2.5')}</span>
                            <span>{primaryTag}</span>
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-4 rounded-2xl border transition-all shadow-xs group-hover:border-[#c9b89f] relative overflow-hidden ${
                          isMilestone
                            ? `${milestone.cardHighlightBg || 'bg-[#faf6ee]'} ${milestone.cardHighlightBorder || 'border-[#e2d6c3]'} ring-1 ring-black/5`
                            : 'bg-[#faf6ee] border-[#e2d6c3]'
                        }`}
                      >
                        {/* Subtle Top Accent Ribbon for Milestones */}
                        {isMilestone && (
                          <div
                            className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
                            style={{
                              background: `linear-gradient(90deg, ${milestone.iconColor}, transparent 80%)`,
                            }}
                            aria-hidden="true"
                          />
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {isMilestone ? (
                              <MilestoneBadge entry={entry} size="md" showSublabel={true} />
                            ) : (
                              <span
                                className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded-md border"
                                style={{
                                  backgroundColor: `${entry.accentColor}15`,
                                  borderColor: `${entry.accentColor}40`,
                                  color: entry.accentColor,
                                }}
                              >
                                {highlightMatch(entry.badge.toUpperCase(), searchQuery)}
                              </span>
                            )}
                            {primaryTag && (
                              <span
                                title={`Category: ${primaryTag}`}
                                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono rounded-md border ${getTagStyle(
                                  primaryTag,
                                  selectedTag === primaryTag,
                                )}`}
                              >
                                {getTagIcon(primaryTag, 'w-2.5 h-2.5')}
                                <span>{primaryTag}</span>
                              </span>
                            )}
                            <h4 className="text-sm font-serif font-semibold text-[#2b221b]">
                              {highlightMatch(entry.title, searchQuery)}
                            </h4>
                          </div>

                          {/* Desktop Timestamp secondary info + Actions */}
                          <div className="flex items-center gap-2 text-[11px] text-[#786755] font-mono-tabular">
                            <span className="hidden lg:inline text-[#8a7764] capitalize">
                              {entry.season} season
                            </span>
                            <span className="hidden lg:inline text-[#c4b5a3]">•</span>
                            <span className="hidden sm:inline lg:hidden text-[#8a7764]">
                              {entry.realTimestamp}
                            </span>

                            {entry.isCustomNote && (
                              <button
                                type="button"
                                onClick={() => onDeleteEntry(entry.id)}
                                title="Delete note"
                                className="p-1 text-[#a89987] hover:text-[#dc2626] rounded-md hover:bg-[#ede3d1] transition-colors ml-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Narrative Description */}
                        <p className="text-xs text-[#524436] leading-relaxed">
                          {highlightMatch(entry.description, searchQuery)}
                        </p>

                        {/* Numeric Record Metric Tag */}
                        {entry.numericRecord && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0e6d5] border border-[#d9ccb9] text-[11px] font-mono-tabular text-[#4b3c2e]">
                            <Award className="w-3.5 h-3.5 text-[#d97706]" />
                            <span>
                              {entry.numericRecord.type === 'population' && (
                                <>
                                  Peak Population achieved:{' '}
                                  <strong>{entry.numericRecord.value}</strong> citizens
                                  {entry.numericRecord.prevValue && (
                                    <span className="text-[#7c6a58] ml-1">
                                      (previously {entry.numericRecord.prevValue})
                                    </span>
                                  )}
                                </>
                              )}
                              {entry.numericRecord.type === 'days' && (
                                <>
                                  Sustained for{' '}
                                  <strong>{entry.numericRecord.value}</strong> Solar Cycles
                                </>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Entry Category Tags with Dynamic Lucide Icons */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#e8ded0]/80 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#857361] flex items-center gap-1 mr-0.5">
                              <Tag className="w-2.5 h-2.5 text-[#b45309]" />
                              Tags:
                            </span>
                            {entry.tags.map((t) => {
                              const active = selectedTag === t;
                              const tagClass = getTagStyle(t, active);
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTag((prev) => (prev === t ? 'all' : t));
                                    setShowTagFilters(true);
                                  }}
                                  title={`Toggle filter for category "${t}"`}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-md border transition-all cursor-pointer ${tagClass}`}
                                >
                                  <span className="shrink-0">{getTagIcon(t, 'w-2.5 h-2.5')}</span>
                                  <span>{t}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
        </>
        )}

        {/* Footer info bar */}
        <footer className="px-5 py-2.5 bg-[#f5ecde] border-t border-[#e2d5c1] text-[11px] text-[#736250] flex items-center justify-between shrink-0">
          <span>
            {entries.length} total event{entries.length === 1 ? '' : 's'} recorded • Press{' '}
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#e7dccb] border border-[#d1c3af] font-mono text-[10px] text-[#3e3226]">
              /
            </kbd>{' '}
            to search • Press{' '}
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#e7dccb] border border-[#d1c3af] font-mono text-[10px] text-[#3e3226]">
              J
            </kbd>{' '}
            or{' '}
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#e7dccb] border border-[#d1c3af] font-mono text-[10px] text-[#3e3226]">
              Esc
            </kbd>{' '}
            to close
          </span>
          <span className="font-serif italic text-[#877563]">
            {planetName} Living Archive
          </span>
        </footer>

        {/* Import JSON Confirmation Dialog */}
        <AnimatePresence>
          {importModalData && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm Journal Import"
              className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md bg-[#faf6ee] text-[#2f251c] rounded-2xl border border-[#d6c7b3] shadow-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ede2d1] text-[#7e22ce] flex items-center justify-center border border-[#d8c7b0] shrink-0">
                    <FileJson className="w-5 h-5 text-[#7e22ce]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold font-serif text-[#2a2118]">
                      Import Journal History
                    </h3>
                    <p className="text-xs text-[#705f4e] truncate">
                      File from "{importModalData.planetName}"
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f0e6d6] border border-[#dccebc] text-xs flex flex-col gap-1.5 font-mono-tabular">
                  <div className="flex justify-between">
                    <span className="text-[#6d5b4a]">Planet Name:</span>
                    <strong className="text-[#2b221b] truncate max-w-[200px]">
                      {importModalData.planetName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6d5b4a]">Events in Archive:</span>
                    <strong className="text-[#2b221b]">
                      {importModalData.entries.length} chronicles
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6d5b4a]">Peak Population:</span>
                    <strong className="text-[#2b221b]">
                      {importModalData.stats.peakPopulation} citizens
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6d5b4a]">Biomes Discovered:</span>
                    <strong className="text-[#2b221b]">
                      {importModalData.stats.biomesDiscovered.length} biomes
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-[#6b5847] leading-relaxed">
                  Choose how to apply this history to your terrarium: merge events into the existing journal without losing current records, or replace it entirely with the backup file.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmMerge}
                    className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-[#2f261f] text-[#fbf7ee] hover:bg-[#43372c] transition-colors cursor-pointer text-center"
                  >
                    Merge History
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReplace}
                    className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-[#e6dbcc] text-[#413426] hover:bg-[#d8cbba] border border-[#cbbeab] transition-colors cursor-pointer text-center"
                  >
                    Replace Current
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportModalData(null)}
                    className="w-full sm:w-auto py-2 px-3 text-xs text-[#736150] hover:text-[#2b221b] transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Stylized World Chronicle Social Share Preview Modal */}
        <AnimatePresence>
          {shareModalCard && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="World Chronicle Social Share Card"
              className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#1e1724] text-[#fbf7ee] rounded-3xl border border-[#d97706]/50 shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-5 py-3.5 bg-[#17101c] border-b border-[#362742] flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#d97706]/20 border border-[#d97706]/40 text-[#fcd34d] flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#fef3c7]">
                        {planetName} Living Chronicle Card
                      </h3>
                      <p className="text-[11px] text-[#baa897]">
                        Stylized social graphic showcasing the top {shareModalCard.topMilestones.length} recent world milestones
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareModalCard(null)}
                    className="p-1.5 rounded-lg text-[#baa897] hover:text-[#fff] hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close Share Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Preview Image */}
                <div className="p-4 sm:p-5 overflow-y-auto flex flex-col items-center justify-center bg-[#130d17]">
                  <div className="relative rounded-2xl overflow-hidden border border-[#d97706]/35 shadow-xl max-w-full">
                    <img
                      src={shareModalCard.dataUrl}
                      alt={`${planetName} World Chronicle`}
                      className="w-full h-auto max-h-[50vh] object-contain rounded-2xl"
                    />
                  </div>

                  {/* Top Milestones Included Info Pills */}
                  <div className="w-full mt-3.5 pt-3 border-t border-[#2a1d35] flex items-center justify-between text-[11px] text-[#baa897] flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-[#fcd34d] uppercase tracking-wider">
                        Included Milestones:
                      </span>
                      {shareModalCard.topMilestones.map((m, idx) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-md bg-[#2d1f3b] border border-[#48345e] text-[#fde047] text-[10px] font-mono"
                        >
                          #{idx + 1} {m.badge || m.title}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-[#8e7a9c] font-mono">
                      1200 × 800 HD Card
                    </span>
                  </div>
                </div>

                {/* Modal Action Buttons Footer */}
                <div className="px-5 py-3.5 bg-[#17101c] border-t border-[#362742] flex items-center justify-between gap-2 flex-wrap shrink-0">
                  <span className="text-[11px] text-[#8e7a9c]">
                    Ready for Twitter, Discord, Instagram or saving as a keepsake
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Copy Image Button */}
                    <button
                      type="button"
                      onClick={handleCopyShareCard}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#2e1f3d] hover:bg-[#3d2b52] text-[#e2d5ec] border border-[#4d3663] transition-all cursor-pointer"
                    >
                      {copiedShareFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#34d399]" />
                          <span className="text-[#a7f3d0]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#fde047]" />
                          <span>Copy Image</span>
                        </>
                      )}
                    </button>

                    {/* Native Share Button (if supported) */}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#0284c7]/20 hover:bg-[#0284c7]/35 text-[#7dd3fc] border border-[#0284c7]/40 transition-all cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share App</span>
                      </button>
                    )}

                    {/* Download Image Button */}
                    <button
                      type="button"
                      onClick={handleDownloadShareCard}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-[#fef3c7] border border-[#f59e0b]/50 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-[#fde047]" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )}
</AnimatePresence>
);
}
