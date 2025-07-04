'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-user';
import { signOutAction } from '@/lib/actions';
import { Sparkles, User, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, isPro, loading } = useUser();

     if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        return (
             <div className="h-full flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Please log in</h3>
                        <p className="text-muted-foreground mt-2">
                           You need to be logged in to access the settings page.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/login">
                                Login
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <PageHeader
                title="Settings"
                description="Manage your account and app preferences."
            />
            <div className="flex-1 overflow-y-auto p-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">
                                <User className="mr-2 h-4 w-4" />
                                Account
                            </TabsTrigger>
                            <TabsTrigger value="about">
                                <Info className="mr-2 h-4 w-4" />
                                About
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Account Information</CardTitle>
                                    <CardDescription>
                                        Manage your subscription and account details.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="flex justify-between items-center p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">Email</h4>
                                            <p className="text-sm text-muted-foreground">
                                               {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">Subscription Plan</h4>
                                            <p className="text-sm text-muted-foreground">
                                                You are currently on the {isPro ? 'PRO' : 'Free'} plan.
                                            </p>
                                        </div>
                                        {!isPro && (
                                            <Button asChild>
                                                <Link href="/pro">
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Upgrade to PRO
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                     <form action={signOutAction}>
                                        <Button variant="outline" className="w-full">Sign Out</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="about">
                            <Card>
                                <CardHeader>
                                    <CardTitle>About Prompty</CardTitle>
                                    <CardDescription>
                                        Your AI-powered creative partner for prompt generation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>
                                        <strong>Version:</strong> 1.0.0
                                    </p>
                                    <p>
                                        Prompty is an application designed to help you create, discover, and refine high-quality prompts for AI image generators.
                                        Whether you're a digital artist, a hobbyist, or just exploring the possibilities of AI, Prompty provides the tools to spark your imagination.
                                    </p>
                                    <p>
                                        Built with Next.js, Firebase, Genkit, and ShadCN UI.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
