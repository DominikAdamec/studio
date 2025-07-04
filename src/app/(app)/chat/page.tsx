'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, Lock, User, SendHorizonal, Loader2, Paperclip, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { chatAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'model';
  content: string;
  image?: string;
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
                {message.image && (
                    <div className="relative aspect-square mb-2 rounded-md overflow-hidden">
                        <Image src={message.image} alt="User upload" layout="fill" objectFit="cover" />
                    </div>
                )}
                {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}
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
  const { isPro, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', content: "Hello! I'm Prompty, your AI assistant for crafting amazing image prompts. How can I help you today? You can upload an image for inspiration." }
  ]);
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, pending]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: 'destructive',
            title: 'File too large',
            description: 'Please select a file smaller than 4MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!prompt.trim() && !image) || pending) return;

    const userMessage: Message = { role: 'user', content: prompt, image: image };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    const currentImage = image;

    setPrompt('');
    setImage(null);
    setPending(true);

    const historyForApi = messages.map(msg => {
        const content: any[] = [];
        if (msg.content) {
            content.push({ text: msg.content });
        }
        // Model doesn't have image capabilities in its response, only user can send
        if (msg.image && msg.role === 'user') {
            content.push({ media: { url: msg.image } });
        }
        return { role: msg.role, content: content };
    });
    
    const formData = new FormData();
    formData.append('history', JSON.stringify(historyForApi));
    formData.append('prompt', currentPrompt);
    if(currentImage) {
        formData.append('image', currentImage);
    }

    const result = await chatAction(null, formData);
    
    if (result.message === 'success' && result.data) {
      setMessages(prev => [...prev, { role: 'model', content: result.data! }]);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'An unknown error occurred.',
      });
      // Restore the message that failed to send
      setMessages(prev => prev.slice(0, -1));
      setPrompt(currentPrompt);
      setImage(currentImage);
    }
    setPending(false);
  };

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
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-4 -mr-4">
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
            </div>
            <div className="pt-4">
             <form ref={formRef} onSubmit={handleSubmit} className="relative">
                {image && (
                    <div className="p-2">
                        <div className="relative w-24 h-24 rounded-md overflow-hidden">
                             <Image src={image} alt="Preview" layout="fill" objectFit="cover" />
                             <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 hover:bg-black/75 text-white hover:text-white"
                                onClick={() => setImage(null)}
                             >
                                <X className="h-4 w-4"/>
                             </Button>
                        </div>
                    </div>
                )}
                <div className="flex items-start gap-2 border rounded-lg p-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        disabled={pending}
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={pending}
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Textarea
                        name="prompt"
                        placeholder="Ask me anything, or attach an image..."
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
                        className="resize-none border-0 shadow-none focus-visible:ring-0 p-0"
                    />
                    <Button type="submit" size="icon" disabled={pending || (!prompt.trim() && !image)}>
                        {pending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <SendHorizonal className="h-4 w-4" />
                        )}
                    </Button>
                </div>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
}
