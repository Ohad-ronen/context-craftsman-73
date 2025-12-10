import { useState } from 'react';
import { useExperiments } from '@/hooks/useExperiments';
import { Experiment, ExperimentFormData } from '@/types/experiment';
import { Header } from '@/components/Header';
import { ExperimentCard } from '@/components/ExperimentCard';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetail } from '@/components/ExperimentDetail';
import { EmptyState } from '@/components/EmptyState';
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

const Index = () => {
  const { experiments, isLoading, addExperiment, updateExperiment, deleteExperiment, getExperiment } = useExperiments();
  const { toast } = useToast();
  
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleSubmit = (data: ExperimentFormData) => {
    if (view === 'edit' && selectedId) {
      updateExperiment(selectedId, data);
      toast({
        title: "Experiment updated",
        description: "Your changes have been saved.",
      });
      setView('detail');
    } else {
      const newExp = addExperiment(data);
      toast({
        title: "Experiment created",
        description: "Your experiment has been saved.",
      });
      setSelectedId(newExp.id);
      setView('detail');
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      deleteExperiment(selectedId);
      toast({
        title: "Experiment deleted",
        description: "The experiment has been removed.",
      });
      setDeleteDialogOpen(false);
      handleBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNewExperiment={handleNewExperiment} experimentCount={experiments.length} />
      
      <main className="container mx-auto px-6 py-8">
        {view === 'list' && (
          <>
            {experiments.length === 0 ? (
              <EmptyState onNewExperiment={handleNewExperiment} />
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
              initialData={view === 'edit' ? selectedExperiment : undefined}
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
