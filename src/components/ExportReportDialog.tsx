import { useState, useRef } from 'react';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';
import { Download, FileText, Calendar, Tag as TagIcon, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Experiment } from '@/hooks/useExperiments';
import type { Tag } from '@/hooks/useTags';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  experiments: Experiment[];
  tags: Tag[];
  getTagsForExperiment: (experimentId: string) => Tag[];
}

export function ExportReportDialog({ experiments, tags, getTagsForExperiment }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredExperiments = experiments.filter(exp => {
    const expDate = parseISO(exp.created_at);
    const inDateRange = isWithinInterval(expDate, {
      start: parseISO(startDate),
      end: parseISO(endDate)
    });
    if (!inDateRange) return false;
    if (selectedTags.length === 0) return true;
    const expTags = getTagsForExperiment(exp.id);
    return selectedTags.some(tagId => expTags.some(t => t.id === tagId));
  });

  const { summaryStats, ratingDistribution } = useDashboardStats(filteredExperiments);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the report');
      return;
    }

    const content = reportRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Experiment Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, sans-serif; padding: 40px; color: #111; }
            .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; }
            .header h1 { font-size: 24px; font-weight: bold; color: #111; }
            .header p { color: #666; margin-top: 4px; }
            .header .date { font-size: 14px; }
            .header .filter { font-size: 12px; color: #999; }
            .header .generated { font-size: 11px; color: #999; margin-top: 8px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .stat-card { padding: 16px; background: #f9f9f9; border-radius: 8px; text-align: center; }
            .stat-card .value { font-size: 28px; font-weight: bold; color: #111; }
            .stat-card .value.success { color: #10b981; }
            .stat-card .label { font-size: 12px; color: #666; }
            .section { margin-bottom: 24px; }
            .section h2 { font-size: 16px; font-weight: 600; color: #111; margin-bottom: 12px; }
            .chart-container { display: flex; gap: 8px; align-items: flex-end; height: 120px; }
            .chart-bar { flex: 1; display: flex; flex-direction: column; align-items: center; }
            .chart-bar .bar { width: 100%; border-radius: 4px 4px 0 0; }
            .chart-bar .bar.green { background: #10b981; }
            .chart-bar .bar.amber { background: #f59e0b; }
            .chart-bar .bar.red { background: #ef4444; }
            .chart-bar .rating { font-size: 11px; color: #666; margin-top: 4px; }
            .chart-bar .count { font-size: 11px; font-weight: 500; color: #333; }
            .insights { padding: 16px; background: #f9f9f9; border-radius: 8px; }
            .insights ul { list-style: none; }
            .insights li { font-size: 13px; color: #444; padding: 4px 0; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    toast.success('Print dialog opened - save as PDF');
  };

  const getRatingColor = (r: number) => r >= 4 ? 'green' : r >= 3 ? 'amber' : 'red';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Summary Report
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="flex gap-2">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1" />
                <span className="self-center text-muted-foreground">to</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Filter by Tags
              </Label>
              <div className="flex flex-wrap gap-1">
                {tags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No tags</span>
                ) : (
                  tags.map(tag => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <div ref={reportRef} className="p-6 bg-white text-black rounded-lg border">
            <div className="header">
              <h1>Experiment Summary Report</h1>
              <p className="date">
                {format(parseISO(startDate), 'MMM dd, yyyy')} - {format(parseISO(endDate), 'MMM dd, yyyy')}
              </p>
              {selectedTags.length > 0 && (
                <p className="filter">
                  Filtered by: {selectedTags.map(id => tags.find(t => t.id === id)?.name).join(', ')}
                </p>
              )}
              <p className="generated">Generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="value">{summaryStats.totalExperiments}</div>
                <div className="label">Total</div>
              </div>
              <div className="stat-card">
                <div className="value">{summaryStats.averageRating.toFixed(1)}</div>
                <div className="label">Avg Rating</div>
              </div>
              <div className="stat-card">
                <div className="value success">{summaryStats.successRate}%</div>
                <div className="label">Success</div>
              </div>
              <div className="stat-card">
                <div className="value">{summaryStats.ratedExperiments}/{summaryStats.totalExperiments}</div>
                <div className="label">Rated</div>
              </div>
            </div>

            <div className="section">
              <h2>Rating Distribution</h2>
              <div className="chart-container">
                {ratingDistribution.map(({ rating, count }) => {
                  const max = Math.max(...ratingDistribution.map(r => r.count), 1);
                  const height = Math.max((count / max) * 100, 4);
                  return (
                    <div key={rating} className="chart-bar">
                      <div className={`bar ${getRatingColor(rating)}`} style={{ height: `${height}%` }} />
                      <div className="rating">★{rating}</div>
                      <div className="count">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="insights">
              <h2 style={{ marginBottom: '8px' }}>Key Insights</h2>
              <ul>
                <li>• {summaryStats.ratedExperiments} of {summaryStats.totalExperiments} experiments rated</li>
                <li>• {summaryStats.successRate}% achieved rating of 4 or higher</li>
                <li>• Average: {summaryStats.averageRating.toFixed(2)}/5</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">{filteredExperiments.length} experiments</p>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
