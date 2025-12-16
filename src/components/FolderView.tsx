import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { Folder, useFolders } from '@/hooks/useFolders';
import { FolderCard } from '@/components/FolderCard';
import { DraggableExperimentCard } from '@/components/DraggableExperimentCard';
import { ExperimentCard } from '@/components/ExperimentCard';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, ArrowLeft, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface FolderViewProps {
  experiments: Experiment[];
  getTagsForExperiment: (experimentId: string) => Tag[];
  onViewExperiment: (id: string) => void;
  onNewExperiment: () => void;
}

function UnfiledDropZone({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unfiled-zone',
    data: { type: 'unfiled' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg transition-all duration-200",
        isActive && "border-2 border-dashed border-muted-foreground/30 p-4",
        isOver && "border-primary bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}

export function FolderView({ experiments, getTagsForExperiment, onViewExperiment, onNewExperiment }: FolderViewProps) {
  const { folders, createFolder, updateFolder, deleteFolder, moveExperimentToFolder } = useFolders();
  const { toast } = useToast();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);

  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  // Type assertion for folder_id since it's a new column
  const experimentsWithFolder = experiments as (Experiment & { folder_id?: string | null })[];
  
  const unfiledExperiments = useMemo(() => 
    experimentsWithFolder.filter(exp => !exp.folder_id),
    [experimentsWithFolder]
  );

  const folderExperiments = useMemo(() => {
    if (!currentFolderId) return [];
    return experimentsWithFolder.filter(exp => exp.folder_id === currentFolderId);
  }, [experimentsWithFolder, currentFolderId]);

  const getExperimentCountForFolder = (folderId: string) => 
    experimentsWithFolder.filter(exp => exp.folder_id === folderId).length;

  const activeExperiment = activeExperimentId 
    ? experiments.find(e => e.id === activeExperimentId) 
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'experiment') {
      setActiveExperimentId(active.data.current.experimentId);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveExperimentId(null);
    const { active, over } = event;

    if (!over || active.data.current?.type !== 'experiment') return;

    const experimentId = active.data.current.experimentId;
    const overData = over.data.current;

    let targetFolderId: string | null = null;

    if (overData?.type === 'folder') {
      targetFolderId = overData.folderId;
    } else if (over.id === 'unfiled-zone') {
      targetFolderId = null;
    } else {
      return;
    }

    const experiment = experimentsWithFolder.find(e => e.id === experimentId);
    if (experiment?.folder_id === targetFolderId) return;

    const success = await moveExperimentToFolder(experimentId, targetFolderId);
    if (success) {
      const folderName = targetFolderId 
        ? folders.find(f => f.id === targetFolderId)?.name 
        : 'Unfiled';
      toast({
        title: 'Experiment moved',
        description: `Moved to ${folderName}`,
      });
    }
  };

  const handleCreateFolder = async (name: string, color: string) => {
    const folder = await createFolder(name, color);
    if (folder) {
      toast({
        title: 'Folder created',
        description: `"${name}" has been created.`,
      });
    }
  };

  const handleEditFolder = async (name: string, color: string) => {
    if (!editingFolder) return;
    const success = await updateFolder(editingFolder.id, { name, color });
    if (success) {
      toast({
        title: 'Folder updated',
        description: `Renamed to "${name}".`,
      });
    }
    setEditingFolder(null);
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    const success = await deleteFolder(deletingFolder.id);
    if (success) {
      toast({
        title: 'Folder deleted',
        description: 'Experiments have been moved to Unfiled.',
      });
      if (currentFolderId === deletingFolder.id) {
        setCurrentFolderId(null);
      }
    }
    setDeletingFolder(null);
  };

  // Show folder contents when inside a folder
  if (currentFolder) {
    return (
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Folders
            </Button>
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded"
                style={{ backgroundColor: `${currentFolder.color}20` }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: currentFolder.color }} />
              </div>
              <h2 className="text-xl font-semibold">{currentFolder.name}</h2>
              <span className="text-muted-foreground">
                ({folderExperiments.length} experiment{folderExperiments.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {folderExperiments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>This folder is empty</p>
              <p className="text-sm">Drag experiments here to organize them</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {folderExperiments.map((experiment, index) => (
                <div key={experiment.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <DraggableExperimentCard
                    experiment={experiment}
                    tags={getTagsForExperiment(experiment.id)}
                    onClick={() => onViewExperiment(experiment.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeExperiment && (
            <div className="opacity-90 rotate-3 scale-105">
              <ExperimentCard
                experiment={activeExperiment}
                tags={getTagsForExperiment(activeExperiment.id)}
                onClick={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  // Main folder view
  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-8">
        {/* Folders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Folders</h2>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
          
          {folders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No folders yet</p>
              <p className="text-sm">Create folders to organize your experiments</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  experimentCount={getExperimentCountForFolder(folder.id)}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onEdit={() => setEditingFolder(folder)}
                  onDelete={() => setDeletingFolder(folder)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Unfiled Experiments Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Unfiled Experiments
            <span className="text-muted-foreground font-normal ml-2">
              ({unfiledExperiments.length})
            </span>
          </h2>
          
          <UnfiledDropZone isActive={!!activeExperimentId}>
            {experiments.length === 0 ? (
              <EmptyState onNewExperiment={onNewExperiment} />
            ) : unfiledExperiments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>All experiments are organized in folders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {unfiledExperiments.map((experiment, index) => (
                  <div key={experiment.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <DraggableExperimentCard
                      experiment={experiment}
                      tags={getTagsForExperiment(experiment.id)}
                      onClick={() => onViewExperiment(experiment.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </UnfiledDropZone>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeExperiment && (
          <div className="opacity-90 rotate-3 scale-105">
            <ExperimentCard
              experiment={activeExperiment}
              tags={getTagsForExperiment(activeExperiment.id)}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateFolder}
      />

      {/* Edit Folder Dialog */}
      <CreateFolderDialog
        open={!!editingFolder}
        onOpenChange={(open) => !open && setEditingFolder(null)}
        onSubmit={handleEditFolder}
        initialName={editingFolder?.name}
        initialColor={editingFolder?.color}
        isEditing
      />

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deletingFolder} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingFolder?.name}"? 
              Experiments in this folder will be moved to Unfiled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
