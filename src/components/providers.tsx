'use client';

import { UserProvider } from '@/hooks/use-user';
import React from 'react';
import { AppCheckGuard } from './app-check-guard';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            <AppCheckGuard>
                {children}
            </AppCheckGuard>
        </UserProvider>
    );
}
