import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3 px-4 py-3">
        <SidebarTrigger className="h-8 w-8" />
        {title && (
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        )}
      </div>
    </header>
  );
}
