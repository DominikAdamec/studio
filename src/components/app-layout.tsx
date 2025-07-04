'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Gem, Image, Library, Bot, Wand2, Settings, LogIn, Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { NavLink } from '@/components/nav-link';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/hooks/use-user';
import { ProBadge } from '@/components/pro-badge';
import { UserNav } from './user-nav';
import { Button } from './ui/button';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/generate', label: 'Generate', icon: Wand2 },
  { href: '/describe', label: 'Describe', icon: Image },
  { href: '/library', label: 'Library', icon: Library, pro: true },
  { href: '/chat', label: 'Chat', icon: Bot, pro: true },
];

const mobileNavItems = [
  { href: '/describe', label: 'Describe', icon: Image },
  { href: '/chat', label: 'Chat', icon: Bot, pro: true },
  // Central button will be hardcoded
  { href: '/library', label: 'Library', icon: Library, pro: true },
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
            {user && <UserNav />}
        </header>
        <main className="flex-1 pb-24">{children}</main>
        <footer className="fixed bottom-0 inset-x-0 p-4 flex justify-center z-50 md:hidden">
            <nav className="bg-card text-card-foreground rounded-full shadow-lg p-2 flex items-center gap-2">
                {mobileNavItems.slice(0, 2).map(({ href, label, icon: Icon, pro }) => (
                    <NavLink key={href} href={href} active={pathname.startsWith(href)} className={cn("rounded-full p-3 transition-colors", pathname.startsWith(href) ? "text-primary" : "text-muted-foreground")}>
                         <Icon className="w-6 h-6" />
                    </NavLink>
                ))}

                <Link href="/generate" className={cn("bg-primary text-primary-foreground rounded-full p-4 -mt-8 shadow-lg ring-4 ring-background", pathname.startsWith('/generate') && "ring-primary/20")}>
                    <Wand2 className="w-6 h-6" />
                </Link>

                {mobileNavItems.slice(2).map(({ href, label, icon: Icon, pro }) => (
                    <NavLink key={href} href={href} active={pathname.startsWith(href)} className={cn("rounded-full p-3 transition-colors", pathname.startsWith(href) ? "text-primary" : "text-muted-foreground")}>
                        <Icon className="w-6 h-6" />
                    </NavLink>
                ))}
                 
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl">
                        <div className="p-4">
                           <nav className="flex flex-col space-y-2">
                                <NavLink href={settingsItem.href} active={pathname.startsWith(settingsItem.href)}>
                                    <div className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors', pathname.startsWith(settingsItem.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}>
                                        <Settings className="w-5 h-5" />
                                        <span>{settingsItem.label}</span>
                                    </div>
                                </NavLink>
                                {!isPro && (
                                    <NavLink href={proItem.href} active={pathname.startsWith(proItem.href)}>
                                        <div className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors', pathname.startsWith(proItem.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50')}>
                                        <Gem className="w-5 h-5" />
                                        <span>{proItem.label}</span>
                                    </div>
                                    </NavLink>
                                )}
                                <Separator />
                                {user ? (
                                    <div className="text-center text-sm text-muted-foreground py-2">Logged in as {user.email}</div>
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
                    </SheetContent>
                </Sheet>
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
