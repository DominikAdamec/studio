'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { useProStatus } from '@/hooks/use-pro-status';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, Lock, User, SendHorizonal, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { chatAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'model';
  content: string;
};

function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    return (
        <div className={cn("flex items-start gap-4", isUser ? "justify-end" : "")}>
             {!isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "p-4 rounded-lg max-w-[80%]",
                isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}

export default function ChatPage() {
  const { isPro, isLoaded } = useProStatus();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', content: "Hello! I'm Prompty, your AI assistant for crafting amazing image prompts. How can I help you today?" }
  ]);
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || pending) return;

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setPending(true);

    const historyForApi = messages.map(msg => ({
        role: msg.role,
        content: [{ text: msg.content }],
    }));
    
    const formData = new FormData();
    formData.append('history', JSON.stringify(historyForApi));
    formData.append('prompt', prompt);

    const result = await chatAction(null, formData);
    
    if (result.message === 'success' && result.data) {
      setMessages(prev => [...prev, { role: 'model', content: result.data! }]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'An unknown error occurred.',
      });
      setMessages(prev => prev.slice(0, -1));
    }
    setPending(false);
  };

  if (!isLoaded) {
    return null;
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
      <div className="flex-1 overflow-y-hidden p-4 md:px-8">
         <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-1 pr-4 -mr-4" viewportRef={viewportRef}>
              <div className="space-y-6 pb-4">
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}
                {pending && (
                  <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                    </Avatar>
                    <div className="p-4 rounded-lg bg-muted flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Prompty is thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="py-4">
              <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
                <Textarea
                  name="prompt"
                  placeholder="Ask me anything about prompt engineering..."
                  rows={1}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  disabled={pending}
                  className="resize-none"
                />
                <Button type="submit" size="icon" disabled={pending || !prompt.trim()}>
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
}
