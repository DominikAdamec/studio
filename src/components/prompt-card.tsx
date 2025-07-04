'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PromptCardProps {
  prompt: string;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'The prompt is ready to be pasted.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-foreground flex-1">{prompt}</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          aria-label="Copy prompt"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
