"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ─── Airport Database ─── */
interface Airport {
  city: string;
  code: string;
  airport: string;
  country: string;
}

const AIRPORTS: Airport[] = [
  // India
  { city: "Kolkata", code: "CCU", airport: "Netaji Subhas Chandra Bose Intl", country: "India" },
  { city: "Delhi", code: "DEL", airport: "Indira Gandhi International", country: "India" },
  { city: "Mumbai", code: "BOM", airport: "Chhatrapati Shivaji Maharaj Intl", country: "India" },
  { city: "Bangalore", code: "BLR", airport: "Kempegowda International", country: "India" },
  { city: "Chennai", code: "MAA", airport: "Chennai International", country: "India" },
  { city: "Hyderabad", code: "HYD", airport: "Rajiv Gandhi International", country: "India" },
  { city: "Pune", code: "PNQ", airport: "Pune Airport", country: "India" },
  { city: "Ahmedabad", code: "AMD", airport: "Sardar Vallabhbhai Patel Intl", country: "India" },
  { city: "Jaipur", code: "JAI", airport: "Jaipur International", country: "India" },
  { city: "Goa", code: "GOI", airport: "Manohar International", country: "India" },
  { city: "Kochi", code: "COK", airport: "Cochin International", country: "India" },
  { city: "Lucknow", code: "LKO", airport: "Chaudhary Charan Singh Intl", country: "India" },
  { city: "Guwahati", code: "GAU", airport: "Lokpriya Gopinath Bordoloi Intl", country: "India" },
  { city: "Varanasi", code: "VNS", airport: "Lal Bahadur Shastri Intl", country: "India" },
  { city: "Chandigarh", code: "IXC", airport: "Chandigarh Airport", country: "India" },
  { city: "Thiruvananthapuram", code: "TRV", airport: "Trivandrum International", country: "India" },
  { city: "Bhubaneswar", code: "BBI", airport: "Biju Patnaik International", country: "India" },
  { city: "Patna", code: "PAT", airport: "Jay Prakash Narayan International", country: "India" },
  { city: "Indore", code: "IDR", airport: "Devi Ahilyabai Holkar", country: "India" },
  { city: "Nagpur", code: "NAG", airport: "Dr. Babasaheb Ambedkar Intl", country: "India" },
  { city: "Coimbatore", code: "CJB", airport: "Coimbatore International", country: "India" },
  { city: "Amritsar", code: "ATQ", airport: "Sri Guru Ram Dass Jee Intl", country: "India" },
  { city: "Srinagar", code: "SXR", airport: "Sheikh ul-Alam International", country: "India" },
  { city: "Udaipur", code: "UDR", airport: "Maharana Pratap Airport", country: "India" },
  { city: "Leh", code: "IXL", airport: "Kushok Bakula Rimpochee", country: "India" },
  { city: "Port Blair", code: "IXZ", airport: "Veer Savarkar International", country: "India" },
  { city: "Bagdogra", code: "IXB", airport: "Bagdogra Airport", country: "India" },
  { city: "Dehradun", code: "DED", airport: "Jolly Grant Airport", country: "India" },
  { city: "Mangalore", code: "IXE", airport: "Mangalore International", country: "India" },
  { city: "Visakhapatnam", code: "VTZ", airport: "Visakhapatnam Airport", country: "India" },
  { city: "Ranchi", code: "IXR", airport: "Birsa Munda Airport", country: "India" },
  { city: "Raipur", code: "RPR", airport: "Swami Vivekananda Airport", country: "India" },

  // SE Asia
  { city: "Singapore", code: "SIN", airport: "Changi Airport", country: "Singapore" },
  { city: "Bangkok", code: "BKK", airport: "Suvarnabhumi Airport", country: "Thailand" },
  { city: "Kuala Lumpur", code: "KUL", airport: "Kuala Lumpur International", country: "Malaysia" },
  { city: "Bali", code: "DPS", airport: "Ngurah Rai International", country: "Indonesia" },
  { city: "Jakarta", code: "CGK", airport: "Soekarno-Hatta International", country: "Indonesia" },
  { city: "Hanoi", code: "HAN", airport: "Noi Bai International", country: "Vietnam" },
  { city: "Ho Chi Minh City", code: "SGN", airport: "Tan Son Nhat International", country: "Vietnam" },
  { city: "Manila", code: "MNL", airport: "Ninoy Aquino International", country: "Philippines" },
  { city: "Phuket", code: "HKT", airport: "Phuket International", country: "Thailand" },
  { city: "Chiang Mai", code: "CNX", airport: "Chiang Mai International", country: "Thailand" },
  { city: "Siem Reap", code: "REP", airport: "Angkor International", country: "Cambodia" },
  { city: "Cebu", code: "CEB", airport: "Mactan-Cebu International", country: "Philippines" },

  // East Asia
  { city: "Tokyo", code: "NRT", airport: "Narita International", country: "Japan" },
  { city: "Osaka", code: "KIX", airport: "Kansai International", country: "Japan" },
  { city: "Seoul", code: "ICN", airport: "Incheon International", country: "South Korea" },
  { city: "Beijing", code: "PEK", airport: "Capital International", country: "China" },
  { city: "Shanghai", code: "PVG", airport: "Pudong International", country: "China" },
  { city: "Hong Kong", code: "HKG", airport: "Hong Kong International", country: "Hong Kong" },
  { city: "Taipei", code: "TPE", airport: "Taoyuan International", country: "Taiwan" },

  // Middle East
  { city: "Dubai", code: "DXB", airport: "Dubai International", country: "UAE" },
  { city: "Abu Dhabi", code: "AUH", airport: "Zayed International", country: "UAE" },
  { city: "Doha", code: "DOH", airport: "Hamad International", country: "Qatar" },
  { city: "Muscat", code: "MCT", airport: "Muscat International", country: "Oman" },
  { city: "Riyadh", code: "RUH", airport: "King Khalid International", country: "Saudi Arabia" },
  { city: "Jeddah", code: "JED", airport: "King Abdulaziz International", country: "Saudi Arabia" },
  { city: "Istanbul", code: "IST", airport: "Istanbul Airport", country: "Turkey" },

  // Europe
  { city: "London", code: "LHR", airport: "Heathrow Airport", country: "United Kingdom" },
  { city: "Paris", code: "CDG", airport: "Charles de Gaulle Airport", country: "France" },
  { city: "Rome", code: "FCO", airport: "Leonardo da Vinci–Fiumicino", country: "Italy" },
  { city: "Barcelona", code: "BCN", airport: "El Prat Airport", country: "Spain" },
  { city: "Madrid", code: "MAD", airport: "Adolfo Suárez Madrid–Barajas", country: "Spain" },
  { city: "Amsterdam", code: "AMS", airport: "Schiphol Airport", country: "Netherlands" },
  { city: "Berlin", code: "BER", airport: "Berlin Brandenburg Airport", country: "Germany" },
  { city: "Munich", code: "MUC", airport: "Franz Josef Strauss Airport", country: "Germany" },
  { city: "Frankfurt", code: "FRA", airport: "Frankfurt Airport", country: "Germany" },
  { city: "Zurich", code: "ZRH", airport: "Zurich Airport", country: "Switzerland" },
  { city: "Vienna", code: "VIE", airport: "Vienna International", country: "Austria" },
  { city: "Prague", code: "PRG", airport: "Václav Havel Airport", country: "Czech Republic" },
  { city: "Budapest", code: "BUD", airport: "Budapest Ferenc Liszt Intl", country: "Hungary" },
  { city: "Athens", code: "ATH", airport: "Eleftherios Venizelos", country: "Greece" },
  { city: "Lisbon", code: "LIS", airport: "Humberto Delgado Airport", country: "Portugal" },
  { city: "Dublin", code: "DUB", airport: "Dublin Airport", country: "Ireland" },
  { city: "Copenhagen", code: "CPH", airport: "Copenhagen Airport", country: "Denmark" },
  { city: "Stockholm", code: "ARN", airport: "Arlanda Airport", country: "Sweden" },
  { city: "Helsinki", code: "HEL", airport: "Helsinki-Vantaa Airport", country: "Finland" },
  { city: "Milan", code: "MXP", airport: "Malpensa Airport", country: "Italy" },
  { city: "Venice", code: "VCE", airport: "Marco Polo Airport", country: "Italy" },
  { city: "Santorini", code: "JTR", airport: "Santorini Airport", country: "Greece" },
  { city: "Reykjavik", code: "KEF", airport: "Keflavík International", country: "Iceland" },

  // Americas
  { city: "New York", code: "JFK", airport: "John F. Kennedy International", country: "United States" },
  { city: "Los Angeles", code: "LAX", airport: "Los Angeles International", country: "United States" },
  { city: "San Francisco", code: "SFO", airport: "San Francisco International", country: "United States" },
  { city: "Chicago", code: "ORD", airport: "O'Hare International", country: "United States" },
  { city: "Miami", code: "MIA", airport: "Miami International", country: "United States" },
  { city: "Las Vegas", code: "LAS", airport: "Harry Reid International", country: "United States" },
  { city: "Boston", code: "BOS", airport: "Logan International", country: "United States" },
  { city: "Seattle", code: "SEA", airport: "Seattle-Tacoma International", country: "United States" },
  { city: "Toronto", code: "YYZ", airport: "Toronto Pearson International", country: "Canada" },
  { city: "Vancouver", code: "YVR", airport: "Vancouver International", country: "Canada" },
  { city: "Mexico City", code: "MEX", airport: "Benito Juárez International", country: "Mexico" },
  { city: "Cancún", code: "CUN", airport: "Cancún International", country: "Mexico" },
  { city: "São Paulo", code: "GRU", airport: "Guarulhos International", country: "Brazil" },
  { city: "Rio de Janeiro", code: "GIG", airport: "Galeão International", country: "Brazil" },
  { city: "Buenos Aires", code: "EZE", airport: "Ministro Pistarini Intl", country: "Argentina" },
  { city: "Lima", code: "LIM", airport: "Jorge Chávez International", country: "Peru" },
  { city: "Bogotá", code: "BOG", airport: "El Dorado International", country: "Colombia" },

  // Oceania
  { city: "Sydney", code: "SYD", airport: "Kingsford Smith Airport", country: "Australia" },
  { city: "Melbourne", code: "MEL", airport: "Tullamarine Airport", country: "Australia" },
  { city: "Auckland", code: "AKL", airport: "Auckland Airport", country: "New Zealand" },
  { city: "Brisbane", code: "BNE", airport: "Brisbane Airport", country: "Australia" },
  { city: "Perth", code: "PER", airport: "Perth Airport", country: "Australia" },

  // Africa
  { city: "Cairo", code: "CAI", airport: "Cairo International", country: "Egypt" },
  { city: "Cape Town", code: "CPT", airport: "Cape Town International", country: "South Africa" },
  { city: "Johannesburg", code: "JNB", airport: "O.R. Tambo International", country: "South Africa" },
  { city: "Nairobi", code: "NBO", airport: "Jomo Kenyatta International", country: "Kenya" },
  { city: "Marrakech", code: "RAK", airport: "Menara Airport", country: "Morocco" },
  { city: "Zanzibar", code: "ZNZ", airport: "Abeid Amani Karume Intl", country: "Tanzania" },
  { city: "Mauritius", code: "MRU", airport: "Sir Seewoosagur Ramgoolam", country: "Mauritius" },

  // South Asia + Islands
  { city: "Colombo", code: "CMB", airport: "Bandaranaike International", country: "Sri Lanka" },
  { city: "Kathmandu", code: "KTM", airport: "Tribhuvan International", country: "Nepal" },
  { city: "Malé", code: "MLE", airport: "Velana International", country: "Maldives" },
  { city: "Paro", code: "PBH", airport: "Paro International", country: "Bhutan" },
];

