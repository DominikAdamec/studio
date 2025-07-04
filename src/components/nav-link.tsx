'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function NavLink({ href, children, active, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </Link>
  );
}
