import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Bot, Search, Wrench, LayoutGrid, Database } from "lucide-react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Prospector",
  description: "Discover, build, and deploy AI agents",
};

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/prospect", label: "Prospect", icon: Search },
  { href: "/build", label: "Build", icon: Wrench },
  { href: "/gallery", label: "Gallery", icon: Bot },
  { href: "/registry", label: "Registry", icon: Database },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} min-h-full`}>
        <div className="flex min-h-screen">
          <aside className="w-56 border-r bg-muted/30 flex flex-col gap-1 p-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-3 mb-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-bold text-sm">Agent Prospector</span>
            </div>
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </aside>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
