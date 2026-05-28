"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Variants } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import {
    upsertUserProfile,
    getSavedTrips,
    saveTrip as cloudantSaveTrip,
    deleteTrip as cloudantDeleteTrip,
} from "@/lib/cloudant";
import {
    Plane,
    MapPin,
    Calendar,
    Wallet,
    Sparkles,
    Sun,
    Moon,
    AlertCircle,
    X,
    Compass,
    Globe,
    Cloud,
    TreePalm,
    Hotel,
    Map,
    ExternalLink,
    Navigation,
    Trash2,
    ImageIcon,
    Ticket,
    Heart,
    Utensils,
    Camera,
    Mic,
    Mountain,
    Music,
    LogIn,
    Bookmark,
    Share2,
    Check,
    Link2,
    Plus,
    Minus,
    User,
    Users,
    Baby,
    Backpack,
    Gem,
    Landmark,
    Palmtree,
    PartyPopper,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import Header from "../components/Header";
import FlightSearch from "../components/FlightSearch";
import ItinerarySkeleton from "../components/ItinerarySkeleton";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

/* ─── Geocoding Types ─── */
interface GeoSuggestion {
    id: number;
    name: string;
    country: string;
    admin1?: string;
}

/* ─── Types ─── */
interface Activity {
    id?: string;
    isCustom?: boolean;
    time: string;
    place: string;
    description: string;
    imageUrl?: string;
    tourUrl?: string;
    category?: string;
}
interface DayPlan {
    day: number;
    theme: string;
    activities: Activity[];
}
interface SavedTrip {
    id: string;
    destination: string;
    days: number;
    budget: string;
    vibe: string;
    itinerary: DayPlan[];
    savedAt: number;
}

/* ─── localStorage Key ─── */
const STORAGE_KEY = "trekko-recent-trips";
const SAVED_PLANS_KEY = "trekko-saved-plans";
const MAX_RECENT = 5;
const MAX_SAVED = 20;

/* ─── Loading Messages ─── */
const LOADING_MESSAGES = [
    "Searching for hidden gems…",
    "Booking the best spots…",
    "Finding local secrets…",
    "Crafting your perfect days…",
    "Mapping out adventures…",
    "Finalizing your itinerary…",
];

/* ─── Floating Background Decor ─── */
function FloatingDecor() {
    const items = [
        { Icon: Sun, x: "8%", y: "12%", size: 32, delay: 0, duration: 7, color: "text-amber-300/20" },
        { Icon: Cloud, x: "75%", y: "8%", size: 38, delay: 2, duration: 9, color: "text-sky-300/15" },
        { Icon: TreePalm, x: "90%", y: "35%", size: 30, delay: 1, duration: 8, color: "text-emerald-400/15" },
        { Icon: Cloud, x: "20%", y: "45%", size: 28, delay: 4, duration: 10, color: "text-sky-200/12" },
        { Icon: Sun, x: "85%", y: "70%", size: 24, delay: 3, duration: 6, color: "text-orange-300/15" },
        { Icon: TreePalm, x: "5%", y: "75%", size: 26, delay: 5, duration: 9, color: "text-emerald-300/12" },
        { Icon: Cloud, x: "55%", y: "25%", size: 22, delay: 6, duration: 11, color: "text-sky-200/10" },
        { Icon: Plane, x: "40%", y: "5%", size: 20, delay: 1.5, duration: 8, color: "text-orange-300/12" },
    ];

    return (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            {/* Warm gradient blobs */}
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-amber-200/15 dark:bg-cyan-500/5 rounded-full blur-3xl animate-float" />
            <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-cyan-200/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: "3s" }} />
            <div className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] bg-orange-200/10 dark:bg-orange-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "5s" }} />
            <div className="absolute top-2/3 left-1/3 w-[350px] h-[350px] bg-teal-200/8 dark:bg-teal-500/5 rounded-full blur-3xl animate-float-slower" style={{ animationDelay: "7s" }} />

            {/* Floating icons */}
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${item.color}`}
                    style={{ left: item.x, top: item.y }}
                    animate={{
                        y: [0, -15, 0, 10, 0],
                        rotate: [0, 5, -5, 3, 0],
                        scale: [1, 1.05, 0.95, 1.02, 1],
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        delay: item.delay,
                        ease: "easeInOut",
                    }}
                >
                    <item.Icon size={item.size} />
                </motion.div>
            ))}
        </div>
    );
}


/* ─── Quick Booking Buttons ─── */
function QuickBookings({ destination }: { destination: string }) {
    const encoded = encodeURIComponent(destination);
    const bookings = [
        {
            label: "Book Flights",
            emoji: "✈️",
            icon: Plane,
            href: `https://www.skyscanner.com/transport/flights-from/anywhere/to/${encoded}`,
            className: "booking-btn booking-btn-flights",
        },
        {
            label: "Find Hotels",
            emoji: "🏨",
            icon: Hotel,
            href: `https://www.booking.com/searchresults.html?ss=${encoded}`,
            className: "booking-btn booking-btn-hotels",
        },
        {
            label: "Book Local Tours",
            emoji: "🗺️",
            icon: Map,
            href: `https://www.viator.com/searchResults/all?text=${encoded}`,
            className: "booking-btn booking-btn-tours",
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6"
        >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Quick Bookings
            </p>
            <div className="flex flex-wrap gap-3">
                {bookings.map((b, i) => (
                    <motion.a
                        key={b.label}
                        href={b.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={b.className}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <span>{b.emoji}</span>
                        {b.label}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                    </motion.a>
                ))}
            </div>
        </motion.div>
    );
}

