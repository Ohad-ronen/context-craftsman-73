import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactJsonViewerProps {
  content: string;
  className?: string;
}

export function CompactJsonViewer({ content, className }: CompactJsonViewerProps) {
  let parsedJson: unknown = null;
  let isValidJson = false;
  
  try {
    parsedJson = JSON.parse(content);
    isValidJson = true;
  } catch {
    isValidJson = false;
  }

  // Collect all paths for expand all by default
  const allPaths = useMemo(() => {
    const paths = new Set<string>();
    const collectPaths = (obj: unknown, path: string) => {
      paths.add(path);
      if (Array.isArray(obj)) {
        obj.forEach((_, i) => collectPaths(obj[i], `${path}[${i}]`));
      } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => collectPaths((obj as Record<string, unknown>)[key], `${path}.${key}`));
      }
    };
    if (isValidJson) {
      collectPaths(parsedJson, 'root');
    }
    return paths;
  }, [content, isValidJson]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(allPaths);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderValue = (value: unknown, path: string, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedItems.has(path);

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }
      
      return (
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(path); }}
            className="inline-flex items-center gap-1 hover:bg-secondary/50 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-muted-foreground text-xs">Array[{value.length}]</span>
          </button>
          {isExpanded && (
            <div className="border-l border-border/50 ml-1.5 pl-2 mt-1 space-y-1.5">
              {value.map((item, index) => (
                <div key={index} className="relative">
                  <span className="absolute -left-4 text-[10px] text-muted-foreground font-mono">
                    {index}
                  </span>
                  <div className="bg-secondary/30 rounded p-2">
                    {renderValue(item, `${path}[${index}]`, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (value && typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-muted-foreground">{'{}'}</span>;
      }

      return (
        <div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(path); }}
            className="inline-flex items-center gap-1 hover:bg-secondary/50 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-muted-foreground text-xs">{keys.length} fields</span>
          </button>
          {isExpanded && (
            <div className="border-l border-border/50 ml-1.5 pl-2 mt-1 space-y-0.5">
              {keys.map(key => (
                <div key={key} className="flex flex-wrap gap-1">
                  <span className="text-primary text-xs font-medium shrink-0">{key}:</span>
                  <div className="flex-1 min-w-0">
                    {renderValue((value as Record<string, unknown>)[key], `${path}.${key}`, depth + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'string') {
      if (value.length > 150) {
        return (
          <span className="text-green-600 dark:text-green-400 text-xs break-words">
            "{value.slice(0, 150)}..."
          </span>
        );
      }
      return <span className="text-green-600 dark:text-green-400 text-xs break-words">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400 text-xs">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600 dark:text-purple-400 text-xs">{value ? 'true' : 'false'}</span>;
    }

    if (value === null) {
      return <span className="text-muted-foreground italic text-xs">null</span>;
    }

    return <span className="text-xs">{String(value)}</span>;
  };

  if (!isValidJson) {
    return (
      <pre className={cn("whitespace-pre-wrap text-sm", className)}>
        {content}
      </pre>
    );
  }

  return (
    <div className={cn("font-mono text-xs", className)}>
      {renderValue(parsedJson, 'root')}
    </div>
  );
}
