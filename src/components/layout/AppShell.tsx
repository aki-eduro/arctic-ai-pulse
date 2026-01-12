import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  headerProps?: React.ComponentProps<typeof Header>;
  mainClassName?: string;
}

export function AppShell({ children, headerProps, mainClassName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header {...headerProps} />
      <main className={cn('container px-4 py-8 flex-1', mainClassName)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
