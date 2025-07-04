'use client';

import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProStatus } from '@/hooks/use-pro-status';
import { useToast } from '@/hooks/use-toast';

const proFeatures = [
  'Generate prompts with specific artistic styles and moods',
  'Refine existing prompts for greater detail',
  'Get AI-powered prompt suggestions',
  'Advanced prompt organization with collections and tags',
  'Export your prompt library (JSON, CSV, text)',
  'Access to the AI Chat Master for collaborative editing',
];

export default function ProPage() {
  const { isPro, setProStatus } = useProStatus();
  const { toast } = useToast();

  const handleUpgrade = () => {
    setProStatus(true);
    toast({
      title: 'Congratulations!',
      description: "You've unlocked Prompty PRO! All features are now available.",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Prompty PRO"
        description="Unlock your full creative potential with our advanced features."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader className="text-center">
              <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-3xl font-bold">
                {isPro ? "You're a PRO!" : 'Upgrade to PRO'}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                {isPro
                  ? 'Thank you for being a supporter. Enjoy all the features!'
                  : 'Get unlimited access to all our premium features.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-4 mb-8">
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              {!isPro && (
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold"
                  onClick={handleUpgrade}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Unlock PRO Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
