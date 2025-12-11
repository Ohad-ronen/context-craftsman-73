import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  content: string;
}

export function JsonViewer({ content }: JsonViewerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['root']));
  const [copied, setCopied] = useState(false);

  // Try to parse as JSON
  let parsedJson: unknown = null;
  let isValidJson = false;
  
  try {
    parsedJson = JSON.parse(content);
    isValidJson = true;
  } catch {
    isValidJson = false;
  }

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

  const expandAll = () => {
    const allPaths = new Set<string>();
    const collectPaths = (obj: unknown, path: string) => {
      allPaths.add(path);
      if (Array.isArray(obj)) {
        obj.forEach((_, i) => collectPaths(obj[i], `${path}[${i}]`));
      } else if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => collectPaths((obj as Record<string, unknown>)[key], `${path}.${key}`));
      }
    };
    collectPaths(parsedJson, 'root');
    setExpandedItems(allPaths);
  };

  const collapseAll = () => {
    setExpandedItems(new Set(['root']));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(isValidJson ? JSON.stringify(parsedJson, null, 2) : content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (value: unknown, path: string, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedItems.has(path);
    const indent = depth * 16;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }
      
      return (
        <div>
          <button
            onClick={() => toggleExpand(path)}
            className="inline-flex items-center gap-1 hover:bg-secondary/50 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Array[{value.length}]</span>
          </button>
          {isExpanded && (
            <div className="border-l-2 border-border/50 ml-2 pl-3 mt-1 space-y-2">
              {value.map((item, index) => (
                <div key={index} className="relative">
                  <span className="absolute -left-6 text-xs text-muted-foreground font-mono">
                    {index}
                  </span>
                  <div className="bg-secondary/20 rounded-lg p-3">
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
            onClick={() => toggleExpand(path)}
            className="inline-flex items-center gap-1 hover:bg-secondary/50 rounded px-1 -ml-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Object{'{'}...{'}'}</span>
          </button>
          {isExpanded && (
            <div className="border-l-2 border-border/50 ml-2 pl-3 mt-1 space-y-1">
              {keys.map(key => (
                <div key={key}>
                  <span className="text-primary font-medium">{key}</span>
                  <span className="text-muted-foreground">: </span>
                  {renderValue((value as Record<string, unknown>)[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'string') {
      // Check if it's a long string that might need special formatting
      if (value.length > 100) {
        return (
          <span className="text-green-600 dark:text-green-400">
            "{value}"
          </span>
        );
      }
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-600 dark:text-purple-400">{value ? 'true' : 'false'}</span>;
    }

    if (value === null) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    return <span>{String(value)}</span>;
  };

  if (!isValidJson) {
    // Not JSON, render as plain text
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 h-8"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
        <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/30 rounded-lg p-4 overflow-x-auto">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="ml-auto"
        >
          {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          Copy
        </Button>
      </div>
      <div className="font-mono text-sm bg-secondary/30 rounded-lg p-4 overflow-x-auto">
        {renderValue(parsedJson, 'root')}
      </div>
    </div>
  );
}
