
'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Frown, ImagePlus, Info, Loader2, Settings, Wand2 } from 'lucide-react';

import { describePhotoAction } from '@/lib/actions';
import { useUser } from '@/hooks/use-user';
import { PageHeader } from '@/components/page-header';
import { PromptCard } from '@/components/prompt-card';
import { ProBadge } from '@/components/pro-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import Link from 'next/link';

const GUEST_LIMIT = 10;

function SubmitButton({disabled}: {disabled?: boolean}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Describe Photo
        </>
      )}
    </Button>
  );
}

export default function DescribePage() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {user, isPro, loading: userLoading} = useUser();
  const [guestUsage, setGuestUsage] = useState({count: 0, date: ''});

  const initialState = {message: null, errors: null, data: null};
  const [state, dispatch] = useActionState(describePhotoAction, initialState);

  useEffect(() => {
    if (!user && !userLoading) {
      try {
        const storedUsage = localStorage.getItem('guestDescribeUsage');
        const today = new Date().toISOString().split('T')[0];
        if (storedUsage) {
          const usage = JSON.parse(storedUsage);
          if (usage.date === today) {
            setGuestUsage(usage);
          } else {
            // Reset for a new day
            setGuestUsage({count: 0, date: today});
          }
        } else {
          setGuestUsage({count: 0, date: today});
        }
      } catch (e) {
        console.error('Failed to parse guest usage from localStorage', e);
        setGuestUsage({
          count: 0,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (state.message === 'success' && !user) {
      const today = new Date().toISOString().split('T')[0];
      const newUsage = {count: guestUsage.count + 1, date: today};
      setGuestUsage(newUsage);
      try {
        localStorage.setItem('guestDescribeUsage', JSON.stringify(newUsage));
      } catch (e) {
        console.error('Failed to save guest usage to localStorage', e);
      }
    }
  }, [state, user, guestUsage.count]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        // 4MB limit
        setError('File is too large. Please select a file smaller than 4MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = e => {
        setPhotoDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const options = [
    {id: 'low', label: 'Low'},
    {id: 'normal', label: 'Normal'},
    {id: 'high', label: 'High'},
  ];

  const isGuestLimitReached = !user && guestUsage.count >= GUEST_LIMIT;

  if (userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Image Analysis Studio"
        description="Upload a photo and let the AI Chat Master analyze it and generate a detailed prompt."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            {isGuestLimitReached && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Daily Limit Reached</AlertTitle>
                <AlertDescription>
                  You've reached your daily limit of {GUEST_LIMIT} photo
                  descriptions for guests.
                  <Link
                    href="/signup"
                    className="font-semibold text-primary underline ml-1"
                  >
                    Sign up for free
                  </Link>{' '}
                  to continue.
                </AlertDescription>
              </Alert>
            )}
            <form action={dispatch} className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-6 flex flex-col items-center justify-center h-full aspect-square">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={isGuestLimitReached}
                  />
                  {photoDataUri ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden">
                      <Image
                        src={photoDataUri}
                        alt="Uploaded preview"
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        Upload a Photo
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select a file from your device
                      </p>
                    </div>
                  )}
                  {error && (
                    <p className="mt-4 text-sm text-center text-destructive">
                      {error}
                    </p>
                  )}
                </CardContent>
              </Card>

              <input
                type="hidden"
                name="photoDataUri"
                value={photoDataUri || ''}
              />
              <Button
                onClick={handleUploadClick}
                variant="outline"
                type="button"
                className="w-full"
                disabled={isGuestLimitReached}
              >
                {photoDataUri ? 'Change Photo' : 'Select Photo'}
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Settings className="w-5 h-5 mr-2" />
                    Output Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt Length</Label>
                    {state.errors?.promptLength && (
                      <p className="text-sm text-destructive">
                        {state.errors.promptLength[0]}
                      </p>
                    )}
                    <RadioGroup
                      name="promptLength"
                      defaultValue="normal"
                      className="flex gap-4"
                    >
                      {options.map(option => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`length-${option.id}`}
                            disabled={isGuestLimitReached}
                          />
                          <Label htmlFor={`length-${option.id}`}>
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Prompt Detail</Label>
                    {state.errors?.promptDetail && (
                      <p className="text-sm text-destructive">
                        {state.errors.promptDetail[0]}
                      </p>
                    )}
                    <RadioGroup
                      name="promptDetail"
                      defaultValue="normal"
                      className="flex gap-4"
                    >
                      {options.map(option => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`detail-${option.id}`}
                            disabled={isGuestLimitReached}
                          />
                          <Label htmlFor={`detail-${option.id}`}>
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="language">Output Language</Label>
                    <Select
                      name="language"
                      defaultValue="English"
                      disabled={isGuestLimitReached}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Česky">Česky</SelectItem>
                        <SelectItem value="Polski">Polski</SelectItem>
                        <SelectItem value="Español">Español</SelectItem>
                        <SelectItem value="Français">Français</SelectItem>
                        <SelectItem value="Deutsch">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                    {state.errors?.language && (
                      <p className="text-sm text-destructive">
                        {state.errors.language[0]}
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between space-x-2">
                    <Label
                      htmlFor="nsfw-switch"
                      className="flex flex-col space-y-1"
                    >
                      <span className="flex items-center">
                        Allow Potentially Unsafe Content{!isPro && <ProBadge />}
                      </span>
                      <span className="font-normal leading-snug text-muted-foreground text-xs">
                        Disable safety filters. Use with caution.
                      </span>
                    </Label>
                    <Switch
                      id="nsfw-switch"
                      name="allowNsfw"
                      disabled={!isPro || isGuestLimitReached}
                    />
                  </div>
                </CardContent>
              </Card>

              {photoDataUri && <SubmitButton disabled={isGuestLimitReached} />}
            </form>
          </div>

          <div className="flex flex-col gap-6">
            {state.data ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold flex items-center mb-2">
                    AI Description
                  </h3>
                  <p className="text-sm text-muted-foreground bg-card p-4 rounded-lg">
                    {state.data.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center mb-2">
                    Generated Prompt
                  </h3>
                  <PromptCard prompt={state.data.prompt} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg h-full">
                {state.message && state.message !== 'success' ? (
                  <>
                    <Frown className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold">
                      Something went wrong
                    </h3>
                    <p className="text-muted-foreground">{state.message}</p>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold">Awaiting Photo</h3>
                    <p className="text-muted-foreground">
                      Your AI-generated description and prompt will appear here
                      once you upload a photo and set your preferences.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
