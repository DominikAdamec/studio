import { PageHeader } from '@/components/page-header';
import { ProBadge } from '@/components/pro-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Library, Folder, Tag } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Prompt Library"
        description="Your personal collection of saved prompts."
      />
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Library className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground mt-2">
                Save your favorite prompts and organize them here.
              </p>
              <div className="mt-6 text-left max-w-md mx-auto space-y-2">
                 <p className="text-sm text-muted-foreground flex items-center"><Folder className="w-4 h-4 mr-2 text-accent"/> Organize prompts into collections <ProBadge /></p>
                 <p className="text-sm text-muted-foreground flex items-center"><Tag className="w-4 h-4 mr-2 text-accent"/> Tag and search your prompts easily <ProBadge /></p>
              </div>
               <p className="text-xs text-muted-foreground mt-6">
                Upgrade to <Link href="/pro" className="underline text-primary">Prompty PRO</Link> to unlock these features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
