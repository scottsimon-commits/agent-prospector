'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Briefcase, Wrench, LayoutGrid, Database, Bot } from 'lucide-react'

const topNav = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
]

const prospectNav = [
  { href: '/prospect', label: 'Individual', icon: User },
  { href: '/business', label: 'Business', icon: Briefcase },
]

const bottomNav = [
  { href: '/build', label: 'Build', icon: Wrench },
  { href: '/gallery', label: 'Gallery', icon: Bot },
  { href: '/registry', label: 'Registry', icon: Database },
]

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  return (
    <Link
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
}

export function SidebarNav() {
  return (
    <>
      {topNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}

      <div className="pt-3 pb-1 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Prospect</p>
      </div>
      {prospectNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}

      <div className="pt-3 pb-1 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Tools</p>
      </div>
      {bottomNav.map((item) => (
        <NavItem key={item.href} {...item} />
      ))}
    </>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const all = [...topNav, ...prospectNav, ...bottomNav]

  return (
    <nav className="flex gap-1">
      {all.map(({ href, icon: Icon }) => {
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
