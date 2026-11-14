import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaExternalLinkAlt,
  FaSortAmountDown,
  FaBookOpen,
  FaChevronDown,
  FaSyncAlt,
  FaExclamationTriangle,
  FaUserGraduate,
  FaRoute,
  FaGithub,
} from 'react-icons/fa';
import {
  DEFAULT_PARTICIPANT_SHEET_URL,
  DEFAULT_SYLLABUS_SOURCE_URL,
  DEFAULT_ROADMAP_SHEET_URL,
  DEFAULT_GITHUB_SCRIPTS_URL,
  DEFAULT_EVENT_TITLE,
  convertToCsvUrl,
  parseParticipantsFromCsv,
  parseSyllabusFromCsv,
  fetchCloudProfileRealtime,
  matchProfileBadgesToSyllabus,
  getCachedProfile,
  setCachedProfile,
} from './data/cloudStudySyllabus';
import ViewToggle from './components/ViewToggle';
import { ListItemSkeleton } from './components/Skeleton';
import BadgeInspectionModal from './components/BadgeInspectionModal';
import SyllabusInfoModal from './components/SyllabusInfoModal';
import AuroraBackground from './components/AuroraBackground';
import SocialDock from './components/SocialDock';
import ContactDock from './components/ContactDock';

const STORAGE_KEY_LEADERBOARD = 'gcsl_persisted_leaderboard_v1';
const STORAGE_KEY_LAST_SYNCED = 'gcsl_persisted_last_synced_v1';
const STORAGE_KEY_SYLLABUS = 'gcsl_syllabus_cache_v1';

// Helper to read initial URL query parameters safely
const readInitialUrlState = () => {
  if (typeof window === 'undefined') {
    return { q: '', view: 'list', sort: 'BADGES_DESC' };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || params.get('search') || '';

    const rawView = params.get('view')?.toLowerCase();
    const view = rawView === 'grid' ? 'grid' : 'list';

    const rawSort = params.get('sort')?.toUpperCase();
    const sort =
      rawSort === 'NAME_ASC' || rawSort === 'NAME'
        ? 'NAME_ASC'
        : 'BADGES_DESC';

    return { q, view, sort };
  } catch {
    return { q: '', view: 'list', sort: 'BADGES_DESC' };
  }
};

