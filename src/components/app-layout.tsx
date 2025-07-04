'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Gem, Image, Library, Bot, Wand2, Settings, LogIn } from 'lucide-react';

import { cn } from '@/lib/utils';
import { NavLink } from '@/components/nav-link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/use-user';
import { ProBadge } from '@/components/pro-badge';
import { UserNav } from './user-nav';
import { Button } from './ui/button';
import Link from 'next/link';

const navItems = [
  { href: '/generate', label: 'Generate', icon: Wand2 },
  { href: '/describe', label: 'Describe', icon: Image },
  { href: '/library', label: 'Library', icon: Library, pro: true },
  { href: '/chat', label: 'Chat', icon: Bot, pro: true },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { user, isPro } = useUser();
  const pathname = usePathname();
  
  const mainNavItems = navItems.filter(item => {
    if (item.pro && !isPro) return true; // Show pro items with badge
    if (!item.pro) return true;
    return isPro; // Only show pro items if user is pro (or show with badge)
  });

  const settingsItem = { href: '/settings', label: 'Settings', icon: Settings };
  const proItem = { href: '/pro', label: 'Go Pro', icon: Gem };

  const desktopNav = (
    <aside className="w-64 border-r border-border flex-col hidden md:flex">
      <div className="p-4 flex justify-between items-center">
        <Link href="/generate" className="text-2xl font-bold text-primary flex items-center gap-2">
          <Wand2 /> Prompty
        </Link>
      </div>
       <nav className="flex flex-col p-4 space-y-2 flex-1">
        {mainNavItems.map(({ href, label, icon: Icon, pro }) => (
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
      <div className="p-4 border-t border-border">
         <nav className="flex flex-col space-y-2">
          <NavLink href={settingsItem.href} active={pathname.startsWith(settingsItem.href)}>
            <div className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', pathname.startsWith(settingsItem.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}>
              <Settings className="w-5 h-5" />
              <span>{settingsItem.label}</span>
            </div>
          </NavLink>
          {!isPro && (
            <NavLink href={proItem.href} active={pathname.startsWith(proItem.href)}>
                <div className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors', pathname.startsWith(proItem.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}>
                <Gem className="w-5 h-5" />
                <span>{proItem.label}</span>
              </div>
            </NavLink>
          )}
          {user ? (
            <UserNav />
          ) : (
             <Button asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4"/>
                  Login / Sign Up
                </Link>
            </Button>
          )}
        </nav>
      </div>
    </aside>
  );

  const mobileNav = (
     <div className="flex flex-col min-h-screen">
        <header className="flex md:hidden justify-between items-center p-4 border-b">
             <Link href="/generate" className="text-xl font-bold text-primary flex items-center gap-2">
                <Wand2 /> Prompty
            </Link>
            {user ? <UserNav /> :  <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>}
        </header>
        <main className="flex-1 pb-20">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-10 md:hidden">
          <nav className="flex justify-around items-center h-16">
            {[...mainNavItems, settingsItem].map(({ href, label, icon: Icon, pro }) => (
               <NavLink key={href} href={href} active={pathname.startsWith(href)}>
                <div className="flex flex-col items-center gap-1 relative">
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                  {pro && !isPro && <span className="absolute -top-1 -right-2 text-[8px] bg-accent text-accent-foreground px-1 rounded-full">PRO</span>}
                </div>
              </NavLink>
            ))}
          </nav>
        </footer>
      </div>
  )

  return (
    <div className="flex min-h-screen">
      {isMobile ? mobileNav : desktopNav}
      <main className="flex-1">{isMobile ? null : children}</main>
    </div>
  );
}
