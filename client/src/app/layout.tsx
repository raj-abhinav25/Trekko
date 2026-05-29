import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Providers from "./components/Providers";
import "./globals.css";
import WatsonAssistantChat from "./components/WatsonAssistantChat";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trekko — AI Trip Planner",
  description:
    "Plan your dream trip in seconds. Trekko AI builds personalized, day-by-day itineraries tailored to your budget and travel style.",
  keywords: ["trip planner", "AI travel", "itinerary generator", "travel AI", "Trekko"],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Trekko — AI Trip Planner",
    description:
      "Plan your dream trip in seconds. Trekko AI builds personalized, day-by-day itineraries.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-page-gradient dark:bg-page-gradient-dark transition-colors duration-500">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <Providers>
            {children}
            <WatsonAssistantChat />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
