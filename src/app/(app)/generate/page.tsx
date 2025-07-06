'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Wand2, Loader2, Sparkles, Frown } from 'lucide-react';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { ProBadge } from '@/components/pro-badge';
import { PromptCard } from '@/components/prompt-card';
import { generateIdeasAction } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Prompts
        </>
      )}
    </Button>
  );
}

export default function GeneratePage() {
  const { isPro, loading: userLoading } = useUser();
  const initialState = { message: null, errors: null, data: null };
  const [state, dispatch] = useActionState(generateIdeasAction, initialState);

  if (userLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Prompt Studio"
        description="Let the AI Chat Master spark your imagination with unique prompt ideas."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <form action={dispatch}>
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic or Idea</Label>
                    <Textarea
                      id="topic"
                      name="topic"
                      placeholder="e.g., A futuristic city on Mars, a mystical forest creature"
                      rows={3}
                      required
                    />
                     {state.errors?.topic && <p className="text-sm text-destructive">{state.errors.topic[0]}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="style" className="flex items-center">
                        Artistic Style {!isPro && <ProBadge />}
                      </Label>
                      <Input
                        id="style"
                        name="style"
                        placeholder="e.g., Van Gogh, Cyberpunk, Anime"
                        disabled={!isPro}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mood" className="flex items-center">
                        Mood {!isPro && <ProBadge />}
                      </Label>
                      <Input
                        id="mood"
                        name="mood"
                        placeholder="e.g., Serene, Melancholic, Energetic"
                        disabled={!isPro}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end p-6 pt-0">
                <SubmitButton />
              </CardFooter>
            </Card>
          </form>

          {state.data && Array.isArray(state.data) && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold flex items-center mb-4">
                <Sparkles className="h-6 w-6 mr-2 text-accent" />
                Generated Ideas
              </h2>
              <div className="grid gap-4">
                {state.data.map((prompt: string, index: number) => (
                  <PromptCard key={index} prompt={prompt} />
                ))}
              </div>
            </div>
          )}

          {state.message && state.message !== 'success' && (
             <div className="mt-8 flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg">
                <Frown className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">Something went wrong</h3>
                <p className="text-muted-foreground">{state.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
