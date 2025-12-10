import { useState, useEffect } from 'react';
import { Experiment, ExperimentFormData } from '@/types/experiment';

const STORAGE_KEY = 'agent-experiments';

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setExperiments(parsed.map((exp: Experiment) => ({
        ...exp,
        createdAt: new Date(exp.createdAt),
        updatedAt: new Date(exp.updatedAt),
      })));
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = (exps: Experiment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exps));
  };

  const addExperiment = (data: ExperimentFormData): Experiment => {
    const newExperiment: Experiment = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [newExperiment, ...experiments];
    setExperiments(updated);
    saveToStorage(updated);
    return newExperiment;
  };

  const updateExperiment = (id: string, data: Partial<ExperimentFormData>): Experiment | null => {
    const index = experiments.findIndex(exp => exp.id === id);
    if (index === -1) return null;
    
    const updated = [...experiments];
    updated[index] = {
      ...updated[index],
      ...data,
      updatedAt: new Date(),
    };
    setExperiments(updated);
    saveToStorage(updated);
    return updated[index];
  };

  const deleteExperiment = (id: string): boolean => {
    const updated = experiments.filter(exp => exp.id !== id);
    setExperiments(updated);
    saveToStorage(updated);
    return true;
  };

  const getExperiment = (id: string): Experiment | undefined => {
    return experiments.find(exp => exp.id === id);
  };

  return {
    experiments,
    isLoading,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    getExperiment,
  };
}
