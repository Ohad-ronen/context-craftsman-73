import { useState, useMemo, useCallback } from 'react';
import { useExperiments, ExperimentFormData } from '@/hooks/useExperiments';
import { useTags } from '@/hooks/useTags';
import { useKeyboardShortcuts, Shortcut } from '@/hooks/useKeyboardShortcuts';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ExperimentCard } from '@/components/ExperimentCard';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetail } from '@/components/ExperimentDetail';
import { ExperimentsTable } from '@/components/ExperimentsTable';
import { EmptyState } from '@/components/EmptyState';
import { ExperimentAnalyzer } from '@/components/ExperimentAnalyzer';
import { BulkAIEvaluation } from '@/components/BulkAIEvaluation';
import { Dashboard } from '@/components/Dashboard';
import { ABComparison } from '@/components/ABComparison';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { NotificationCenter } from '@/components/NotificationCenter';
import { TeamChatPanel } from '@/components/TeamChatPanel';
import { OnboardingTour } from '@/components/OnboardingTour';
import { ExportReportDialog } from '@/components/ExportReportDialog';
import { OutputBattle } from '@/components/OutputBattle';

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
type ViewMode = 'cards' | 'table' | 'dashboard' | 'compare' | 'insights' | 'battle';

const Index = () => {
  const { experiments, isLoading, addExperiment, updateExperiment, deleteExperiment, getExperiment, createExperimentsRowByRow } = useExperiments();
  const { tags, getTagsForExperiment, createTag, deleteTag, addTagToExperiment, removeTagFromExperiment } = useTags();
  const { toast } = useToast();
  
  const [view, setView] = useState<View>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkEvalOpen, setBulkEvalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const selectedExperiment = selectedId ? getExperiment(selectedId) : undefined;

  // Filter experiments by selected tags
  const filteredExperiments = useMemo(() => {
    if (selectedTagIds.length === 0) return experiments;
    return experiments.filter(exp => {
      const expTags = getTagsForExperiment(exp.id);
      return selectedTagIds.some(tagId => expTags.some(t => t.id === tagId));
    });
  }, [experiments, selectedTagIds, getTagsForExperiment]);

  // Count unrated experiments with output
  const unratedCount = useMemo(() => {
    return experiments.filter(exp => exp.rating === null && exp.output && exp.output.trim().length > 0).length;
  }, [experiments]);

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

  const handleDeleteTag = async (tagId: string) => {
    const success = await deleteTag(tagId);
    if (success) {
      setSelectedTagIds(prev => prev.filter(id => id !== tagId));
      toast({
        title: "Tag deleted",
        description: "The tag has been removed from the system.",
      });
    }
    return success;
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

  // Keyboard shortcuts
  const shortcuts: Shortcut[] = useMemo(() => [
    { key: '?', handler: () => setShortcutsOpen(true), description: 'Show keyboard shortcuts', category: 'General' },
    { key: 'Escape', handler: () => { 
      if (shortcutsOpen) setShortcutsOpen(false);
      else if (bulkEvalOpen) setBulkEvalOpen(false);
      else if (chatOpen) setChatOpen(false);
      else if (view !== 'list') handleBack();
      else setSelectedTagIds([]);
    }, description: 'Close dialog / Go back / Clear filters', category: 'General' },
    { key: 'd', handler: () => { setViewMode('dashboard'); setView('list'); }, description: 'Dashboard view', category: 'Navigation' },
    { key: 't', handler: () => { setViewMode('table'); setView('list'); }, description: 'Table view', category: 'Navigation' },
    { key: 'g', handler: () => { setViewMode('cards'); setView('list'); }, description: 'Cards (grid) view', category: 'Navigation' },
    { key: 'c', handler: () => { setViewMode('compare'); setView('list'); }, description: 'Compare view', category: 'Navigation' },
    { key: 'a', handler: () => { setViewMode('insights'); setView('list'); }, description: 'AI Insights view', category: 'Navigation' },
    { key: 'o', handler: () => { setViewMode('battle'); setView('list'); }, description: 'Output Battle', category: 'Navigation' },
    { key: 'b', handler: () => setBulkEvalOpen(true), description: 'Bulk AI evaluation', category: 'Actions' },
    { key: 'm', handler: () => setChatOpen(prev => !prev), description: 'Toggle team chat', category: 'Actions' },
    { key: 'k', ctrl: true, handler: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(), description: 'Focus search', category: 'Actions' },
  ], [view, shortcutsOpen, bulkEvalOpen, chatOpen]);

  useKeyboardShortcuts(shortcuts, !deleteDialogOpen);

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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setView('list'); // Always return to list view when changing view mode
  };

  const sidebarProps = {
    experimentCount: filteredExperiments.length,
    viewMode,
    onViewModeChange: handleViewModeChange,
    onOpenBulkEval: () => setBulkEvalOpen(true),
    unratedCount,
    onOpenShortcuts: () => setShortcutsOpen(true),
    tags,
    selectedTagIds,
    onToggleTag: handleToggleTag,
    onClearTagFilter: handleClearTagFilter,
    onDeleteTag: handleDeleteTag,
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar {...sidebarProps} experimentCount={0} />
          <div className="flex-1 flex flex-col">
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
              <div className="flex items-center justify-between px-4 py-3">
                <SidebarTrigger className="h-8 w-8" />
                <NotificationCenter />
              </div>
            </header>
            <main className="flex-1 p-6">
              {renderLoadingState()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar {...sidebarProps} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-8 w-8" />
                <span className="text-sm text-muted-foreground capitalize">
                  {view === 'list' ? viewMode : view} View
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ExportReportDialog 
                  experiments={experiments}
                  tags={tags}
                  getTagsForExperiment={getTagsForExperiment}
                />
                <div data-tour="notifications">
                  <NotificationCenter />
                </div>
              </div>
            </div>
          </header>

          <BulkAIEvaluation
            isOpen={bulkEvalOpen}
            onClose={() => setBulkEvalOpen(false)}
            experiments={experiments}
            updateExperiment={updateExperiment}
          />
          
          <main className="flex-1 p-6 overflow-auto">
            {view === 'list' && (
              <>
                {viewMode === 'battle' ? (
                  <OutputBattle 
                    experiments={filteredExperiments}
                    onViewExperiment={handleViewExperiment}
                  />
                ) : viewMode === 'insights' ? (
                  <ExperimentAnalyzer experiments={filteredExperiments} />
                ) : viewMode === 'dashboard' ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </div>

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

        <KeyboardShortcutsDialog 
          open={shortcutsOpen} 
          onOpenChange={setShortcutsOpen}
          shortcuts={shortcuts}
        />

        <div data-tour="team-chat">
          <TeamChatPanel 
            isOpen={chatOpen} 
            onToggle={() => setChatOpen(!chatOpen)} 
            experiments={experiments}
            onViewExperiment={handleViewExperiment}
          />
        </div>

        <OnboardingTour />
      </div>
    </SidebarProvider>
  );
};

export default Index;
