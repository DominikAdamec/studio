'use client';

import React, { useState, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ImagePlus, Loader2, FileText, Wand2, Frown, Settings } from 'lucide-react';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PromptCard } from '@/components/prompt-card';
import { describePhotoAction } from '@/lib/actions';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
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

  const initialState = { message: null, errors: null, data: null };
  const [state, dispatch] = useActionState(describePhotoAction, initialState);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('File is too large. Please select a file smaller than 4MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const options = [
    { id: 'low', label: 'Low' },
    { id: 'normal', label: 'Normal' },
    { id: 'high', label: 'High' },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Describe Photo for Flux1.Dev"
        description="Upload a photo and our AI will describe it and create a generation prompt."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <form action={dispatch} className="flex flex-col gap-4">
             <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center h-full aspect-square">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                />
                {photoDataUri ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <Image src={photoDataUri} alt="Uploaded preview" layout="fill" objectFit="contain" />
                  </div>
                ) : (
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Upload a Photo</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Select a file from your device</p>
                  </div>
                )}
                 {error && <p className="mt-4 text-sm text-center text-destructive">{error}</p>}
              </CardContent>
            </Card>

            <input type="hidden" name="photoDataUri" value={photoDataUri || ''} />
            <Button onClick={handleUploadClick} variant="outline" type="button" className="w-full">
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
                   {state.errors?.promptLength && <p className="text-sm text-destructive">{state.errors.promptLength[0]}</p>}
                  <RadioGroup name="promptLength" defaultValue="normal" className="flex gap-4">
                    {options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`length-${option.id}`} />
                            <Label htmlFor={`length-${option.id}`}>{option.label}</Label>
                        </div>
                    ))}
                  </RadioGroup>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Prompt Detail</Label>
                   {state.errors?.promptDetail && <p className="text-sm text-destructive">{state.errors.promptDetail[0]}</p>}
                  <RadioGroup name="promptDetail" defaultValue="normal" className="flex gap-4">
                    {options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`detail-${option.id}`} />
                            <Label htmlFor={`detail-${option.id}`}>{option.label}</Label>
                        </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {photoDataUri && <SubmitButton />}
          </form>
          
          <div className="flex flex-col gap-6">
            {state.data ? (
                <>
                <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        AI Description
                    </h3>
                    <p className="text-sm text-muted-foreground bg-card p-4 rounded-lg">{state.data.description}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold flex items-center mb-2">
                        <Wand2 className="h-5 w-5 mr-2 text-primary" />
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
                            <h3 className="text-xl font-semibold">Something went wrong</h3>
                            <p className="text-muted-foreground">{state.message}</p>
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">Awaiting Photo</h3>
                            <p className="text-muted-foreground">Your AI-generated description and prompt will appear here once you upload a photo and set your preferences.</p>
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