/* ─── Category Icon for Activity Cards ─── */
function CategoryIcon({ category, time }: { category?: string; time: string }) {
    const cat = (category || "").toLowerCase();
    if (cat.includes("food") || cat.includes("restaurant") || cat.includes("dining") || cat.includes("eat"))
        return <Utensils className="w-4 h-4 text-white" />;
    if (cat.includes("sightsee") || cat.includes("photo") || cat.includes("view"))
        return <Camera className="w-4 h-4 text-white" />;
    if (cat.includes("adventure") || cat.includes("hike") || cat.includes("trek") || cat.includes("outdoor"))
        return <Mountain className="w-4 h-4 text-white" />;
    if (cat.includes("culture") || cat.includes("museum") || cat.includes("temple") || cat.includes("heritage"))
        return <Globe className="w-4 h-4 text-white" />;
    if (cat.includes("nightlife") || cat.includes("music") || cat.includes("party") || cat.includes("bar"))
        return <Music className="w-4 h-4 text-white" />;
    if (cat.includes("romantic") || cat.includes("couple") || cat.includes("date"))
        return <Heart className="w-4 h-4 text-white" />;
    if (cat.includes("hotel") || cat.includes("relax") || cat.includes("spa") || cat.includes("resort"))
        return <Hotel className="w-4 h-4 text-white" />;
    // fallback based on time of day
    if (time === "Morning") return <Sun className="w-4 h-4 text-white" />;
    if (time === "Afternoon") return <Compass className="w-4 h-4 text-white" />;
    return <Moon className="w-4 h-4 text-white" />;
}

/* ─── ActivityCard Component (Marina Bay style) ─── */
function ActivityCard({
    activity,
    destination,
    onZoom,
    animDelay,
}: {
    activity: Activity;
    destination: string;
    onZoom: (url: string) => void;
    animDelay: number;
}) {
    const imageUrl = activity.imageUrl || null;
    const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(
        imageUrl ? "loading" : "error"
    );

    const viatorUrl =
        activity.tourUrl ||
        `https://www.viator.com/searchResults/all?text=${encodeURIComponent(activity.place + " " + destination)}`;

    return (
        <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: animDelay }}
            className="activity-card"
        >
            <div className="activity-card-left">
                <span className="activity-card-time">{activity.time === "Morning" ? "10:00 AM" : activity.time === "Afternoon" ? "2:00 PM" : "7:00 PM"}</span>
                <div className="activity-card-icon">
                    <CategoryIcon category={activity.category} time={activity.time} />
                </div>
            </div>

            <div className="activity-card-center">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="activity-card-title">{activity.place}</h4>
                    <a
                        href={`https://www.google.com/maps/search/${encodeURIComponent(activity.place + " in " + destination)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="navigate-link"
                    >
                        <Navigation className="w-3 h-3" />
                        Navigate
                    </a>
                </div>
                <p className="activity-card-desc">{activity.description}</p>
                <a
                    href={viatorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="activity-card-tour"
                >
                    <Ticket className="w-3.5 h-3.5" />
                    Book a Tour
                </a>
            </div>

            <div
                className="activity-card-thumb"
                onClick={() => { if (imageUrl && imgStatus === "loaded") onZoom(imageUrl); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" && imageUrl && imgStatus === "loaded") onZoom(imageUrl); }}
            >
                {!imageUrl || imgStatus === "error" ? (
                    <div className="activity-card-thumb-fallback">
                        <ImageIcon className="w-5 h-5 text-orange-300 dark:text-slate-400" />
                    </div>
                ) : (
                    <>
                        {imgStatus === "loading" && (
                            <div className="absolute inset-0 rounded-xl bg-shimmer animate-shimmer z-10" />
                        )}
                        <Image
                            src={imageUrl}
                            alt={activity.place}
                            width={80}
                            height={80}
                            unoptimized={true}
                            loading="lazy"
                            className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${imgStatus === "loaded" ? "opacity-100" : "opacity-0"}`}
                            onLoad={() => setImgStatus("loaded")}
                            onError={() => setImgStatus("error")}
                        />
                    </>
                )}
            </div>
        </motion.div>
    );
}

