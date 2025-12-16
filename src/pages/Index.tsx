import { useState, useMemo } from 'react';
import { useExperiments, ExperimentFormData } from '@/hooks/useExperiments';
import { useTags } from '@/hooks/useTags';
import { Header } from '@/components/Header';
import { ExperimentCard } from '@/components/ExperimentCard';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetail } from '@/components/ExperimentDetail';
import { ExperimentsTable } from '@/components/ExperimentsTable';
import { EmptyState } from '@/components/EmptyState';
import { ExperimentAnalyzer } from '@/components/ExperimentAnalyzer';
import { Dashboard } from '@/components/Dashboard';
import { ABComparison } from '@/components/ABComparison';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';

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
type ViewMode = 'cards' | 'table' | 'dashboard' | 'compare';

const Index = () => {
  const { experiments, isLoading, addExperiment, updateExperiment, deleteExperiment, getExperiment, createExperimentsRowByRow } = useExperiments();
  const { tags, getTagsForExperiment, createTag, addTagToExperiment, removeTagFromExperiment } = useTags();
  const { toast } = useToast();
  
  const [view, setView] = useState<View>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const selectedExperiment = selectedId ? getExperiment(selectedId) : undefined;

  // Filter experiments by selected tags
  const filteredExperiments = useMemo(() => {
    if (selectedTagIds.length === 0) return experiments;
    return experiments.filter(exp => {
      const expTags = getTagsForExperiment(exp.id);
      return selectedTagIds.some(tagId => expTags.some(t => t.id === tagId));
    });
  }, [experiments, selectedTagIds, getTagsForExperiment]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearTagFilter = () => {
    setSelectedTagIds([]);
  };

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

  const renderLoadingState = () => {
    if (viewMode === 'dashboard') {
      return <DashboardSkeleton />;
    }
    if (viewMode === 'table') {
      return <TableSkeleton rows={8} />;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          experimentCount={0}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenAnalyzer={() => {}}
          tags={[]}
          selectedTagIds={[]}
          onToggleTag={() => {}}
          onClearTagFilter={() => {}}
        />
        <main className="container mx-auto px-6 py-8">
          {renderLoadingState()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        experimentCount={filteredExperiments.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAnalyzer={() => setAnalyzerOpen(true)}
        tags={tags}
        selectedTagIds={selectedTagIds}
        onToggleTag={handleToggleTag}
        onClearTagFilter={handleClearTagFilter}
      />
      
      <ExperimentAnalyzer
        experiments={filteredExperiments}
        isOpen={analyzerOpen}
        onClose={() => setAnalyzerOpen(false)}
      />
      
      <main className="container mx-auto px-6 py-8">
        {view === 'list' && (
          <>
            {viewMode === 'dashboard' ? (
              <Dashboard experiments={filteredExperiments} />
            ) : viewMode === 'compare' ? (
              <ABComparison 
                experiments={filteredExperiments} 
                onBack={() => setViewMode('table')} 
              />
            ) : filteredExperiments.length === 0 ? (
              <EmptyState onNewExperiment={handleNewExperiment} />
            ) : viewMode === 'table' ? (
              <ExperimentsTable 
                experiments={filteredExperiments}
                onViewExperiment={handleViewExperiment}
                getTagsForExperiment={getTagsForExperiment}
                availableTags={tags}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperiments.map((experiment, index) => (
                  <div key={experiment.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ExperimentCard
                      experiment={experiment}
                      tags={getTagsForExperiment(experiment.id)}
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
              tags={tags}
              experimentTags={getTagsForExperiment(selectedExperiment.id)}
              onAddTag={(tagId) => addTagToExperiment(selectedExperiment.id, tagId)}
              onRemoveTag={(tagId) => removeTagFromExperiment(selectedExperiment.id, tagId)}
              onCreateTag={createTag}
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
