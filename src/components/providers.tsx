'use client';

import { UserProvider } from '@/hooks/use-user';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}
