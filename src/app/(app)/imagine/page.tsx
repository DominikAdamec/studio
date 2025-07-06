'use client';

import React, {useActionState, useEffect, useRef} from 'react';
import {useFormStatus} from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {PageHeader} from '@/components/page-header';
import {useUser} from '@/hooks/use-user';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Loader2, Sparkles, Lock, Wand2, Frown, Coins} from 'lucide-react';
import {Textarea} from '@/components/ui/textarea';
import {generateImageAction} from '@/lib/actions';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';

function SubmitButton() {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Image (1 Credit)
        </>
      )}
    </Button>
  );
}

function ImageResult({state}: {state: any}) {
  const {pending} = useFormStatus();

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-lg aspect-square h-full">
      {pending ? (
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-muted-foreground/50 animate-spin mb-4" />
          <h3 className="text-xl font-semibold">Generating your vision...</h3>
          <p className="text-muted-foreground">This may take a few moments.</p>
        </div>
      ) : state.data ? (
        <Image
          src={state.data}
          alt={state.message || 'Generated image'}
          width={512}
          height={512}
          className="rounded-lg object-contain"
        />
      ) : state.message && state.message !== 'success' ? (
        <div className="text-center">
          <Frown className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold">Something went wrong</h3>
          <p className="text-muted-foreground max-w-sm">{state.message}</p>
        </div>
      ) : (
        <div className="text-center">
          <Wand2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold">Your Image Awaits</h3>
          <p className="text-muted-foreground max-w-sm">
            Your generated image will appear here once you submit a prompt.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ImaginePage() {
  const {isPro, loading: userLoading, userData} = useUser();
  const initialState = {message: null, errors: null, data: null};
  const [state, dispatch] = useActionState(generateImageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === 'success') {
      formRef.current?.reset();
    }
  }, [state]);

  if (userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 md:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">
              Image Generation is a PRO feature
            </h3>
            <p className="text-muted-foreground mt-2">
              Upgrade to Prompty PRO to generate images with our most powerful
              AI models.
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
        title="Imagine with AI"
        description="Turn your most creative ideas into images with Vertex AI."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <form action={dispatch} ref={formRef}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Generator</span>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Coins className="h-5 w-5 text-amber-500" />
                      <span>{userData?.credits ?? 0} Credits</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Describe the image you want to create in detail.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="prompt"
                    name="prompt"
                    placeholder="e.g., A photo of an astronaut riding a horse on Mars, cinematic lighting."
                    rows={5}
                    required
                    disabled={!userData?.credits || userData.credits <= 0}
                  />
                  {state.errors?.prompt && (
                    <p className="text-sm text-destructive mt-2">
                      {state.errors.prompt[0]}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <SubmitButton />
                </CardFooter>
              </Card>
              {userData?.credits === 0 && (
                <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertTitle>Out of Credits</AlertTitle>
                  <AlertDescription>
                    You have no credits left.
                    <Link
                      href="/pro"
                      className="font-semibold text-primary underline ml-1"
                    >
                      Get more credits
                    </Link>
                    to continue generating images.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <ImageResult state={state} />
          </div>
        </form>
      </div>
    </div>
  );
}
