export interface Experiment {
  id: string;
  name: string;
  description?: string;
  rawDataSources: string;
  extractedContext: string;
  prompt: string;
  fullInjection: string;
  output: string;
  rating?: number;
  notes?: string;
  status: 'draft' | 'completed' | 'evaluating';
  createdAt: Date;
  updatedAt: Date;
}

export type ExperimentFormData = Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>;
