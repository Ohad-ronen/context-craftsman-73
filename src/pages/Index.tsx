import { useState } from 'react';
import { useExperiments, ExperimentFormData } from '@/hooks/useExperiments';
import { Header } from '@/components/Header';
import { ExperimentCard } from '@/components/ExperimentCard';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetail } from '@/components/ExperimentDetail';
import { ExperimentsTable } from '@/components/ExperimentsTable';
import { EmptyState } from '@/components/EmptyState';
import { CSVImport } from '@/components/CSVImport';
import { GoogleSheetsImport } from '@/components/GoogleSheetsImport';
import { ExperimentAnalyzer } from '@/components/ExperimentAnalyzer';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type View = 'list' | 'create' | 'detail' | 'edit';
type ViewMode = 'cards' | 'table';

const Index = () => {
  const { experiments, isLoading, addExperiment, updateExperiment, deleteExperiment, getExperiment, createExperimentsRowByRow } = useExperiments();
  const { toast } = useToast();
  
  const [view, setView] = useState<View>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);

  const selectedExperiment = selectedId ? getExperiment(selectedId) : undefined;

  const handleNewExperiment = () => {
    setSelectedId(null);
    setView('create');
  };

  const handleViewExperiment = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleEditExperiment = () => {
    setView('edit');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('list');
  };

  const handleSubmit = async (data: ExperimentFormData) => {
    if (view === 'edit' && selectedId) {
      const updated = await updateExperiment(selectedId, data);
      if (updated) {
        toast({
          title: "Experiment updated",
          description: "Your changes have been saved.",
        });
        setView('detail');
      }
    } else {
      const newExp = await addExperiment(data);
      if (newExp) {
        toast({
          title: "Experiment created",
          description: "Your experiment has been saved.",
        });
        setSelectedId(newExp.id);
        setView('detail');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedId) {
      const success = await deleteExperiment(selectedId);
      if (success) {
        toast({
          title: "Experiment deleted",
          description: "The experiment has been removed.",
        });
        setDeleteDialogOpen(false);
        handleBack();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleCSVImport = async (data: ExperimentFormData[]) => {
    for (const exp of data) {
      await addExperiment(exp);
    }
  };

  const handleGoogleSheetsImport = async (
    data: ExperimentFormData[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> => {
    return await createExperimentsRowByRow(data, onProgress);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onNewExperiment={handleNewExperiment} 
        experimentCount={experiments.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        csvImport={<CSVImport onImport={handleCSVImport} />}
        googleSheetsImport={<GoogleSheetsImport onImport={handleGoogleSheetsImport} />}
        onOpenAnalyzer={() => setAnalyzerOpen(true)}
      />
      
      <ExperimentAnalyzer
        experiments={experiments}
        isOpen={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
      />
      
      <main className="container mx-auto px-6 py-8">
        {view === 'list' && (
          <>
            {experiments.length === 0 ? (
              <EmptyState onNewExperiment={handleNewExperiment} />
            ) : viewMode === 'table' ? (
              <ExperimentsTable 
                experiments={experiments}
                onViewExperiment={handleViewExperiment}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiments.map((experiment, index) => (
                  <div key={experiment.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ExperimentCard
                      experiment={experiment}
                      onClick={() => handleViewExperiment(experiment.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              {view === 'create' ? 'New Experiment' : 'Edit Experiment'}
            </h2>
            <ExperimentForm
              initialData={view === 'edit' ? {
                name: selectedExperiment?.name || '',
                goal: selectedExperiment?.goal || '',
                mission: selectedExperiment?.mission || '',
                example: selectedExperiment?.example || '',
                desired: selectedExperiment?.desired || '',
                rules: selectedExperiment?.rules || '',
                board_name: selectedExperiment?.board_name || '',
                board_full_context: selectedExperiment?.board_full_context || '',
                board_pulled_context: selectedExperiment?.board_pulled_context || '',
                search_terms: selectedExperiment?.search_terms || '',
                search_context: selectedExperiment?.search_context || '',
                agentic_prompt: selectedExperiment?.agentic_prompt || '',
                output: selectedExperiment?.output || '',
                rating: selectedExperiment?.rating || undefined,
                notes: selectedExperiment?.notes || '',
              } : undefined}
              onSubmit={handleSubmit}
              onCancel={handleBack}
              isEditing={view === 'edit'}
            />
          </div>
        )}

        {view === 'detail' && selectedExperiment && (
          <div className="max-w-4xl mx-auto">
            <ExperimentDetail
              experiment={selectedExperiment}
              onBack={handleBack}
              onEdit={handleEditExperiment}
              onDelete={() => setDeleteDialogOpen(true)}
              onUpdate={async (id, data) => {
                await updateExperiment(id, data);
              }}
            />
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experiment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this experiment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