/* ─── Add Activity Form ─── */
function AddActivityForm({
    onAdd,
    onCancel,
}: {
    day: number;
    destination: string;
    onAdd: (activity: Activity) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchSuggestions = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`
                );
                const data = await res.json();
                if (data.results) {
                    setSuggestions(data.results);
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch {
                setSuggestions([]);
            }
        }, 300);
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="mt-4 relative w-full overflow-visible" ref={dropdownRef}>
            <div className="flex items-center gap-2">
                <input
                    autoFocus
                    type="text"
                    placeholder="Type an activity or place..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        fetchSuggestions(e.target.value);
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                    onClick={onCancel}
                    className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full z-[99999] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto py-1"
                    >
                        {suggestions.map((s) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onAdd({
                                            id: Date.now().toString(),
                                            isCustom: true,
                                            time: "Flexible",
                                            place: s.name,
                                            description: `Custom activity added in ${s.name}, ${s.country}`,
                                            category: "custom",
                                        });
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors flex flex-col border-b border-gray-50 dark:border-slate-700/50 last:border-b-0"
                                >
                                    <span className="font-semibold">{s.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {s.admin1 ? `${s.admin1}, ` : ""}
                                        {s.country}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Day Card Gradient Accent ─── */
const DAY_ACCENTS = [
    "from-orange-500 to-amber-400",
    "from-cyan-500 to-teal-400",
    "from-rose-500 to-pink-400",
    "from-emerald-500 to-green-400",
    "from-violet-500 to-purple-400",
    "from-sky-500 to-blue-400",
    "from-amber-500 to-yellow-400",
];

/* ─── Splash Banner ─── */
const splashContainerVariants: Variants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.18, delayChildren: 0.3 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        filter: "blur(10px)",
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    },
};

const splashWordVariants: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

function SplashBanner({ onStart }: { onStart: () => void }) {
    const headline = "Get started on your trip with Trekko";
    const words = headline.split(" ");

    return (
        <motion.div
            key="splash-banner"
            className="splash-banner"
            variants={splashContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <div className="splash-particles">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="splash-particle"
                        style={{
                            left: `${15 + i * 14}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            width: `${6 + i * 3}px`,
                            height: `${6 + i * 3}px`,
                        }}
                        animate={{
                            y: [0, -20, 0, 15, 0],
                            x: [0, 10, -5, 8, 0],
                            opacity: [0.3, 0.7, 0.4, 0.6, 0.3],
                            scale: [1, 1.2, 0.9, 1.1, 1],
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="splash-content">
                <motion.div variants={splashWordVariants} className="splash-tagline">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Travel Planner
                </motion.div>

                <h1 className={`splash-headline ${playfair.className}`}>
                    {words.map((word, i) => (
                        <motion.span
                            key={i}
                            variants={splashWordVariants}
                            className={word === "Trekko" ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-teal-400" : ""}
                        >
                            {word}{" "}
                        </motion.span>
                    ))}
                </h1>

                <motion.p variants={splashWordVariants} className="splash-subtext">
                    Discover hidden gems, craft perfect itineraries, and explore the world — all in seconds.
                </motion.p>

                <motion.div variants={splashWordVariants}>
                    <motion.button
                        onClick={onStart}
                        className="splash-cta"
                        whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(251, 191, 36, 0.5), 0 0 80px rgba(249, 115, 22, 0.3)" }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <Plane className="w-5 h-5" />
                        Start Journey
                        <motion.span
                            className="splash-cta-arrow"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            →
                        </motion.span>
                    </motion.button>
                </motion.div>
            </div>

            <div className="splash-wave">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <motion.path
                        d="M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z"
                        fill="rgba(255,255,255,0.05)"
                        animate={{
                            d: [
                                "M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z",
                                "M0,60 C360,40 720,100 1080,60 C1260,40 1380,80 1440,60 L1440,120 L0,120 Z",
                                "M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z",
                            ],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                </svg>
            </div>
        </motion.div>
    );
}

function ImageLightbox({
    imageUrl,
    onClose,
}: {
    imageUrl: string | null;
    onClose: () => void;
}) {
    if (!imageUrl || typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                key="lightbox-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out p-4"
                onClick={onClose}
            >
                <motion.img
                    key={imageUrl}
                    src={imageUrl}
                    alt="Zoomed activity photo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain cursor-default"
                    onClick={(e) => e.stopPropagation()}
                />
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

const DESTINATION_NAMES = [
    "The Maldives", "Bora Bora, French Polynesia", "Bali, Indonesia", "Goa, India",
    "Seychelles", "Swiss Alps, Switzerland", "Leh-Ladakh, India", "Banff, Canada",
    "Queenstown, New Zealand", "Munnar, India", "Paris, France", "Tokyo, Japan",
    "New York City, USA", "Singapore", "Dubai, UAE", "Santorini, Greece",
    "Kyoto, Japan", "Rome, Italy", "Jaipur, India", "Marrakech, Morocco"
];

const DESTINATION_IMAGES = [
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581793746485-04698e79a4e8?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534008897995-27a23e859048?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0f?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0f?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0f?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1557690756-627a4e73a5a7?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=2000&auto=format&fit=crop"
];

export default function Home() {
    const { data: session } = useSession();
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const [hasStarted, setHasStarted] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % DESTINATION_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);
    const [destination, setDestination] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [days, setDays] = useState(5);
    const [travelers, setTravelers] = useState("Couple");
    const [budget, setBudget] = useState("Moderate");
    const [travelStyle, setTravelStyle] = useState("Culture");
    const [loading, setLoading] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);
    const [itinerary, setItinerary] = useState<DayPlan[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recentTrips, setRecentTrips] = useState<SavedTrip[]>([]);
    const [savedPlans, setSavedPlans] = useState<SavedTrip[]>([]);
    const [bannerImageError, setBannerImageError] = useState(false);
    const [selectedDestinationImage, setSelectedDestinationImage] = useState<string | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [bannerLoading, setBannerLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [addingActivityDay, setAddingActivityDay] = useState<number | null>(null);
    const [cloudantSyncing, setCloudantSyncing] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(0);

    const resultsRef = useRef<HTMLDivElement>(null);

    const moodBoardImages = useMemo(() => {
        if (!itinerary) return [];

        const imageUrls = (itinerary || [])
            .flatMap((dayPlan) =>
                (dayPlan?.activities || []).map((activity) => activity?.imageUrl)
            )
            .filter((url): url is string => Boolean(url));

        const uniqueImages = Array.from(new Set(imageUrls));
        const fallbackImage =
            selectedDestinationImage ||
            `https://source.unsplash.com/1600x900/?${encodeURIComponent(destination || "travel destination")}`;

        while (uniqueImages.length < 5) {
            uniqueImages.push(fallbackImage);
        }

        return uniqueImages.slice(0, 5);
    }, [itinerary, selectedDestinationImage, destination]);

    const removeCustomActivity = (dayIndex: number, activityId: string) => {
        setItinerary((prev) => {
            if (!prev) return prev;
            return prev.map((dp, i) => {
                if (i === dayIndex) {
                    return {
                        ...dp,
                        activities: dp.activities.filter((act) => act.id !== activityId),
                    };
                }
                return dp;
            });
        });
    };

    const handleNextDay = useCallback(() => {
        setActiveDayIndex((prev) => {
            if (!itinerary || itinerary.length === 0) return prev;
            return Math.min(prev + 1, itinerary.length - 1);
        });
    }, [itinerary]);

    const handlePrevDay = useCallback(() => {
        setActiveDayIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const fetchSuggestions = useCallback((query: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
                );
                const data = await res.json();
                if (data.results) {
                    setSuggestions(
                        data.results.map((r: { id: number; name: string; country: string; admin1?: string }) => ({
                            id: r.id,
                            name: r.name,
                            country: r.country,
                            admin1: r.admin1,
                        }))
                    );
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } catch {
                setSuggestions([]);
            }
        }, 300);
    }, []);

    const handleSelectSuggestion = useCallback((suggestion: GeoSuggestion) => {
        const placeName = `${suggestion.name}, ${suggestion.country}`;
        setDestination(placeName);
        setShowSuggestions(false);
        setSuggestions([]);
        setBannerImageError(false);
        setSelectedDestinationImage(null);
        setBannerLoading(true);

        const wikiQuery = suggestion.name.replace(/ /g, "_");
        fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(wikiQuery)}&origin=*`)
            .then((res) => res.json())
            .then((data) => {
                const pages = data?.query?.pages;
                if (!pages) { setBannerImageError(true); return; }
                const pageId = Object.keys(pages)[0];
                const url = pageId && pageId !== "-1" ? pages[pageId]?.original?.source : null;
                if (url) {
                    setSelectedDestinationImage(url);
                } else {
                    setBannerImageError(true);
                }
            })
            .catch(() => {
                setBannerImageError(true);
            })
            .finally(() => setBannerLoading(false));
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Load from localStorage (immediate) then sync from Cloudant ──
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setRecentTrips(JSON.parse(stored));
        } catch { /* ignore */ }
        try {
            const stored = localStorage.getItem(SAVED_PLANS_KEY);
            if (stored) setSavedPlans(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    // ── On sign-in: upsert user profile + fetch saved trips from Cloudant ──
    useEffect(() => {
        if (!session?.user?.email) return;
        const email = session.user.email;
        const name = session.user.name || email;

        // Upsert user profile (fire-and-forget)
        upsertUserProfile(email, name);

        // Fetch saved trips from Cloudant and merge with localStorage
        setCloudantSyncing(true);
        getSavedTrips(email)
            .then((cloudTrips) => {
                if (cloudTrips.length === 0) return;
                // Convert Cloudant docs to SavedTrip shape
                const mapped: SavedTrip[] = cloudTrips.map((t) => ({
                    id: `${t.savedAt}`,
                    destination: t.destination,
                    days: t.days,
                    budget: t.budget,
                    vibe: t.vibe,
                    itinerary: t.itinerary,
                    savedAt: t.savedAt,
                }));
                setSavedPlans((prev) => {
                    // Merge: cloud wins for any matching destination
                    const localOnly = prev.filter(
                        (p) => !mapped.some((m) => m.destination.toLowerCase() === p.destination.toLowerCase())
                    );
                    const merged = [...mapped, ...localOnly].slice(0, MAX_SAVED);
                    try {
                        localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(merged));
                    } catch { /* ignore */ }
                    return merged;
                });
            })
            .finally(() => setCloudantSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user?.email]);

    const saveTrip = useCallback(
        (dest: string, d: number, b: string, v: string, trip: DayPlan[]) => {
            setRecentTrips((prev) => {
                const newTrip: SavedTrip = {
                    id: `${Date.now()}`,
                    destination: dest,
                    days: d,
                    budget: b,
                    vibe: v,
                    itinerary: trip,
                    savedAt: Date.now(),
                };
                const updated = [newTrip, ...prev.filter((t) => t.destination.toLowerCase() !== dest.toLowerCase())].slice(0, MAX_RECENT);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } catch {
                }
                return updated;
            });
        },
        []
    );

    function loadSavedTrip(saved: SavedTrip) {
        setDestination(saved.destination);
        setDays(saved.days);
        setBudget(saved.budget);
        setTravelStyle(saved.vibe || "Culture");
        setItinerary(saved.itinerary);
        setError(null);
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
    }

    function clearHistory() {
        setRecentTrips([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
        }
    }

    const showToast = useCallback((message: string, type: "success" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const savePlan = useCallback(async () => {
        if (!itinerary || !destination.trim()) return;
        const savedAt = Date.now();
        const newPlan: SavedTrip = {
            id: `${savedAt}`,
            destination: destination.trim(),
            days,
            budget,
            vibe: travelStyle,
            itinerary,
            savedAt,
        };
        // 1. Update local state + localStorage immediately
        setSavedPlans((prev) => {
            const updated = [newPlan, ...prev.filter((p) => p.destination.toLowerCase() !== destination.trim().toLowerCase())].slice(0, MAX_SAVED);
            try { localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
        setIsSaved(true);
        showToast("Plan saved!", "success");

        // 2. Persist to Cloudant in background
        if (session?.user?.email) {
            setCloudantSyncing(true);
            await cloudantSaveTrip(session.user.email, {
                destination: destination.trim(),
                days,
                budget,
                vibe: travelStyle,
                itinerary,
                savedAt,
            }).finally(() => setCloudantSyncing(false));
        }
    }, [itinerary, destination, days, budget, travelStyle, showToast, session]);

    const removeSavedPlan = useCallback(async () => {
        if (!destination.trim()) return;
        const destLower = destination.trim().toLowerCase();
        // Find the plan's savedAt to use as Cloudant doc ID
        const plan = savedPlans.find((p) => p.destination.toLowerCase() === destLower);

        // 1. Update local state + localStorage immediately
        setSavedPlans((prev) => {
            const updated = prev.filter((p) => p.destination.toLowerCase() !== destLower);
            try { localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
        setIsSaved(false);
        showToast("Plan removed from saved.", "info");

        // 2. Delete from Cloudant in background
        if (session?.user?.email && plan) {
            setCloudantSyncing(true);
            await cloudantDeleteTrip(session.user.email, plan.savedAt)
                .finally(() => setCloudantSyncing(false));
        }
    }, [destination, showToast, session, savedPlans]);

    useEffect(() => {
        if (!itinerary || !destination.trim()) {
            setIsSaved(false);
            return;
        }
        const destLower = destination.trim().toLowerCase();
        const alreadySaved = savedPlans.some((p) => p.destination.toLowerCase() === destLower);
        setIsSaved(alreadySaved);
    }, [itinerary, destination, savedPlans]);

    useEffect(() => {
        if (!itinerary || itinerary.length === 0) {
            setActiveDayIndex(0);
            return;
        }
        setActiveDayIndex((prev) => Math.min(prev, itinerary.length - 1));
    }, [itinerary]);

    const sharePlan = useCallback(async () => {
        const shareData = {
            title: `My ${days}-day trip to ${destination} — Trekko`,
            text: `Check out my ${days}-day trip plan to ${destination}, crafted by Trekko AI!`,
            url: window.location.href,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch {
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast("Link copied to clipboard!", "info");
            } catch {
                showToast("Could not copy link", "info");
            }
        }
    }, [days, destination, showToast]);

    const handleVoiceSearch = () => {
        interface ISpeechRecognitionEvent {
            resultIndex: number;
            results: {
                [index: number]: {
                    [index: number]: {
                        transcript: string;
                    };
                };
            };
        }

        interface ISpeechRecognitionErrorEvent {
            error: string;
        }

        interface ISpeechRecognition {
            new (): ISpeechRecognitionInstance;
        }

        interface ISpeechRecognitionInstance {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            onstart: () => void;
            onresult: (event: ISpeechRecognitionEvent) => void;
            onerror: (event: ISpeechRecognitionErrorEvent) => void;
            onend: () => void;
            start: () => void;
        }

        // Check for browser support
        const SpeechRecognition = (window as unknown as { SpeechRecognition?: ISpeechRecognition; webkitSpeechRecognition?: ISpeechRecognition }).SpeechRecognition ||
            (window as unknown as { SpeechRecognition?: ISpeechRecognition; webkitSpeechRecognition?: ISpeechRecognition }).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support voice search. Try Chrome!");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            // Remove any trailing period the API sometimes adds
            const cleanTranscript = transcript.replace(/\.$/, '');
            
            // Update the destination state with the spoken text
            setDestination(cleanTranscript);
            fetchSuggestions(cleanTranscript);
            setIsListening(false);
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
            console.error("Voice search error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!destination.trim()) return;

        setLoading(true);
        setItinerary(null);
        setError(null);
        setMsgIndex(0);

        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        }, 2200);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://trekko-d9ek.onrender.com";
            const res = await fetch(`${backendUrl}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ destination, days, budget, vibe: travelStyle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setItinerary(data.trip);
            setIsSaved(false);
            saveTrip(destination.trim(), days, budget, travelStyle, data.trip);
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to generate itinerary");
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    }

    return (
        <AnimatePresence mode="wait">
            {!hasStarted ? (
                <SplashBanner key="splash" onStart={() => setHasStarted(true)} />
            ) : (
                <motion.div
                    key="main-app"
                    className="relative min-h-screen overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    <FloatingDecor />

                    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
                        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
                                    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <linearGradient id="logoGradDash" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                                                <stop offset="0%" stopColor="#f97316" />
                                                <stop offset="100%" stopColor="#06b6d4" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M4 27L12 11L17 19L22 13L30 27Z" fill="url(#logoGradDash)" opacity="0.9" />
                                        <circle cx="22" cy="9" r="3.5" fill="url(#logoGradDash)" />
                                        <path d="M22 12.5 L22 16" stroke="url(#logoGradDash)" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span className="text-lg font-light tracking-[0.18em] uppercase text-white" style={{letterSpacing: '0.18em'}}>
                                        Trekko
                                    </span>
                                </Link>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2"
                            >
                                {itinerary && (
                                    <div className="tooltip-wrapper" data-tooltip="Save Current Plan for Later">
                                        <button
                                            onClick={isSaved ? removeSavedPlan : savePlan}
                                            className="nav-action-btn"
                                            disabled={cloudantSyncing}
                                        >
                                            {cloudantSyncing ? (
                                                <motion.span
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full inline-block"
                                                />
                                            ) : isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                            <span className="hidden sm:inline">
                                                {cloudantSyncing ? "Syncing…" : isSaved ? "Saved" : "Save Itinerary"}
                                            </span>
                                        </button>
                                    </div>
                                )}

                                <ThemeToggle />

                                <Header
                                    recentTrips={recentTrips}
                                    savedPlans={savedPlans}
                                    onLoadTrip={loadSavedTrip}
                                    onClearHistory={clearHistory}
                                />
                            </motion.div>
                        </div>
                    </nav>



                    <section className="relative w-full min-h-[60vh] overflow-hidden flex flex-col items-center justify-center pt-24">
                        <AnimatePresence>
                            <motion.div
                                key={currentBgIndex}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute inset-0 w-full h-full z-0"
                                style={{
                                    backgroundImage: `url('${DESTINATION_IMAGES[currentBgIndex]}')`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />
                        </AnimatePresence>

                        <div className="absolute bottom-6 right-6 z-20 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            <span className="text-white/90 text-sm font-medium tracking-wide drop-shadow-md capitalize truncate max-w-[200px]">
                                {DESTINATION_NAMES[currentBgIndex] || 'Beautiful Destination'}
                            </span>
                        </div>

                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-black/60 to-[#0f172a]" />

                        <div className="relative z-20 w-full max-w-4xl px-4 pb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                                className="max-w-2xl mx-auto"
                            >
                                <form
                                    onSubmit={handleSubmit}
                                    className="w-full max-w-3xl bg-[#FFFBF2]/40 dark:bg-[#1e2330]/80 backdrop-blur-2xl border border-amber-900/10 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl mx-auto transition-colors duration-300"
                                >
                                    <AnimatePresence>
                                        {(selectedDestinationImage || bannerLoading) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                                className="overflow-hidden rounded-2xl relative"
                                            >
                                                <motion.div
                                                    initial={{ scale: 1.1 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ duration: 0.7, ease: "easeOut" }}
                                                    className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden"
                                                >
                                                    {bannerLoading ? (
                                                        <div className="w-full h-full bg-shimmer animate-shimmer rounded-2xl" />
                                                    ) : !bannerImageError && selectedDestinationImage ? (
                                                        <>
                                                            <Image
                                                                src={selectedDestinationImage}
                                                                alt={`${destination} destination`}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                                className="object-cover rounded-lg"
                                                                onError={() => setBannerImageError(true)}
                                                            />
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-500 to-cyan-500 flex items-center justify-center">
                                                            <div className="text-center">
                                                                <MapPin className="w-8 h-8 text-white/80 mx-auto mb-2" />
                                                                <p className="text-white font-bold text-xl drop-shadow-md">{destination}</p>
                                                                <p className="text-white/70 text-sm mt-1">Destination Preview</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.3 }}
                                                        className="absolute bottom-4 left-4 right-4 flex items-end justify-between"
                                                    >
                                                        <div>
                                                            <p className="text-white font-bold text-lg drop-shadow-md">{destination}</p>
                                                            <p className="text-white/80 text-xs drop-shadow-sm">Your next adventure awaits</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDestinationImage(null)}
                                                            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-all"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </motion.div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="mb-6">
                                        <label className="text-sm text-gray-600 dark:text-gray-400 font-medium px-1 mb-2 block transition-colors duration-300">Where to?</label>
                                        <div ref={suggestionsRef} className="relative w-full">
                                            <div className="relative flex items-center w-full bg-white/40 dark:bg-[#151923] border border-gray-200/50 dark:border-white/10 rounded-xl overflow-hidden group hover:border-teal-500/50 dark:hover:border-teal-400/50 transition-all duration-300 focus-within:ring-1 focus-within:ring-teal-500/50 dark:focus-within:ring-teal-400/50 animate-glow-pulse">
                                                <div className="absolute left-4 flex items-center pointer-events-none">
                                                    <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search Paris, Tokyo, Bali..."
                                                    value={destination}
                                                    onChange={(e) => {
                                                        setDestination(e.target.value);
                                                        fetchSuggestions(e.target.value);
                                                    }}
                                                    onFocus={() => {
                                                        if (suggestions.length > 0) setShowSuggestions(true);
                                                    }}
                                                    autoComplete="off"
                                                    required
                                                    className="w-full bg-transparent text-gray-900 dark:text-white font-medium py-3 pl-12 pr-12 focus:outline-none placeholder-gray-500/70 dark:placeholder-gray-500"
                                                />
                                                {/* The Voice Search Button */}
                                                <button
                                                    onClick={handleVoiceSearch}
                                                    type="button"
                                                    className={`absolute right-2 p-2 rounded-full transition-all duration-300 ${
                                                        isListening 
                                                            ? 'bg-red-500/20 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                                                            : 'text-gray-500 hover:text-teal-600 hover:bg-black/5 dark:hover:bg-white/5'
                                                    }`}
                                                    title="Search by voice"
                                                >
                                                    <Mic className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <AnimatePresence>
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                        exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                                        style={{ transformOrigin: "top" }}
                                                        className="absolute z-50 left-0 right-0 top-[calc(100%+8px)] rounded-xl overflow-hidden bg-[#1e2330] shadow-2xl border border-white/10"
                                                    >
                                                        {suggestions.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => handleSelectSuggestion(s)}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors duration-150 border-b border-white/5 last:border-b-0"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                                                                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        {s.admin1 ? `${s.admin1}, ` : ""}{s.country}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2 w-full">
                                            <label className="text-sm text-stone-600 dark:text-gray-400 font-medium px-1 mb-2 block transition-colors duration-300">Number of Days</label>
                                            <div className="relative flex items-center w-full bg-white/40 dark:bg-[#151923] border border-amber-900/10 dark:border-white/10 rounded-xl overflow-hidden group hover:border-teal-500/50 dark:hover:border-teal-400/50 transition-all duration-300 focus-within:ring-1 focus-within:ring-teal-500/50 dark:focus-within:ring-teal-400/50 animate-glow-pulse shadow-sm">
                                                <div className="absolute left-4 flex items-center pointer-events-none">
                                                    <Calendar className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={days}
                                                    onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full bg-transparent text-stone-800 dark:text-white font-medium text-lg py-3 pl-12 pr-24 focus:outline-none appearance-none"
                                                />
                                                <div className="absolute right-2 flex items-center gap-1 bg-[#2a303f] p-1 rounded-lg border border-white/5 shadow-inner">
                                                    <button
                                                        onClick={() => setDays(prev => Math.max(1, prev - 1))}
                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                                        type="button"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                                    <button
                                                        onClick={() => setDays(prev => prev + 1)}
                                                        className="p-1.5 text-gray-400 hover:text-teal-400 hover:bg-white/10 rounded-md transition-colors"
                                                        type="button"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <label className="text-sm text-stone-600 dark:text-gray-400 font-medium px-1 mb-2 block transition-colors duration-300">Who is traveling?</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[{ id: 'Solo', icon: User }, { id: 'Couple', icon: Users }, { id: 'Family', icon: Baby }].map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => setTravelers(item.id)}
                                                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all duration-300 
                                ${travelers === item.id
                                                                    ? 'border-teal-500 bg-teal-50/80 text-teal-700 shadow-[0_0_15px_rgba(20,184,166,0.15)] dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-400 dark:shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                                                                    : 'bg-white/40 border-amber-900/10 text-stone-500 hover:border-amber-900/20 hover:text-stone-800 shadow-sm dark:bg-[#151923] dark:border-white/10 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-gray-200'
                                                                }`}
                                                        >
                                                            <item.icon className="w-5 h-5" />
                                                            <span className="text-xs font-semibold">{item.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm text-stone-600 dark:text-gray-400 font-medium px-1 mb-2 block transition-colors duration-300">Budget</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[{ id: 'Backpacker', icon: Backpack }, { id: 'Moderate', icon: Wallet }, { id: 'Luxury', icon: Gem }].map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => setBudget(item.id)}
                                                            className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all duration-300 
                                ${budget === item.id
                                                                    ? 'border-teal-500 bg-teal-50/80 text-teal-700 shadow-[0_0_15px_rgba(20,184,166,0.15)] dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-400 dark:shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                                                                    : 'bg-white/40 border-amber-900/10 text-stone-500 hover:border-amber-900/20 hover:text-stone-800 shadow-sm dark:bg-[#151923] dark:border-white/10 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-gray-200'
                                                                }`}
                                                        >
                                                            <item.icon className="w-5 h-5" />
                                                            <span className="text-xs font-semibold">{item.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 mt-4">
                                            <label className="text-sm text-stone-600 dark:text-gray-400 font-medium px-1 mb-2 block transition-colors duration-300">Travel Style</label>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                {[
                                                    { id: 'Culture', icon: Landmark, label: 'Culture' },
                                                    { id: 'Relax', icon: Palmtree, label: 'Relax' },
                                                    { id: 'Adventure', icon: Mountain, label: 'Adventure' },
                                                    { id: 'Romantic', icon: Heart, label: 'Romantic' },
                                                    { id: 'Party', icon: PartyPopper, label: 'Party' }
                                                ].map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => setTravelStyle(item.id)}
                                                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all duration-300 
                              ${travelStyle === item.id
                                                                ? 'border-teal-500 bg-teal-50/80 text-teal-700 shadow-[0_0_15px_rgba(20,184,166,0.15)] dark:border-teal-400 dark:bg-teal-400/10 dark:text-teal-400 dark:shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                                                                : 'bg-white/40 border-amber-900/10 text-stone-500 hover:border-amber-900/20 hover:text-stone-800 shadow-sm dark:bg-[#151923] dark:border-white/10 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-gray-200'
                                                            }`}
                                                    >
                                                        <item.icon className="w-5 h-5" />
                                                        <span className="text-xs font-semibold">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 mt-2">
                                            {session ? (
                                                <button
                                                    type="submit"
                                                    disabled={loading || !destination.trim()}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#b37233] to-[#1e7875] text-white font-bold text-lg hover:opacity-90 hover:shadow-[0_0_20px_rgba(30,120,117,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {loading ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Generating…
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-5 h-5" />
                                                            Generate Itinerary
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => signIn("appid")}
                                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#b37233] to-[#1e7875] text-white font-bold text-lg hover:opacity-90 hover:shadow-[0_0_20px_rgba(30,120,117,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                                                >
                                                    <LogIn className="w-5 h-5" />
                                                    Login to Generate Itinerary
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </motion.div>

                            <FlightSearch />
                        </div>
                    </section>

                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="text-center mb-8 px-6">
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={msgIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.4 }}
                                            className="text-lg font-medium text-orange-700 dark:text-orange-400"
                                        >
                                            {LOADING_MESSAGES[msgIndex]}
                                        </motion.p>
                                    </AnimatePresence>
                                    <div className="mt-3 flex justify-center gap-1.5">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-orange-400"
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <ItinerarySkeleton />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                            >
                                <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 shadow-lg shadow-red-100/50 dark:shadow-red-900/20 max-w-md">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {itinerary && (
                            <section ref={resultsRef} className="px-6 pb-20">
                                <div className="max-w-3xl mx-auto">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center mb-4"
                                    >
                                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                                            Your Trip to{" "}
                                            <span className="text-gradient">{destination}</span>
                                        </h2>
                                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                                            {itinerary.length} days · {budget} · {travelStyle}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                        className="action-bar"
                                    >
                                        <motion.button
                                            onClick={isSaved ? removeSavedPlan : savePlan}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.96 }}
                                            className={`action-btn action-btn-save ${isSaved ? "" : ""}`}
                                        >
                                            {isSaved ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Saved!
                                                </>
                                            ) : (
                                                <>
                                                    <Bookmark className="w-4 h-4" />
                                                    Save Plan
                                                </>
                                            )}
                                        </motion.button>
                                        <motion.button
                                            onClick={sharePlan}
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.96 }}
                                            className="action-btn action-btn-share"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </motion.button>
                                    </motion.div>

                                    <QuickBookings destination={destination} />

                                    {moodBoardImages.length > 0 && (
                                        <motion.section
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.25, duration: 0.45 }}
                                            className="mt-8"
                                        >
                                            <div className="mb-4">
                                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Mood Board</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    A visual preview of your upcoming journey.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <div className="relative overflow-hidden rounded-2xl min-h-[260px] md:min-h-[340px]">
                                                    <Image
                                                        src={moodBoardImages[0]}
                                                        alt={`${destination} mood board highlight`}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        className="rounded-2xl object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                                        onClick={() => setZoomedImage(moodBoardImages[0])}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {moodBoardImages.slice(1, 5).map((imageUrl, imageIndex) => (
                                                        <div key={`${imageUrl}-${imageIndex}`} className="relative overflow-hidden rounded-2xl h-32 sm:h-40 md:h-[162px]">
                                                            <Image
                                                                src={imageUrl}
                                                                alt={`${destination} mood board image ${imageIndex + 2}`}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                                className="rounded-2xl object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                                                onClick={() => setZoomedImage(imageUrl)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.section>
                                    )}

                                    <div className="mt-8">
                                        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                                            {itinerary.map((dayPlan, index) => {
                                                const isActive = activeDayIndex === index;
                                                return (
                                                    <button
                                                        key={dayPlan.day}
                                                        type="button"
                                                        onClick={() => setActiveDayIndex(index)}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all duration-200 ${isActive
                                                            ? "bg-orange-500 border-orange-500 text-white dark:bg-cyan-500 dark:border-cyan-500 dark:text-slate-900 shadow-md shadow-orange-500/25 dark:shadow-cyan-500/25"
                                                            : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                                                            }`}
                                                    >
                                                        Day {dayPlan.day}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {itinerary[activeDayIndex] && (
                                                <motion.div
                                                    key={activeDayIndex}
                                                    initial={{ opacity: 0, scale: 0.95, y: 20, rotateX: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(4px)" }}
                                                    transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                                    className="mt-5 glass-strong rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-500 group relative z-10 focus-within:z-50"
                                                    style={{ transformOrigin: "center top", transformStyle: "preserve-3d" }}
                                                >
                                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${DAY_ACCENTS[activeDayIndex % DAY_ACCENTS.length]}`} />

                                                    <div className="flex items-center gap-3 mb-5">
                                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${DAY_ACCENTS[activeDayIndex % DAY_ACCENTS.length]} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                            D{itinerary[activeDayIndex].day}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-900 dark:text-white">Day {itinerary[activeDayIndex].day}</h3>
                                                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">{itinerary[activeDayIndex].theme}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {itinerary[activeDayIndex].activities.map((activity, aIdx) => (
                                                            <div key={activity.id || aIdx} className="flex flex-row justify-between items-start gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <ActivityCard
                                                                        activity={activity}
                                                                        destination={destination}
                                                                        onZoom={setZoomedImage}
                                                                        animDelay={aIdx * 0.08 + 0.15}
                                                                    />
                                                                </div>
                                                                {activity.isCustom && activity.id && (
                                                                    <button
                                                                        onClick={() => removeCustomActivity(activeDayIndex, activity.id!)}
                                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-md transition-colors cursor-pointer mt-2"
                                                                        title="Delete Activity"
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4.5 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4 justify-between transition-colors duration-300">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
                                                                <Hotel className="w-5 h-5 text-orange-600 dark:text-cyan-400" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Find hotels in {destination}</h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Discover great places to stay near your activities.</p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-center"
                                                        >
                                                            Search Hotels
                                                        </a>
                                                    </div>

                                                    <div className="mt-4">
                                                        {addingActivityDay === itinerary[activeDayIndex].day ? (
                                                            <AddActivityForm
                                                                day={itinerary[activeDayIndex].day}
                                                                destination={destination}
                                                                onAdd={(newActivity) => {
                                                                    setItinerary((prev) => {
                                                                        if (!prev) return prev;
                                                                        return prev.map((dp) => {
                                                                            if (dp.day === itinerary[activeDayIndex].day) {
                                                                                return {
                                                                                    ...dp,
                                                                                    activities: [...dp.activities, newActivity],
                                                                                };
                                                                            }
                                                                            return dp;
                                                                        });
                                                                    });
                                                                    setAddingActivityDay(null);
                                                                }}
                                                                onCancel={() => setAddingActivityDay(null)}
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => setAddingActivityDay(itinerary[activeDayIndex].day)}
                                                                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-cyan-400 hover:border-orange-300 dark:hover:border-cyan-500/50 hover:bg-orange-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Add Activity
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between w-full mt-6">
                                                        <div>
                                                            {activeDayIndex > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handlePrevDay}
                                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all"
                                                                >
                                                                    <span>⬅</span>
                                                                    Previous Day
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div>
                                                            {activeDayIndex < itinerary.length - 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleNextDay}
                                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 dark:from-cyan-500 dark:to-blue-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-orange-600 hover:to-amber-600 dark:hover:from-cyan-400 dark:hover:to-blue-400 transition-all"
                                                                >
                                                                    Next Day
                                                                    <span>➡</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="mt-14 space-y-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Hotel className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                                                Recommended Hotels in {destination}
                                            </h3>
                                            <div className="flex flex-row overflow-x-auto gap-4 hide-scrollbar px-2 py-4 -mx-2">
                                                {[
                                                    { name: "Luxury Resort & Spa", desc: "5-star relaxation and comfort", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80" },
                                                    { name: "Downtown Boutique Hotel", desc: "Heart of the city vibe", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&q=80" },
                                                    { name: "Oceanview Suites", desc: "Breathtaking coastal views", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80" },
                                                    { name: "Cozy Backpacker Hostel", desc: "Budget friendly and social", img: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&q=80" },
                                                ].map((hotel, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + " " + destination)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 dark:hover:shadow-orange-500/20 overflow-hidden group block"
                                                    >
                                                        <div className="h-36 overflow-hidden relative">
                                                            <Image src={hotel.img} alt={hotel.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">{hotel.name}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{hotel.desc}</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <Map className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                                                Recommended Tours in {destination}
                                            </h3>
                                            <div className="flex flex-row overflow-x-auto gap-4 hide-scrollbar px-2 py-4 -mx-2">
                                                {[
                                                    { name: "Guided City Highlights Tour", desc: "See the best spots in one day", img: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=500&q=80" },
                                                    { name: "Local Food Tasting Experience", desc: "Taste authentic local cuisine", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80" },
                                                    { name: "Sunset Cruise Adventure", desc: "Relaxing evening on the water", img: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=500&q=80" },
                                                    { name: "Historical Walking Tour", desc: "Step back in time with a guide", img: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=500&q=80" },
                                                ].map((tour, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(tour.name + " " + destination)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-shrink-0 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 dark:hover:shadow-orange-500/20 overflow-hidden group block"
                                                    >
                                                        <div className="h-36 overflow-hidden relative">
                                                            <Image src={tour.img} alt={tour.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">{tour.name}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{tour.desc}</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: itinerary.length * 0.15 + 0.5 }}
                                        className="mt-10 text-center"
                                    >
                                        <button
                                            onClick={() => {
                                                setItinerary(null);
                                                setIsSaved(false);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-orange-200 dark:border-slate-600 text-orange-700 dark:text-cyan-400 font-medium text-sm hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors duration-200"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Plan another trip
                                        </button>
                                    </motion.div>
                                </div>
                            </section>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {toast && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                            >
                                <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-info"}`}>
                                    {toast.type === "success" ? (
                                        <Check className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                        <Link2 className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <span>{toast.message}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <footer className="py-8 text-center text-sm text-slate-400 dark:text-slate-500 border-t border-orange-100/50 dark:border-slate-800">
                        <p>Built with ✈️ by <span className="text-gradient font-semibold">Trekko AI</span></p>
                    </footer>

                    <ImageLightbox imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
