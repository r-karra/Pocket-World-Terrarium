import React, { useMemo, useState } from 'react';
import {
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  CloudSnow,
  Copy,
  Flame,
  Home,
  Moon,
  Mountain,
  Plus,
  Rainbow,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Trees,
  Trophy,
  Users,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  JournalCategory,
  JournalEntry,
  JournalStats,
  SeasonId,
} from '../types/world';
import {
  createCustomFieldNote,
  exportChronicleMarkdown,
} from '../utils/journalManager';

interface JournalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  stats: JournalStats;
  planetName: string;
  dayCount: number;
  timeOfDay: number;
  season: SeasonId;
  onAddNote: (newEntry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
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
  onAddNote,
  onDeleteEntry,
}: JournalOverlayProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    JournalCategory | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isComposingNote, setIsComposingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Filtered and sorted entries
  const displayedEntries = useMemo(() => {
    let list = [...entries];

    if (selectedCategory !== 'all') {
      list = list.filter((e) => e.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.badge.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt,
    );

    return list;
  }, [entries, selectedCategory, searchQuery, sortOrder]);

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

  if (!isOpen) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Planet Journal & Chronicle"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#16121c]/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Journal Book Container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#fdfaf3] text-[#3b3227] rounded-3xl border border-[#dcd1be] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Leatherbound Header Bar */}
        <header className="px-5 py-4 bg-[#2f261f] text-[#fbf7ee] flex flex-wrap items-center justify-between gap-3 border-b border-[#231c16] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#43362a] border border-[#63503f] flex items-center justify-center shadow-inner text-[#f59e0b]">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-semibold tracking-wide text-[#fdf8ed]">
                  {planetName} Chronicles
                </h2>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-md bg-[#4a3c2f] text-[#fcd34d] border border-[#6b5844]">
                  Field Journal
                </span>
              </div>
              <p className="text-xs text-[#d1c4b2]">
                Significant events, biological breakthroughs & planetary records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyChronicle}
              title="Copy markdown transcript of all chronicled events"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[#43372c] hover:bg-[#544639] text-[#f5ede0] border border-[#5d4d3d] transition-colors cursor-pointer active:scale-95"
            >
              {copiedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#34d399]" />
                  <span className="text-[#a7f3d0]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span className="hidden sm:inline">Export Chronicle</span>
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
        {isComposingNote && (
          <form
            onSubmit={handleSaveCustomNote}
            className="p-4 bg-[#f4ebdc] border-b border-[#ded1be] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0"
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
          </form>
        )}

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
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#8f7d6a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#ede5d6] border border-transparent focus:border-[#b45309] text-[#2b221b] placeholder:text-[#8f7d6a] focus:outline-hidden"
              />
            </div>

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

        {/* Timeline Entries List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 no-scrollbar">
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
            displayedEntries.map((entry, index) => {
              return (
                <article
                  key={entry.id}
                  className="relative flex items-start gap-3.5 group animate-in fade-in duration-150"
                >
                  {/* Left Icon Pill */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${entry.accentColor}18`,
                        borderColor: `${entry.accentColor}40`,
                      }}
                    >
                      {renderEntryIcon(entry.iconName, entry.accentColor)}
                    </div>
                    {/* Connecting Timeline Line */}
                    {index < displayedEntries.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[#e0d3be] my-1 group-last:hidden" />
                    )}
                  </div>

                  {/* Entry Card Content */}
                  <div className="flex-1 p-4 rounded-2xl bg-[#faf6ee] border border-[#e2d6c3] shadow-xs group-hover:border-[#c9b89f] transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded-md border"
                          style={{
                            backgroundColor: `${entry.accentColor}15`,
                            borderColor: `${entry.accentColor}40`,
                            color: entry.accentColor,
                          }}
                        >
                          {entry.badge.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-serif font-semibold text-[#2b221b]">
                          {entry.title}
                        </h4>
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-2 text-[11px] text-[#786755] font-mono-tabular">
                        <span className="font-medium text-[#4a3d31]">
                          Day {entry.dayCount} • {entry.timeOfDayLabel}
                        </span>
                        <span className="text-[#a89987]">•</span>
                        <span>{entry.realTimestamp}</span>

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
                      {entry.description}
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
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <footer className="px-5 py-2.5 bg-[#f5ecde] border-t border-[#e2d5c1] text-[11px] text-[#736250] flex items-center justify-between shrink-0">
          <span>
            {entries.length} total event{entries.length === 1 ? '' : 's'} recorded • Press{' '}
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
      </div>
    </div>
  );
}
