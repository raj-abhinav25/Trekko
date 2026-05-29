import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Map, Sparkles, Globe, Navigation, CalendarDays, Wallet } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden relative selection:bg-orange-500/30">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                    <svg width="30" height="30" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="logoGradNav" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                        {/* Mountain peaks */}
                        <path d="M4 27L12 11L17 19L22 13L30 27Z" fill="url(#logoGradNav)" opacity="0.9" />
                        {/* Location pin above main peak */}
                        <circle cx="22" cy="9" r="3.5" fill="url(#logoGradNav)" />
                        <path d="M22 12.5 L22 16" stroke="url(#logoGradNav)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-base sm:text-lg font-light tracking-[0.18em] uppercase text-slate-800 dark:text-slate-100" style={{letterSpacing: '0.18em'}}>
                        Trekko
                    </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-transform"
                    >
                        Go to App
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200/60 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>The Future of Travel Planning</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 font-serif text-balance leading-tight">
                    Plan your dream trip in <br className="hidden md:block" />
                    <span className="text-gradient font-serif">
                        seconds, not days.
                    </span>
                </h1>
                <p className="max-w-2xl text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 text-balance px-2">
                    Trekko uses advanced AI to build personalized, day-by-day itineraries tailored exactly to your budget, vibe, and schedule. Stop researching. Start exploring.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none justify-center">
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-semibold text-base sm:text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all justify-center"
                    >
                        Start Planning Free
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#about"
                        className="flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-full font-semibold text-base sm:text-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors justify-center"
                    >
                        Learn More
                    </a>
                </div>

                {/* Decorative mock UI or Image */}
                <div className="mt-10 sm:mt-16 w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-1.5 sm:p-2">
                    <div className="w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800 flex flex-col justify-center items-center">
                        <Image 
                            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2000&auto=format&fit=crop" 
                            alt="Travel aesthetic" 
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover opacity-80 dark:opacity-60 mix-blend-overlay"
                        />
                        <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 bg-white/30 dark:bg-slate-950/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl border border-white/40 dark:border-slate-700/50">
                             <Map className="w-8 h-8 sm:w-12 sm:h-12 text-slate-900 dark:text-white" />
                             <p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-lg tracking-wide uppercase text-center">Your Next Adventure Awaits</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-100/50 dark:bg-slate-900/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 font-serif">What is Trekko?</h2>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                        Planning a trip is often overwhelming. Countless tabs, endless reviews, and logistical nightmares. 
                        <strong> Trekko</strong> replaces all of that with a single intelligent prompt. Just tell us where you want to go, who you&apos;re with, and what you love doing. We craft a perfectly balanced itinerary in seconds, complete with interactive maps and seamless bookings.
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-3 sm:mb-4 font-serif">Everything you need, built-in.</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-lg">Powerful features designed to make travel planning joyful again.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                    {[
                        { icon: Sparkles, title: "AI Itinerary Generation", desc: "Instantly generate day-by-day plans customized to your unique travel style." },
                        { icon: Map, title: "Interactive Maps", desc: "See your whole trip visualized on a beautiful, interactive map with easy routing." },
                        { icon: CalendarDays, title: "Flexible Scheduling", desc: "Easily adjust, swap, or reorder activities. Your itinerary adapts to your pace." },
                        { icon: Wallet, title: "Budget Optimization", desc: "From luxury resorts to backpacker hostels, we tailor recommendations to your wallet." },
                        { icon: Globe, title: "Global Reach", desc: "Whether it's Tokyo, Paris, or a hidden beach in Bali, Trekko knows the best spots." },
                        { icon: Navigation, title: "Quick Bookings", desc: "One-click links to book flights, hotels, and local tours through trusted partners." },
                    ].map((feature, i) => (
                        <div key={i} className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-cyan-500 mix-blend-multiply dark:mix-blend-color" />
                    <Image 
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop" 
                        alt="Beach CTA" 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="relative z-10 p-8 sm:p-12 md:p-20 text-center flex flex-col items-center">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 sm:mb-6 font-serif">Ready to explore the world?</h2>
                        <p className="text-orange-50 text-sm sm:text-lg md:text-xl mb-6 sm:mb-10 max-w-2xl">
                            Join thousands of travelers who are planning better trips in less time. Your next adventure starts here.
                        </p>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-orange-600 rounded-full font-bold text-base sm:text-lg hover:scale-105 active:scale-95 transition-transform shadow-2xl"
                        >
                            Build Your Free Itinerary
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 text-center flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto text-slate-500 dark:text-slate-400 text-sm gap-4">
                <div className="flex items-center gap-2.5">
                    <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="logoGradFooter" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                        <path d="M4 27L12 11L17 19L22 13L30 27Z" fill="url(#logoGradFooter)" opacity="0.85" />
                        <circle cx="22" cy="9" r="3.5" fill="url(#logoGradFooter)" />
                        <path d="M22 12.5 L22 16" stroke="url(#logoGradFooter)" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-light tracking-[0.18em] uppercase text-slate-700 dark:text-slate-300" style={{letterSpacing: '0.18em'}}>
                        Trekko
                    </span>
                </div>
                <p>&copy; {new Date().getFullYear()} Trekko. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Terms</a>
                    <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Contact</a>
                </div>
            </footer>
        </main>
    );
}
