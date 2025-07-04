import React from 'react';

interface PageHeaderProps {
  title: string;
  description: React.ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="px-4 pt-6 md:px-8 md:pt-8 mb-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </header>
  );
}