/* ─── Utility Functions ─── */
function formatDateForSkyscanner(date: string): string {
  if (!date) return "";
  return date.replace(/-/g, "").slice(2);
}

function getTodayISO(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/* ─── Calendar Helpers ─── */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Converts "2026-05-14" → "May 14, 2026" */
function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

/** Converts Date → "2026-05-14" */
function toISO(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/* ─── Custom Calendar Dropdown ─── */
function CalendarDropdown({
  selectedDate,
  minDate,
  onSelect,
  onClose,
}: {
  selectedDate: string;
  minDate?: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Determine initial month view from selected date or today
  const init = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());

  // Click outside → close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const todayISO = getTodayISO();
  const minISO = minDate || todayISO;

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-2xl border border-slate-200 p-4 z-[100] select-none"
    >
      {/* ─── Month / Year Header ─── */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-medium text-slate-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* ─── Day-of-Week Labels ─── */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-slate-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ─── Date Grid ─── */}
      <div className="grid grid-cols-7 gap-1 mt-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const iso = toISO(viewYear, viewMonth, day);
          const isSelected = iso === selectedDate;
          const isDisabled = iso < minISO;
          const isToday = iso === todayISO;

          return (
            <button
              key={iso}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              className={`
                w-8 h-8 mx-auto flex items-center justify-center text-sm rounded-full transition-colors
                ${isSelected
                  ? "bg-orange-500 text-white font-bold"
                  : isDisabled
                    ? "text-slate-300 cursor-not-allowed"
                    : isToday
                      ? "text-orange-600 font-semibold hover:bg-orange-50"
                      : "text-slate-700 hover:bg-orange-50"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Airport Autocomplete Input ─── */
function AirportInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string, code: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value when parent changes it (e.g. swap)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search filtering
  const handleInputChange = useCallback(
    (q: string) => {
      setQuery(q);
      setActiveIndex(-1);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.trim().length < 1) {
        setResults([]);
        setIsOpen(false);
        onChange("", "");
        return;
      }

      debounceRef.current = setTimeout(() => {
        const lower = q.toLowerCase().trim();
        const filtered = AIRPORTS.filter(
          (a) =>
            a.city.toLowerCase().includes(lower) ||
            a.code.toLowerCase().includes(lower) ||
            a.country.toLowerCase().includes(lower) ||
            a.airport.toLowerCase().includes(lower)
        ).slice(0, 6);
        setResults(filtered);
        setIsOpen(filtered.length > 0);
      }, 180);
    },
    [onChange]
  );

  // Select airport from dropdown
  const selectAirport = useCallback(
    (airport: Airport) => {
      const display = `${airport.city} (${airport.code})`;
      setQuery(display);
      setIsOpen(false);
      setResults([]);
      onChange(display, airport.code);
    },
    [onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        selectAirport(results[activeIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [isOpen, results, activeIndex, selectAirport]
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex-1 relative" ref={wrapperRef}>
      <label htmlFor={id} className="fs-label">
        {label}
      </label>
      {/* ─── Strict Icon Structure ─── */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Plane className="w-4 h-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="fs-input pl-10"
        />
      </div>

      {/* ─── Autocomplete Dropdown ─── */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fs-dropdown"
          >
            {results.map((airport, i) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => selectAirport(airport)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`fs-dropdown-item ${activeIndex === i ? "fs-dropdown-item-active" : ""
                  }`}
              >
                <div className="fs-dropdown-icon-wrapper">
                  <Plane className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="fs-dropdown-city">
                    {airport.city}{" "}
                    <span className="fs-dropdown-code">({airport.code})</span>
                  </div>
                  <div className="fs-dropdown-country">{airport.country}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Flight Search Component ─── */
export default function FlightSearch() {
  const [fromDisplay, setFromDisplay] = useState("");
  const [toDisplay, setToDisplay] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [toCode, setToCode] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isOneWay, setIsOneWay] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDepartOpen, setIsDepartOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  function handleSwap() {
    setFromDisplay(toDisplay);
    setToDisplay(fromDisplay);
    setFromCode(toCode);
    setToCode(fromCode);
  }

  function handleSearch() {
    if (!fromCode || !toCode || !departDate) return;

    let url = `https://www.skyscanner.co.in/transport/flights/${fromCode.toLowerCase()}/${toCode.toLowerCase()}/${formatDateForSkyscanner(departDate)}`;

    if (!isOneWay && returnDate) {
      url += `/${formatDateForSkyscanner(returnDate)}`;
    }

    url += `/?adultsv2=1&cabinclass=economy&childrenv2=&ref=home&rtn=${isOneWay ? "0" : "1"}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  const isValid = fromCode && toCode && departDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
      className="max-w-2xl mx-auto mt-6"
    >
      <div className="fs-card">
        {/* ─── Collapsible Header Bar ─── */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="fs-accordion-trigger"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <div className="fs-header-icon">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="fs-header-title">Find Flights</h3>
              <p className="fs-header-subtitle">
                Search &amp; compare on Skyscanner
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>

        {/* ─── Collapsible Body ─── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="fs-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: isDepartOpen || isReturnOpen ? 'visible' : 'hidden' }}
            >
              <div className="px-5 sm:px-6 pb-6 pt-1">
                {/* ─── Trip Type Toggle ─── */}
                <div className="flex items-center gap-2 mb-5">
                  <button
                    type="button"
                    onClick={() => setIsOneWay(false)}
                    className={`fs-toggle ${!isOneWay ? "fs-toggle-active" : ""}`}
                  >
                    Round Trip
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOneWay(true)}
                    className={`fs-toggle ${isOneWay ? "fs-toggle-active" : ""}`}
                  >
                    One Way
                  </button>
                </div>

                {/* ─── From / To Row ─── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2 mb-4">
                  <AirportInput
                    id="fs-from"
                    label="From"
                    placeholder=""
                    value={fromDisplay}
                    onChange={(display, code) => {
                      setFromDisplay(display);
                      setFromCode(code);
                    }}
                  />

                  {/* Swap */}
                  <motion.button
                    type="button"
                    onClick={handleSwap}
                    whileHover={{ scale: 1.15, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="fs-swap-btn self-center mx-auto sm:mx-0 sm:mb-0 mb-0"
                    aria-label="Swap cities"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </motion.button>

                  <AirportInput
                    id="fs-to"
                    label="To"
                    placeholder=""
                    value={toDisplay}
                    onChange={(display, code) => {
                      setToDisplay(display);
                      setToCode(code);
                    }}
                  />
                </div>

                {/* ─── Dates Row ─── */}
                <div className="flex gap-3 mb-6">
                  {/* Depart Date */}
                  <div className="flex-1 relative">
                    <label className="fs-label">Depart</label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDepartOpen((v) => !v);
                          setIsReturnOpen(false);
                        }}
                        className="fs-input pl-10 text-left w-full cursor-pointer"
                      >
                        {departDate ? (
                          <span className="text-slate-800">{formatDisplayDate(departDate)}</span>
                        ) : (
                          <span className="text-transparent select-none">-</span>
                        )}
                      </button>
                    </div>
                    <AnimatePresence>
                      {isDepartOpen && (
                        <CalendarDropdown
                          selectedDate={departDate}
                          onSelect={(iso) => {
                            setDepartDate(iso);
                            // If return date is before new depart date, clear it
                            if (returnDate && returnDate < iso) setReturnDate("");
                          }}
                          onClose={() => setIsDepartOpen(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Return Date */}
                  <AnimatePresence>
                    {!isOneWay && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 relative"
                        style={{ overflow: isReturnOpen ? 'visible' : 'hidden' }}
                      >
                        <label className="fs-label">Return</label>
                        <div className="relative w-full">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsReturnOpen((v) => !v);
                              setIsDepartOpen(false);
                            }}
                            className="fs-input pl-10 text-left w-full cursor-pointer"
                          >
                            {returnDate ? (
                              <span className="text-slate-800">{formatDisplayDate(returnDate)}</span>
                            ) : (
                              <span className="text-transparent select-none">-</span>
                            )}
                          </button>
                        </div>
                        <AnimatePresence>
                          {isReturnOpen && (
                            <CalendarDropdown
                              selectedDate={returnDate}
                              minDate={departDate || undefined}
                              onSelect={setReturnDate}
                              onClose={() => setIsReturnOpen(false)}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── Search Button ─── */}
                <motion.button
                  type="button"
                  onClick={handleSearch}
                  disabled={!isValid}
                  whileHover={isValid ? { scale: 1.02 } : {}}
                  whileTap={isValid ? { scale: 0.98 } : {}}
                  className="fs-search-btn"
                  id="fs-submit"
                >
                  <Plane className="w-5 h-5" />
                  <span>Search Flights</span>
                </motion.button>

                {/* ─── Powered by label ─── */}
                <p className="fs-powered-by">
                  Powered by Skyscanner · Opens in new tab
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