export default function App() {
  const eventTitle = DEFAULT_EVENT_TITLE;
  const participantSheetUrl = DEFAULT_PARTICIPANT_SHEET_URL;
  const syllabusSourceUrl = DEFAULT_SYLLABUS_SOURCE_URL;
  const roadmapSheetUrl = DEFAULT_ROADMAP_SHEET_URL;
  const githubScriptsUrl = DEFAULT_GITHUB_SCRIPTS_URL;

  // Track if user is at the top of the page (for mobile tooltips smooth hide/show)
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY <= 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize query parameters from browser URL
  const initialUrlState = useMemo(() => readInitialUrlState(), []);

  // Search, Sort & View states synchronized with URL query params
  const [searchQuery, setSearchQuery] = useState(initialUrlState.q);
  const [sortBy, setSortBy] = useState(initialUrlState.sort); // 'BADGES_DESC' | 'NAME_ASC'
  const [viewMode, setViewMode] = useState(initialUrlState.view); // 'list' | 'grid'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Helper to update URL query parameters cleanly without full-page reloads
  const updateUrlParams = useCallback((updates) => {
    if (typeof window === 'undefined') return;
    try {
      const currentUrl = new URL(window.location.href);
      const params = currentUrl.searchParams;

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Remove legacy 'search' key if 'q' is set
      if (updates.q !== undefined) {
        params.delete('search');
      }

      const newQueryString = params.toString();
      const newRelativePath = newQueryString
        ? `${currentUrl.pathname}?${newQueryString}`
        : currentUrl.pathname;
      const fullNewUrl = `${newRelativePath}${currentUrl.hash}`;

      if (window.location.pathname + window.location.search !== newRelativePath) {
        window.history.replaceState(null, '', fullNewUrl);
      }
    } catch (e) {
      console.warn('Failed to update URL parameters:', e);
    }
  }, []);

  // Debounced search query to URL synchronization (avoids thrashing history on every keystroke)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      updateUrlParams({ q: trimmed ? trimmed : null });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, updateUrlParams]);

  // Synchronize state when user navigates using Browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { q, view, sort } = readInitialUrlState();
      setSearchQuery(q);
      setViewMode(view);
      setSortBy(sort);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handler for view mode changes (List / Grid) with URL update
  const handleViewChange = useCallback((newView) => {
    setViewMode(newView);
    updateUrlParams({ view: newView });
  }, [updateUrlParams]);

  // Handler for sort option changes with URL update
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setIsSortDropdownOpen(false);
    updateUrlParams({ sort: newSort });
  }, [updateUrlParams]);

  // Handler for reset search button
  const handleResetSearch = useCallback(() => {
    setSearchQuery('');
    updateUrlParams({ q: null });
  }, [updateUrlParams]);

  // Initialize syllabus labs from cache if available
  const [syllabusLabs, setSyllabusLabs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY_SYLLABUS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Initialize participants from localStorage so latest synced data is immediately visible on open
  const [participants, setParticipants] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [lastSyncedAt, setLastSyncedAt] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTime = localStorage.getItem(STORAGE_KEY_LAST_SYNCED);
        if (storedTime) return new Date(storedTime);
      } catch {}
    }
    return null;
  });

  const [loadingSheet, setLoadingSheet] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch {}
    }
    return true;
  });

  const [sheetError, setSheetError] = useState(null);

  // Modals
  const [inspectParticipant, setInspectParticipant] = useState(null);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState({
    syncing: false,
    progress: 0,
    total: 0,
    lastSyncedAt: null,
  });

  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const syllabusLabsRef = useRef(syllabusLabs);
  useEffect(() => {
    syllabusLabsRef.current = syllabusLabs;
  }, [syllabusLabs]);

  // Helper to persist current participant state to localStorage
  const persistParticipants = useCallback((list) => {
    if (typeof window !== 'undefined' && Array.isArray(list) && list.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
        const now = new Date();
        localStorage.setItem(STORAGE_KEY_LAST_SYNCED, now.toISOString());
        setLastSyncedAt(now);
      } catch (e) {
        console.warn('Failed to save leaderboard to localStorage:', e);
      }
    }
  }, []);

  // 1. Fetch Syllabus labs dynamically from published syllabus sheet
  useEffect(() => {
    let isMounted = true;
    const fetchSyllabus = async () => {
      if (!syllabusSourceUrl) return;

      try {
        const csvUrl = convertToCsvUrl(syllabusSourceUrl);
        const res = await fetch(csvUrl);
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && csvText.length > 20) {
            const parsed = parseSyllabusFromCsv(csvText);
            if (isMounted && parsed.length > 0) {
              setSyllabusLabs(parsed);
              try {
                sessionStorage.setItem(STORAGE_KEY_SYLLABUS, JSON.stringify(parsed));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Notice fetching syllabus sheet:', err.message);
      }
    };

    fetchSyllabus();
    return () => {
      isMounted = false;
    };
  }, [syllabusSourceUrl]);

  // 2. Controlled Live Profile Sync Engine (Paced concurrency to keep server load minimal)
  const syncLiveProfiles = useCallback(
    async (forceRefresh = false) => {
      const currentList = participantsRef.current || [];
      const candidates = currentList.filter((p) => p.profileUrl);

      if (candidates.length === 0) return;

      setSyncStatus({
        syncing: true,
        progress: 0,
        total: candidates.length,
        lastSyncedAt: null,
      });

      const currentLabs = syllabusLabsRef.current;
      let completed = 0;
      // Controlled concurrency of 2 workers with 150ms pacing between requests
      const CONCURRENCY = 2;
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const worker = async (p) => {
        try {
          const profileData = await fetchCloudProfileRealtime(p.profileUrl, forceRefresh);
          if (profileData && profileData.success) {
            const matchRes = matchProfileBadgesToSyllabus(profileData.badges || [], currentLabs);
            setParticipants((prev) => {
              const updated = prev.map((item) => {
                if (item.id === p.id || item.profileUrl === p.profileUrl) {
                  return {
                    ...item,
                    name: profileData.name || item.name,
                    avatar: profileData.avatar || item.avatar,
                    completedLabs: matchRes.completedLabs,
                    verifiedCount: matchRes.verifiedCount,
                    percentage: matchRes.percentage,
                    totalProfileBadges:
                      profileData.totalBadgesCount || profileData.badges?.length || 0,
                    liveVerified: true,
                  };
                }
                return item;
              });
              persistParticipants(updated);
              return updated;
            });
          }
        } catch (err) {
          console.warn(`Profile sync notice for ${p.name}:`, err.message);
        } finally {
          completed++;
          setSyncStatus((prev) => ({
            ...prev,
            progress: completed,
          }));
          await sleep(150);
        }
      };

      const queue = [...candidates];
      const pool = Array(Math.min(CONCURRENCY, queue.length))
        .fill(0)
        .map(async () => {
          while (queue.length > 0) {
            const item = queue.shift();
            if (item) {
              await worker(item);
            }
          }
        });

      await Promise.all(pool);

      const now = new Date();
      setSyncStatus((prev) => ({
        ...prev,
        syncing: false,
        lastSyncedAt: now,
      }));
      setLastSyncedAt(now);
    },
    [persistParticipants]
  );

  // 3. Fetch Google Sheet on Mount and automatically sync fresh changes
  const hasTriggeredInitialSync = useRef(false);

  const fetchAndSyncOnOpen = useCallback(async () => {
    if (!participantSheetUrl) {
      setLoadingSheet(false);
      setSheetError('Participant Sheet URL is not configured. Please set VITE_PARTICIPANT_SHEET_URL in .env');
      return;
    }

    try {
      const csvUrl = convertToCsvUrl(participantSheetUrl);
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch spreadsheet (HTTP ${res.status}). Ensure the sheet is public.`);
      }

      const csvText = await res.text();
      if (!csvText || csvText.length < 10) {
        throw new Error('Spreadsheet returned empty content.');
      }

      // Parse current rows from sheet (use ref so we get latest syllabus even if it loaded late)
      const freshParsed = parseParticipantsFromCsv(csvText, syllabusLabsRef.current);

      // Merge with previously persisted participant data to retain verified progress
      const existingMap = new Map();
      (participantsRef.current || []).forEach((p) => {
        if (p.profileUrl) existingMap.set(p.profileUrl.trim().toLowerCase(), p);
        if (p.name) existingMap.set(p.name.trim().toLowerCase(), p);
      });

      const merged = freshParsed.map((item) => {
        const existing =
          existingMap.get(item.profileUrl?.trim().toLowerCase()) ||
          existingMap.get(item.name?.trim().toLowerCase());

        if (existing && existing.liveVerified) {
          return {
            ...item,
            name: existing.name || item.name,
            avatar: existing.avatar || item.avatar,
            completedLabs: existing.completedLabs || [],
            verifiedCount: existing.verifiedCount || 0,
            percentage: existing.percentage || 0,
            totalProfileBadges: existing.totalProfileBadges || 0,
            liveVerified: true,
          };
        }
        return item;
      });

      setParticipants(merged);
      persistParticipants(merged);
      setSheetError(null);
    } catch (err) {
      console.error('Error fetching participant sheet on page open:', err);
      if (!participantsRef.current || participantsRef.current.length === 0) {
        setSheetError(err.message || 'Could not load participant data from Google Sheet.');
      }
    } finally {
      setLoadingSheet(false);
    }
  }, [participantSheetUrl, persistParticipants]);

  // Trigger Sheet load on open
  useEffect(() => {
    fetchAndSyncOnOpen();
  }, [fetchAndSyncOnOpen]);

  // When participant list AND syllabus are ready, perform one on-open sync so latest data is fetched
  useEffect(() => {
    if (
      participants.length > 0 &&
      syllabusLabs.length > 0 &&
      !hasTriggeredInitialSync.current &&
      !syncStatus.syncing
    ) {
      hasTriggeredInitialSync.current = true;
      syncLiveProfiles(false);
    }
  }, [participants.length, syllabusLabs.length, syncLiveProfiles, syncStatus.syncing]);

  // Filtered and Sorted participants
  const filteredParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return p.name.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BADGES_DESC') {
          return b.verifiedCount - a.verifiedCount;
        }
        if (sortBy === 'NAME_ASC') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [participants, searchQuery, sortBy]);

  const handleParticipantClick = (e, participant) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    setInspectParticipant(participant);
  };

  const totalLabsCount = syllabusLabs.length;

  return (
    <div className="min-h-screen pb-24 relative overflow-x-clip selection:bg-google-blue/20 selection:text-google-blue transition-colors duration-500">
      {/* Exact Techfest Animated Aurora Background with Floating Glass Frames */}
      <AuroraBackground />

      {/* Query / Contact Dock (Left-Side Center Vertical) */}
      <ContactDock isAtTop={isAtTop} />

      {/* Social Handles Dock (Right-Side Center Vertical) */}
      <SocialDock isAtTop={isAtTop} />

      {/* Main Page Content Layer */}
      <div className="relative z-10">
        {/* Top Brand Header Bar with Logo */}
        <header className="w-full  z-30 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/gdgoc_sati_logo_black.png"
                alt="GDG on Campus SATI"
                className="h-10 sm:h-12 absolute sm:left-50 right-33  w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </header>

        {/* Header Banner - Exact UI matching GDGOC SATI Leaderboard */}
        <div className="relative pt-8 pb-10 border-b border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-google-green border border-google-blue/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4"
          >
            <span>Study Jam Leaderboard</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3"
          >
            <span className="text-google-blue">{eventTitle}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Track participant syllabus badges and lab completions for this Study Jam in real time.
          </motion.p>

          {/* Action buttons inside header */}
          <div className="mt-6 grid grid-cols-2 sm:flex items-center justify-center gap-3">
            <button
              onClick={() => setShowSyllabusModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-google-blue border border-blue-200 dark:border-blue-800 hover:bg-google-blue hover:text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <FaBookOpen size={11} />
              <span>Syllabus Labs ({totalLabsCount})</span>
            </button>

            {/* Roadmap Sheet Button */}
            {roadmapSheetUrl && (
              <a
                href={roadmapSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                title="Open Google Cloud Study Learn Roadmap Sheet"
              >
                <FaRoute size={12} />
                <span>Roadmap Sheet</span>
                <FaExternalLinkAlt size={9} className="opacity-70" />
              </a>
            )}

            {/* GitHub Scripts Button */}
            {githubScriptsUrl && (
              <a
                href={githubScriptsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/60 hover:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                title="Open Facilitator Program Solutions GitHub Repository"
              >
                <FaGithub size={13} />
                <span>GitHub Scripts</span>
                <FaExternalLinkAlt size={9} className="opacity-70" />
              </a>
            )}

            {/* Manual Sync Data Button - clicking forces fresh sync */}
            <button
              onClick={() => syncLiveProfiles(true)}
              disabled={syncStatus.syncing}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-google-blue font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title={
                lastSyncedAt
                  ? `Last synced: ${lastSyncedAt.toLocaleTimeString()} - Click to sync again`
                  : 'Fetch real-time updates directly from Google Cloud Skills Boost profiles'
              }
            >
              <FaSyncAlt
                size={11}
                className={syncStatus.syncing ? 'animate-spin text-google-blue' : ''}
              />
              <span>
                {syncStatus.syncing
                  ? `Syncing (${syncStatus.progress}/${syncStatus.total})...`
                  : 'Sync Data'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container with Sticky Controls Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        {/* Sticky Controls Bar */}
        <div className="sticky top-[34px] z-20 flex flex-col sm:flex-row items-center justify-between gap-2 py-1.5 px-3 sm:px-4 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-md mb-6">
          {/* Search Input synchronized with URL ?q= */}
          <div className="relative w-full sm:w-80 md:w-106">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search participants by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:border-google-blue text-xs text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {filteredParticipants.length}{' '}
              {filteredParticipants.length === 1 ? 'Participant' : 'Participants'}
            </span>

            {/* Sort Dropdown synchronized with URL ?sort= */}
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="w-full sm:w-44 flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-google-blue transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FaSortAmountDown className="text-google-blue text-xs shrink-0" />
                  <span className="truncate">
                    {sortBy === 'BADGES_DESC' ? 'Most Badges' : 'Name (A-Z)'}
                  </span>
                </div>
                <FaChevronDown
                  className={`text-slate-400 transition-transform duration-200 text-xs shrink-0 ${
                    isSortDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-full sm:w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/60 py-1.5 z-[100]">
                    {[
                      { key: 'BADGES_DESC', label: 'Most Badges Completed' },
                      { key: 'NAME_ASC', label: 'Name (A to Z)' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleSortChange(opt.key)}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          sortBy === opt.key
                            ? 'text-google-blue bg-blue-50/50 dark:bg-blue-900/20 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View Switcher synchronized with URL ?view= */}
            <ViewToggle view={viewMode} onViewChange={handleViewChange} />
          </div>
        </div>

        {/* Error Notice if Sheet fetch failed */}
        {sheetError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <p className="font-bold mb-1">Notice reading Google Sheet:</p>
              <p>{sheetError}</p>
              <p className="mt-1 text-[11px] opacity-80">
                Please make sure the Google Sheet is shared with &quot;Anyone with the link can view&quot; or published.
              </p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loadingSheet && participants.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <ListItemSkeleton key={n} />
            ))}
          </div>
        ) : filteredParticipants.length === 0 ? (
          /* Empty Search Filter State */
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm">
            <FaUserGraduate className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No participants match your search criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Try adjusting your search query.
            </p>
            <button
              onClick={handleResetSearch}
              className="px-4 py-2 rounded-xl bg-google-blue text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-xs cursor-pointer"
            >
              Reset Search
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* Table / List View */
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-3 sm:px-4 w-14 sm:w-16">S. No.</th>
                    <th className="py-3 px-4 min-w-[240px]">Participant</th>
                    <th className="py-3 px-4 min-w-[200px]">Syllabus Badges Completed</th>
                    <th className="py-3 px-4 text-right">Cloud Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredParticipants.map((p, index) => (
                    <tr
                      key={p.id}
                      onClick={(e) => handleParticipantClick(e, p)}
                      title="Click to inspect badges"
                      className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                    >
                      {/* Serial Number */}
                      <td className="py-3.5 px-3 sm:px-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>

                      {/* Participant: Avatar directly in front of name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p.name || 'User'
                              )}&background=4285F4&color=fff&bold=true&rounded=true&size=128`;
                            }}
                            className="w-10 h-10 rounded-full object-cover p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                            loading="lazy"
                          />
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-google-blue transition-colors truncate">
                            {p.name}
                          </p>
                        </div>
                      </td>

                      {/* Syllabus Badges Progress */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {p.verifiedCount} / {totalLabsCount} Labs
                          </span>
                          <span className="text-[10px] text-slate-400">({p.percentage}%)</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectParticipant(p);
                            }}
                            className="ml-auto text-[11px] text-google-blue font-semibold hover:underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-google-blue to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${p.percentage}%` }}
                          />
                        </div>
                      </td>

                      {/* Cloud Skills Boost Profile URL */}
                      <td className="py-3.5 px-4 text-right">
                        {p.profileUrl ? (
                          <a
                            href={p.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-google-blue group-hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-xs"
                            title="View official Cloud Skills Boost profile"
                          >
                            <span>Profile</span>
                            <FaExternalLinkAlt size={9} />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Cards / Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredParticipants.map((p, index) => (
              <div
                key={p.id}
                onClick={(e) => handleParticipantClick(e, p)}
                title="Click to inspect badges"
                className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-google-blue/40 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      S. No. #{index + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectParticipant(p);
                      }}
                      className="text-xs text-google-blue font-semibold hover:underline cursor-pointer"
                    >
                      View Badges
                    </button>
                  </div>

                  {/* Avatar directly in front of name */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          p.name || 'User'
                        )}&background=4285F4&color=fff&bold=true&rounded=true&size=128`;
                      }}
                      className="w-12 h-12 rounded-full object-cover p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-google-blue transition-colors truncate">
                        {p.name}
                      </h4>
                    </div>
                  </div>

                  {/* Badges Progress */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 mb-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600 dark:text-slate-300">
                        Syllabus Progress
                      </span>
                      <span className="text-google-blue font-bold">
                        {p.verifiedCount} / {totalLabsCount} Labs
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-google-blue to-emerald-500 rounded-full"
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {p.profileUrl ? (
                    <a
                      href={p.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-google-blue group-hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <span>Cloud Skills Boost Profile</span>
                      <FaExternalLinkAlt size={9} />
                    </a>
                  ) : (
                    <span className="block text-center text-xs text-slate-400 py-1">
                      No Profile Link Provided
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {inspectParticipant && (
          <BadgeInspectionModal
            participant={inspectParticipant}
            syllabusLabs={syllabusLabs}
            onClose={() => setInspectParticipant(null)}
          />
        )}
        {showSyllabusModal && (
          <SyllabusInfoModal
            syllabusLabs={syllabusLabs}
            sourceUrl={syllabusSourceUrl}
            onClose={() => setShowSyllabusModal(false)}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
