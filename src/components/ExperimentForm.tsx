import { useState } from 'react';
import { ExperimentFormData } from '@/hooks/useExperiments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Target, Compass, BookOpen, Sparkles, ScrollText, Layout, Database, Search, Brain, FileOutput, Save, ArrowDown, Globe } from 'lucide-react';

interface ExperimentFormProps {
  initialData?: Partial<ExperimentFormData>;
  onSubmit: (data: ExperimentFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function ExperimentForm({ initialData, onSubmit, onCancel, isEditing = false }: ExperimentFormProps) {
  const [formData, setFormData] = useState<ExperimentFormData>({
    name: initialData?.name || '',
    goal: initialData?.goal || '',
    mission: initialData?.mission || '',
    example: initialData?.example || '',
    desired: initialData?.desired || '',
    rules: initialData?.rules || '',
    board_name: initialData?.board_name || '',
    board_full_context: initialData?.board_full_context || '',
    board_pulled_context: initialData?.board_pulled_context || '',
    search_terms: initialData?.search_terms || '',
    search_context: initialData?.search_context || '',
    agentic_prompt: initialData?.agentic_prompt || '',
    output: initialData?.output || '',
    rating: initialData?.rating,
    notes: initialData?.notes || '',
    use_websearch: initialData?.use_websearch ?? false,
  });

  const [activeStep, setActiveStep] = useState<number>(0);

  const handleChange = (field: keyof ExperimentFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const steps = [
    { key: 'goal', label: 'The Goal', icon: Target, placeholder: 'What is the goal of this experiment?' },
    { key: 'mission', label: 'The Mission', icon: Compass, placeholder: 'What is the mission?' },
    { key: 'example', label: 'The Example', icon: BookOpen, placeholder: 'Provide an example' },
    { key: 'desired', label: 'Desired', icon: Sparkles, placeholder: 'What is the desired outcome?' },
    { key: 'rules', label: 'Rules', icon: ScrollText, placeholder: 'What rules should be followed?' },
    { key: 'board_name', label: 'Board Name', icon: Layout, placeholder: 'Enter the board name' },
    { key: 'board_full_context', label: 'Board Full Context', icon: Database, placeholder: 'Full context from the board' },
    { key: 'board_pulled_context', label: 'Board Pulled Context', icon: Database, placeholder: 'Pulled context from the board' },
    { key: 'search_terms', label: 'Search Terms', icon: Search, placeholder: 'Enter search terms' },
    { key: 'search_context', label: 'Search Context', icon: Search, placeholder: 'Context from search results' },
    { key: 'agentic_prompt', label: 'The Agentic Prompt', icon: Brain, placeholder: 'Enter the agentic prompt' },
    { key: 'output', label: 'The Output', icon: FileOutput, placeholder: 'The generated output from the agent' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
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

      {/* Flow Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <Card 
                className={`glass-card transition-all duration-300 ${activeStep === index ? 'ring-2 ring-primary/50' : ''}`}
                onFocus={() => setActiveStep(index)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <Label className="text-sm font-medium">{step.label}</Label>
                  </div>
                  <Textarea
                    value={formData[step.key as keyof ExperimentFormData] as string}
                    onChange={(e) => handleChange(step.key as keyof ExperimentFormData, e.target.value)}
                    placeholder={step.placeholder}
                    className="min-h-[100px]"
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

      {/* Settings */}
      <Card className="glass-card">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/20">
              <Globe className="w-4 h-4 text-blue-500" />
            </span>
            Settings
          </h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use_websearch">Web Search Enabled</Label>
              <p className="text-sm text-muted-foreground">
                This experiment used web search for context
              </p>
            </div>
            <Switch
              id="use_websearch"
              checked={formData.use_websearch}
              onCheckedChange={(checked) => handleChange('use_websearch', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluation */}
      <Card className="glass-card">
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="p-1 rounded bg-step-output/20">
              <Sparkles className="w-4 h-4 text-step-output" />
            </span>
            Evaluation
          </h3>
          <div className="space-y-4">
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any observations, learnings, or next steps..."
                className="min-h-[100px]"
              />
            </div>
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
