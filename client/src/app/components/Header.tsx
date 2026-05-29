"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, Clock, Bookmark, MapPin, Calendar, ChevronRight, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/* ─── Types ─── */
interface SavedTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibe: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itinerary: any[];
  savedAt: number;
}

/* ─── Dropdown Panel (shared by History & Saved Plans) ─── */
function NavDropdown({
  isOpen,
  onClose,
  title,
  icon: Icon,
  items,
  emptyMessage,
  onSelect,
  onClear,
  accentColor,
  dropdownRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  items: SavedTrip[];
  emptyMessage: string;
  onSelect: (trip: SavedTrip) => void;
  onClear?: () => void;
  accentColor: "amber" | "cyan";
  dropdownRef: React.Ref<HTMLDivElement>;
}) {
  const gradients = {
    amber: "from-amber-500 to-orange-500",
    cyan: "from-cyan-500 to-teal-500",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="nav-dropdown"
        >
          {/* Header */}
          <div className="nav-dropdown-header">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${gradients[accentColor]} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</span>
              {items.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {items.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onClear && items.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(); }}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                  title="Clear all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="nav-dropdown-list">
            {items.length === 0 ? (
              <div className="nav-dropdown-empty">
                <Icon className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs text-slate-400 dark:text-slate-500">{emptyMessage}</p>
              </div>
            ) : (
              items.map((trip, i) => (
                <motion.button
                  key={trip.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { onSelect(trip); onClose(); }}
                  className="nav-dropdown-item group"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[accentColor]} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-orange-600 dark:group-hover:text-cyan-400 transition-colors">
                      {trip.destination}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {trip.days}d
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 text-[11px]">·</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{trip.budget}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-orange-400 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Auth-aware header controls with History & Saved Plans dropdowns.
 *
 * - Logged out → orange "Login" button that triggers IBM App ID sign-in.
 * - Logged in  → History | Saved Plans | greeting + "Logout" button.
 */
export default function Header({
  recentTrips = [],
  savedPlans = [],
  onLoadTrip,
  onClearHistory,
}: {
  recentTrips?: SavedTrip[];
  savedPlans?: SavedTrip[];
  onLoadTrip?: (trip: SavedTrip) => void;
  onClearHistory?: () => void;
}) {
  const { data: session, status } = useSession();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const savedBtnRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        historyOpen &&
        historyRef.current &&
        !historyRef.current.contains(e.target as Node) &&
        historyBtnRef.current &&
        !historyBtnRef.current.contains(e.target as Node)
      ) {
        setHistoryOpen(false);
      }
      if (
        savedOpen &&
        savedRef.current &&
        !savedRef.current.contains(e.target as Node) &&
        savedBtnRef.current &&
        !savedBtnRef.current.contains(e.target as Node)
      ) {
        setSavedOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [historyOpen, savedOpen]);

  // Don't render until hydrated to avoid layout shift
  if (status === "loading") {
    return <div className="h-9 w-24 rounded-full bg-slate-200/50 dark:bg-slate-700/50 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {/* ─── History Button ─── */}
        <div className="relative">
          <motion.button
            ref={historyBtnRef}
            onClick={() => { setHistoryOpen((p) => !p); setSavedOpen(false); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`nav-icon-btn ${historyOpen ? "nav-icon-btn-active" : ""}`}
            title="Trip History"
          >
            <Clock className="w-4 h-4" />
            {recentTrips.length > 0 && (
              <span className="nav-icon-badge">{recentTrips.length}</span>
            )}
          </motion.button>
          <NavDropdown
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
            title="Trip History"
            icon={Clock}
            items={recentTrips}
            emptyMessage="No recent trips yet"
            onSelect={(trip) => onLoadTrip?.(trip)}
            onClear={onClearHistory}
            accentColor="amber"
            dropdownRef={historyRef}
          />
        </div>

        {/* ─── Saved Plans Button ─── */}
        <div className="relative">
          <motion.button
            ref={savedBtnRef}
            onClick={() => { setSavedOpen((p) => !p); setHistoryOpen(false); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`nav-icon-btn ${savedOpen ? "nav-icon-btn-active" : ""}`}
            title="Saved Plans"
          >
            <Bookmark className="w-4 h-4" />
            {savedPlans.length > 0 && (
              <span className="nav-icon-badge">{savedPlans.length}</span>
            )}
          </motion.button>
          <NavDropdown
            isOpen={savedOpen}
            onClose={() => setSavedOpen(false)}
            title="Saved Plans"
            icon={Bookmark}
            items={savedPlans}
            emptyMessage="No saved plans yet"
            onSelect={(trip) => onLoadTrip?.(trip)}
            accentColor="cyan"
            dropdownRef={savedRef}
          />
        </div>

        {/* ─── Divider ─── */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* ─── User Greeting ─── */}
        <AnimatePresence mode="wait">
          <motion.span
            key="greeting"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:inline-flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-orange-500 dark:text-cyan-400" />
            Hi, {session.user.name}
          </motion.span>
        </AnimatePresence>

        {/* ─── Logout ─── */}
        <motion.button
          onClick={() => signOut()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/30 transition-all duration-200 shadow-sm"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      onClick={() => signIn("appid")}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-orange-600 text-white px-5 py-2 rounded-full font-bold shadow-md hover:bg-orange-700 transition-colors duration-200 text-sm"
    >
      Login
    </motion.button>
  );
}
