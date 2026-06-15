import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Bot } from "lucide-react";
import { Toaster } from "sonner";
import { AgentStoreProvider } from "@/components/AgentStoreProvider";
import { SidebarNav, MobileNav } from "@/components/NavLinks";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Agent Prospector",
    template: "%s | Agent Prospector",
  },
  description: "Discover, build, and deploy AI agents — powered by Claude",
  openGraph: {
    title: "Agent Prospector",
    description: "Discover, build, and deploy AI agents — powered by Claude",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Prospector",
    description: "Discover, build, and deploy AI agents — powered by Claude",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full antialiased`}>
        <div className="flex min-h-screen">
          {/* Sidebar — hidden on mobile, visible md+ */}
          <aside className="hidden md:flex w-56 border-r bg-muted/20 flex-col gap-0.5 p-3 shrink-0 sticky top-0 h-screen overflow-y-auto">
            <Link href="/" className="flex items-center gap-2 px-2 py-3 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">Agent Prospector</span>
            </Link>
            <SidebarNav />
            <div className="mt-auto pt-4 px-2">
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Powered by OpenRouter · Deploy to Vercel
              </p>
            </div>
          </aside>

          {/* Mobile top nav */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">Agent Prospector</span>
              </Link>
              <MobileNav />
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 pt-16 md:pt-0 overflow-auto">
            <div className="p-4 md:p-6 max-w-screen-xl mx-auto">
              <AgentStoreProvider>
                {children}
              </AgentStoreProvider>
            </div>
          </main>
        </div>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
