'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Gem, Image, Library, Bot, Wand2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { NavLink } from '@/components/nav-link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProStatus } from '@/hooks/use-pro-status';
import { ProBadge } from '@/components/pro-badge';

const navItems = [
  { href: '/generate', label: 'Generate', icon: Wand2 },
  { href: '/describe', label: 'Describe', icon: Image },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/chat', label: 'Chat', icon: Bot, pro: true },
  { href: '/pro', label: 'Go Pro', icon: Gem },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { isPro } = useProStatus();
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => {
    if (item.href === '/pro' && isPro) return false;
    return true;
  });

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-20">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10">
          <nav className="flex justify-around items-center h-16">
            {filteredNavItems.map(({ href, label, icon: Icon, pro }) => (
               <NavLink key={href} href={href} active={pathname.startsWith(href)}>
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              </NavLink>
            ))}
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-border flex-col hidden md:flex">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Wand2 /> Prompty
          </h1>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          {filteredNavItems.map(({ href, label, icon: Icon, pro }) => (
            <NavLink key={href} href={href} active={pathname.startsWith(href)}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                {pro && !isPro && <ProBadge />}
              </div>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
