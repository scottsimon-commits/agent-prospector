'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Search, Wrench, LayoutGrid, Database } from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/prospect', label: 'Prospect', icon: Search },
  { href: '/build', label: 'Build', icon: Wrench },
  { href: '/gallery', label: 'Gallery', icon: Bot },
  { href: '/registry', label: 'Registry', icon: Database },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1">
      {nav.map(({ href, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`p-2 rounded-md transition-colors ${
              active
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
          </Link>
        )
      })}
    </nav>
  )
}
