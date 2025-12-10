import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, X, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ExperimentFormData } from '@/hooks/useExperiments';

interface CSVImportProps {
  onImport: (experiments: ExperimentFormData[]) => Promise<void>;
}

interface ParsedRow {
  name: string;
  description?: string;
  raw_data_sources: string;
  extracted_context: string;
  prompt: string;
  full_injection: string;
  output: string;
  rating?: number;
  notes?: string;
  status: 'draft' | 'completed' | 'evaluating';
}

const REQUIRED_COLUMNS = ['name', 'raw_data_sources', 'extracted_context', 'prompt', 'full_injection', 'output'];
const OPTIONAL_COLUMNS = ['description', 'rating', 'notes', 'status'];

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows };
}

export function CSVImport({ onImport }: CSVImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processCSV = (text: string) => {
    const { headers, rows } = parseCSV(text);
    const validationErrors: string[] = [];

    // Check required columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      validationErrors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setParsedData([]);
      setIsOpen(true);
      return;
    }

    // Parse rows
    const parsed: ParsedRow[] = [];
    rows.forEach((row, index) => {
      if (row.every(cell => !cell.trim())) return; // Skip empty rows

      const getValue = (col: string): string => {
        const idx = headers.indexOf(col);
        return idx >= 0 ? (row[idx] || '') : '';
      };

      const name = getValue('name');
      if (!name.trim()) {
        validationErrors.push(`Row ${index + 2}: Name is required`);
        return;
      }

      const statusValue = getValue('status').toLowerCase();
      const status: 'draft' | 'completed' | 'evaluating' = 
        ['draft', 'completed', 'evaluating'].includes(statusValue) 
          ? statusValue as 'draft' | 'completed' | 'evaluating'
          : 'draft';

      const ratingStr = getValue('rating');
      const rating = ratingStr ? parseInt(ratingStr, 10) : undefined;
      const validRating = rating && rating >= 1 && rating <= 5 ? rating : undefined;

      parsed.push({
        name: name.trim(),
        description: getValue('description') || undefined,
        raw_data_sources: getValue('raw_data_sources'),
        extracted_context: getValue('extracted_context'),
        prompt: getValue('prompt'),
        full_injection: getValue('full_injection'),
        output: getValue('output'),
        rating: validRating,
        notes: getValue('notes') || undefined,
        status,
      });
    });

    setErrors(validationErrors);
    setParsedData(parsed);
    setIsOpen(true);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(parsedData);
      toast({
        title: 'Import successful',
        description: `${parsedData.length} experiment(s) imported.`,
      });
      setIsOpen(false);
      setParsedData([]);
      setErrors([]);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: 'There was an error importing the experiments.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Experiments from CSV
            </DialogTitle>
            <DialogDescription>
              Review the parsed data before importing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4">
            {errors.length > 0 && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Validation Errors
                </h4>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  {parsedData.length} experiment(s) ready to import
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Rating</th>
                        <th className="px-3 py-2 text-left font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                            {row.name}
                          </td>
                          <td className="px-3 py-2 capitalize">{row.status}</td>
                          <td className="px-3 py-2">{row.rating || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {[
                              row.raw_data_sources && 'sources',
                              row.extracted_context && 'context',
                              row.prompt && 'prompt',
                              row.output && 'output',
                            ].filter(Boolean).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 10 && (
                    <div className="px-3 py-2 bg-muted/50 text-sm text-muted-foreground text-center">
                      ... and {parsedData.length - 10} more
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Required columns:</strong> {REQUIRED_COLUMNS.join(', ')}<br />
                  <strong>Optional columns:</strong> {OPTIONAL_COLUMNS.join(', ')}
                </div>
              </div>
            )}

            {parsedData.length === 0 && errors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No valid data found in the CSV file.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={parsedData.length === 0 || isImporting}
            >
              {isImporting ? 'Importing...' : `Import ${parsedData.length} Experiment(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
