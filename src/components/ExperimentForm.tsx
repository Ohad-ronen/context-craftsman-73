import { useState } from 'react';
import { ExperimentFormData } from '@/hooks/useExperiments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StepIndicator } from './StepIndicator';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Brain, MessageSquare, Sparkles, FileOutput, Save, ArrowDown } from 'lucide-react';

interface ExperimentFormProps {
  initialData?: Partial<ExperimentFormData>;
  onSubmit: (data: ExperimentFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ExperimentForm({ initialData, onSubmit, onCancel, isEditing = false }: ExperimentFormProps) {
  const [formData, setFormData] = useState<ExperimentFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    raw_data_sources: initialData?.raw_data_sources || '',
    extracted_context: initialData?.extracted_context || '',
    prompt: initialData?.prompt || '',
    full_injection: initialData?.full_injection || '',
    output: initialData?.output || '',
    rating: initialData?.rating,
    notes: initialData?.notes || '',
    status: initialData?.status || 'draft',
  });

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleChange = (field: keyof ExperimentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const steps = [
    { key: 'raw_data_sources', label: 'Raw Data Sources', step: 'input' as const, icon: Database, placeholder: 'Enter your raw data sources (APIs, databases, files, etc.)' },
    { key: 'extracted_context', label: 'Extracted Context', step: 'context' as const, icon: Brain, placeholder: 'What context did you extract from the raw data?' },
    { key: 'prompt', label: 'Prompt', step: 'prompt' as const, icon: MessageSquare, placeholder: 'Enter the prompt template you used' },
    { key: 'full_injection', label: 'Full Prompt + Context', step: 'prompt' as const, icon: Sparkles, placeholder: 'The complete prompt with context injected' },
    { key: 'output', label: 'Output', step: 'output' as const, icon: FileOutput, placeholder: 'The generated output from the agent' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Experiment Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Give your experiment a memorable name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Brief description of what you're testing"
          />
        </div>
      </div>

      {/* Flow Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <Card 
                className={`glass-card transition-all duration-300 ${activeStep === index ? 'ring-2 ring-primary/50' : ''}`}
                onFocus={() => setActiveStep(index)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <StepIndicator step={step.step} label={step.label} isActive={activeStep === index} />
                  </div>
                  <Textarea
                    value={formData[step.key as keyof ExperimentFormData] as string}
                    onChange={(e) => handleChange(step.key as keyof ExperimentFormData, e.target.value)}
                    placeholder={step.placeholder}
                    className="min-h-[150px]"
                    onFocus={() => setActiveStep(index)}
                  />
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Evaluation */}
      <Card className="glass-card">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="p-1 rounded bg-step-output/20">
              <Sparkles className="w-4 h-4 text-step-output" />
            </span>
            Evaluation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={formData.rating || ''}
                onChange={(e) => handleChange('rating', parseInt(e.target.value) || 0)}
                placeholder="Rate this experiment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="flex h-11 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="draft">Draft</option>
                <option value="evaluating">Evaluating</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any observations, learnings, or next steps..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          {isEditing ? 'Update Experiment' : 'Save Experiment'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
