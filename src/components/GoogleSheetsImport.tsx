import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, Loader2, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExperimentFormData } from "@/hooks/useExperiments";

interface GoogleSheetsImportProps {
  onImport: (data: ExperimentFormData[]) => Promise<void>;
}

const REQUIRED_FIELDS = ['name'];
const OPTIONAL_FIELDS = ['goal', 'mission', 'example', 'desired', 'rules', 'board_name', 'board_full_context', 'board_pulled_context', 'search_terms', 'search_context', 'agentic_prompt', 'output', 'rating', 'notes'];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export function GoogleSheetsImport({ onImport }: GoogleSheetsImportProps) {
  const [open, setOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sheetData, setSheetData] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'url' | 'mapping' | 'preview'>('url');
  const { toast } = useToast();

  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Google Sheets URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-google-sheet', {
        body: { sheetUrl },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSheetData(data);
      
      // Auto-map columns with matching names
      const autoMapping: Record<string, string> = {};
      ALL_FIELDS.forEach(field => {
        const matchingHeader = data.headers.find(
          (h: string) => h.toLowerCase().replace(/[_\s-]/g, '') === field.toLowerCase().replace(/[_\s-]/g, '')
        );
        if (matchingHeader) {
          autoMapping[field] = matchingHeader;
        }
      });
      setColumnMapping(autoMapping);
      setStep('mapping');

      toast({
        title: "Sheet loaded",
        description: `Found ${data.rows.length} rows with ${data.headers.length} columns`,
      });
    } catch (error: any) {
      console.error('Error fetching sheet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch Google Sheet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!sheetData) return;

    // Check required fields are mapped
    const missingRequired = REQUIRED_FIELDS.filter(field => !columnMapping[field]);
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required mappings",
        description: `Please map: ${missingRequired.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const experiments: ExperimentFormData[] = sheetData.rows.map(row => {
        const exp: ExperimentFormData = {
          name: row[columnMapping['name']] || '',
          goal: row[columnMapping['goal']] || '',
          mission: row[columnMapping['mission']] || '',
          example: row[columnMapping['example']] || '',
          desired: row[columnMapping['desired']] || '',
          rules: row[columnMapping['rules']] || '',
          board_name: row[columnMapping['board_name']] || '',
          board_full_context: row[columnMapping['board_full_context']] || '',
          board_pulled_context: row[columnMapping['board_pulled_context']] || '',
          search_terms: row[columnMapping['search_terms']] || '',
          search_context: row[columnMapping['search_context']] || '',
          agentic_prompt: row[columnMapping['agentic_prompt']] || '',
          output: row[columnMapping['output']] || '',
        };

        if (columnMapping['rating']) {
          const rating = parseInt(row[columnMapping['rating']]);
          if (!isNaN(rating)) exp.rating = rating;
        }
        if (columnMapping['notes']) {
          exp.notes = row[columnMapping['notes']];
        }

        return exp;
      }).filter(exp => exp.name); // Filter out rows without a name

      await onImport(experiments);

      toast({
        title: "Import successful",
        description: `Imported ${experiments.length} experiments from Google Sheets`,
      });

      // Reset state
      setOpen(false);
      setSheetUrl("");
      setSheetData(null);
      setColumnMapping({});
      setStep('url');
    } catch (error: any) {
      console.error('Error importing:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import experiments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMappedPreviewData = () => {
    if (!sheetData) return [];
    return sheetData.rows.slice(0, 5).map(row => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([field, header]) => {
        mapped[field] = row[header] || '';
      });
      return mapped;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sheet className="h-4 w-4" />
          Google Sheets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Google Sheets</DialogTitle>
          <DialogDescription>
            {step === 'url' && "Enter the URL of a public Google Sheet to import experiments."}
            {step === 'mapping' && "Map your sheet columns to experiment fields."}
            {step === 'preview' && "Review the data before importing."}
          </DialogDescription>
        </DialogHeader>

        {step === 'url' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Make sure your sheet is publicly accessible: File → Share → Anyone with the link → Viewer
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sheetUrl">Google Sheets URL</Label>
              <Input
                id="sheetUrl"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>

            <Button onClick={handleFetchSheet} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Fetch Sheet
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'mapping' && sheetData && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
              {REQUIRED_FIELDS.map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-sm">
                    {field.replace(/_/g, ' ')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={columnMapping[field] || ''}
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetData.headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {OPTIONAL_FIELDS.map(field => (
                <div key={field} className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    {field.replace(/_/g, ' ')} (optional)
                  </Label>
                  <Select
                    value={columnMapping[field] || '__none__'}
                    onValueChange={(value) => setColumnMapping(prev => ({ 
                      ...prev, 
                      [field]: value === '__none__' ? '' : value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {sheetData.headers.map(header => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('url')}>
                Back
              </Button>
              <Button onClick={() => setStep('preview')} className="flex-1">
                Preview Import
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && sheetData && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <p className="text-sm text-muted-foreground">
              Showing first 5 of {sheetData.rows.length} rows
            </p>
            
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(columnMapping).filter(k => columnMapping[k]).map(field => (
                      <TableHead key={field} className="whitespace-nowrap">
                        {field.replace(/_/g, ' ')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedPreviewData().map((row, i) => (
                    <TableRow key={i}>
                      {Object.keys(columnMapping).filter(k => columnMapping[k]).map(field => (
                        <TableCell key={field} className="max-w-[200px] truncate">
                          {row[field]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${sheetData.rows.length} Experiments`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
