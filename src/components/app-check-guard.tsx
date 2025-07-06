'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const AppCheckWarning = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="w-full max-w-2xl rounded-lg border-2 border-destructive bg-card p-8 text-center shadow-lg">
      <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
      <h1 className="text-2xl font-bold text-destructive">
        Action Required: App Check Not Configured
      </h1>
      <div className="mt-4 text-left text-card-foreground space-y-4">
        <p>
          This application uses Firebase App Check to protect its backend, but the required <strong>reCAPTCHA v3 Site Key</strong> is missing or invalid.
        </p>
        <p>
          To fix this, you must add your key to the project's environment file:
        </p>
        <ol className="list-decimal list-inside space-y-2 bg-muted p-4 rounded-md">
          <li>Open the Firebase Console for your project.</li>
          <li>Navigate to the <strong>App Check</strong> section (in the Build menu).</li>
          <li>Select your Web App under the "Apps" tab.</li>
          <li>Choose <strong>reCAPTCHA v3</strong> as the provider and get the <strong>Site Key</strong>.</li>
          <li>Open the <code className="bg-primary/10 text-primary px-1.5 py-1 rounded-md font-mono">.env</code> file in the code editor.</li>
          <li>
            Paste your key as the value for the <code className="bg-primary/10 text-primary px-1.5 py-1 rounded-md font-mono">NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> variable.
          </li>
        </ol>
        <p>
          After adding the key, the application should load correctly. This is a crucial security step.
        </p>
      </div>
    </div>
  </div>
);

export function AppCheckGuard({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey || siteKey === 'YOUR_RECAPTCHA_V3_SITE_KEY') {
    return <AppCheckWarning />;
  }

  return <>{children}</>;
}
