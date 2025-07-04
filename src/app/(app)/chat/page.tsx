'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { useProStatus } from '@/hooks/use-pro-status';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, Lock } from 'lucide-react';

export default function ChatPage() {
  const { isPro, isLoaded } = useProStatus();

  if (!isLoaded) {
    return null; // or a loading skeleton
  }

  if (!isPro) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 md:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">AI Chat Master is a PRO feature</h3>
            <p className="text-muted-foreground mt-2">
              Upgrade to Prompty PRO to chat with our AI, refine prompts in real-time, and get tailored assistance.
            </p>
            <Button asChild className="mt-6">
              <Link href="/pro">
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to PRO
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
       <PageHeader
        title="AI Chat Master"
        description="Chat with our AI to refine and perfect your prompts."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
         <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Chat Interface Coming Soon</h3>
              <p className="text-muted-foreground mt-2">
                This is where you'll be able to interact with the AI Chat Master. Upload photos, discuss parts of an image, and edit prompts collaboratively.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
