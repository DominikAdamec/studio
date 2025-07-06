'use client';

import React from 'react';
import {CheckCircle, Sparkles, Loader2, Coins} from 'lucide-react';
import {PageHeader} from '@/components/page-header';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useUser} from '@/hooks/use-user';
import {useRouter} from 'next/navigation';
import {addCreditsAction, upgradeToProAction} from '@/lib/actions';
import {useToast} from '@/hooks/use-toast';

const proFeatures = [
  "Generate images with Vertex AI's Imagen model",
  'Generate prompts with specific artistic styles and moods',
  'Refine existing prompts for greater detail',
  'Get AI-powered prompt suggestions',
  'Advanced prompt organization with collections and tags',
  'Access to the AI Chat Master for collaborative editing',
];

export default function ProPage() {
  const {user, isPro, upgradeToPro, loading, userData} = useUser();
  const router = useRouter();
  const {toast} = useToast();
  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [isAddingCredits, setIsAddingCredits] = React.useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login?redirect=/pro');
      return;
    }
    setIsUpgrading(true);
    const result = await upgradeToProAction();
    if (result.success) {
      toast({title: 'Congratulations!', description: result.message});
    } else {
      toast({
        variant: 'destructive',
        title: 'Upgrade Failed',
        description: result.message,
      });
    }
    setIsUpgrading(false);
  };

  const handleAddCredits = async () => {
    setIsAddingCredits(true);
    const result = await addCreditsAction();
    if (result.success) {
      toast({title: 'Success!', description: result.message});
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
    setIsAddingCredits(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              {isPro ? (
                <Card className="mt-8 bg-background/50">
                  <CardHeader>
                    <CardTitle>Your Credits</CardTitle>
                    <CardDescription>
                      You have{' '}
                      <span className="font-bold text-primary">
                        {userData?.credits ?? 0}
                      </span>{' '}
                      credits remaining.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleAddCredits}
                      disabled={isAddingCredits}
                      className="w-full"
                    >
                      {isAddingCredits ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Coins className="mr-2 h-4 w-4" />
                      )}
                      {isAddingCredits
                        ? 'Adding...'
                        : 'Add 100 Credits (Simulation)'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isUpgrading
                    ? 'Upgrading...'
                    : user
                      ? 'Unlock PRO Now'
                      : 'Sign In to Upgrade'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
