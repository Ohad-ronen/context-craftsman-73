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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDroppable } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, ArrowLeft, FolderOpen, FolderMinus, Search, Star, Filter, X, Tags, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/TagBadge';
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
  availableTags?: Tag[];
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

function UnfiledDropZoneButton({ isActive }: { isActive: boolean }) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unfiled-zone',
    data: { type: 'unfiled' },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200",
        isActive ? "border-dashed border-muted-foreground/50 bg-muted/30" : "border-transparent",
        isOver && "border-primary bg-primary/10 scale-105"
      )}
    >
      <FolderMinus className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {isActive ? "Drop here to unfile" : ""}
      </span>
    </div>
  );
}

export function FolderView({ experiments, getTagsForExperiment, onViewExperiment, onNewExperiment, availableTags = [] }: FolderViewProps) {
  const { folders, createFolder, updateFolder, deleteFolder, moveExperimentToFolder } = useFolders();
  const { toast } = useToast();
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const currentFolder = folders.find(f => f.id === currentFolderId);
  
  // Type assertion for folder_id since it's a new column
  const experimentsWithFolder = experiments as (Experiment & { folder_id?: string | null })[];
  
  // Get unique values for filters
  const uniqueGoals = useMemo(() => {
    const goals = new Set<string>();
    experiments.forEach(exp => {
      if (exp.goal && exp.goal.trim()) {
        const truncated = exp.goal.length > 50 ? exp.goal.substring(0, 50) + '...' : exp.goal;
        goals.add(truncated);
      }
    });
    return Array.from(goals).sort();
  }, [experiments]);

  const uniqueBoards = useMemo(() => {
    const boards = new Set<string>();
    experiments.forEach(exp => {
      if (exp.board_name && exp.board_name.trim()) {
        boards.add(exp.board_name);
      }
    });
    return Array.from(boards).sort();
  }, [experiments]);

  const goalMap = useMemo(() => {
    const map = new Map<string, string>();
    experiments.forEach(exp => {
      if (exp.goal && exp.goal.trim()) {
        const truncated = exp.goal.length > 50 ? exp.goal.substring(0, 50) + '...' : exp.goal;
        map.set(truncated, exp.goal);
      }
    });
    return map;
  }, [experiments]);

  // Filter experiments
  const filteredExperiments = useMemo(() => {
    let result = [...experimentsWithFolder];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(exp => 
        exp.name.toLowerCase().includes(query) ||
        exp.goal.toLowerCase().includes(query) ||
        exp.mission.toLowerCase().includes(query) ||
        exp.output.toLowerCase().includes(query) ||
        exp.board_name.toLowerCase().includes(query)
      );
    }

    if (ratingFilter !== 'all') {
      if (ratingFilter === 'unrated') {
        result = result.filter(exp => !exp.rating);
      } else {
        const rating = parseInt(ratingFilter);
        result = result.filter(exp => exp.rating === rating);
      }
    }

    if (goalFilter !== 'all') {
      const fullGoal = goalMap.get(goalFilter) || goalFilter;
      result = result.filter(exp => exp.goal === fullGoal);
    }

    if (boardFilter !== 'all') {
      result = result.filter(exp => exp.board_name === boardFilter);
    }

    if (selectedTagIds.length > 0) {
      result = result.filter(exp => {
        const expTags = getTagsForExperiment(exp.id);
        return selectedTagIds.some(tagId => expTags.some(t => t.id === tagId));
      });
    }

    return result;
  }, [experimentsWithFolder, searchQuery, ratingFilter, goalFilter, boardFilter, selectedTagIds, goalMap, getTagsForExperiment]);

  const unfiledExperiments = useMemo(() => 
    filteredExperiments.filter(exp => !exp.folder_id),
    [filteredExperiments]
  );

  const folderExperiments = useMemo(() => {
    if (!currentFolderId) return [];
    return filteredExperiments.filter(exp => exp.folder_id === currentFolderId);
  }, [filteredExperiments, currentFolderId]);

  const getExperimentCountForFolder = (folderId: string) => 
    filteredExperiments.filter(exp => exp.folder_id === folderId).length;

  const activeExperiment = activeExperimentId 
    ? experiments.find(e => e.id === activeExperimentId) 
    : null;

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setGoalFilter('all');
    setBoardFilter('all');
    setSelectedTagIds([]);
  };

  const hasActiveFilters = searchQuery || ratingFilter !== 'all' || goalFilter !== 'all' || boardFilter !== 'all' || selectedTagIds.length > 0;
  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));

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
          <div className="flex items-center justify-between">
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
            
            {/* Unfiled drop zone - visible when dragging */}
            <UnfiledDropZoneButton isActive={!!activeExperimentId} />
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
      <div className="space-y-6">
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search experiments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[130px]">
                <Star className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="unrated">Unrated</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {uniqueGoals.length > 0 && (
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {uniqueGoals.map(goal => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {uniqueBoards.length > 0 && (
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger className="w-[160px]">
                  <Layout className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boards</SelectItem>
                  {uniqueBoards.map(board => (
                    <SelectItem key={board} value={board}>
                      {board.length > 20 ? board.substring(0, 20) + '...' : board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {availableTags.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="default" className="gap-2">
                    <Tags className="w-4 h-4" />
                    Tags
                    {selectedTagIds.length > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                        {selectedTagIds.length}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 bg-popover border-border" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Filter by Tags</p>
                      {selectedTagIds.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedTagIds([])}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableTags.map(tag => {
                        const isSelected = selectedTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleToggleTag(tag.id)}
                            className={cn(
                              "transition-all",
                              isSelected ? "scale-105" : "opacity-60 hover:opacity-100"
                            )}
                          >
                            <TagBadge 
                              name={tag.name} 
                              color={tag.color}
                              className={isSelected ? "ring-2 ring-primary" : ""}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground">
                <X className="w-4 h-4" />
                Clear filters
              </Button>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
              {filteredExperiments.length} of {experiments.length} experiments
            </span>
          </div>

          {/* Active Tag Filters */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs text-muted-foreground">Filtered by tags:</span>
              {selectedTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  onRemove={() => handleToggleTag(tag.id)}
                />
              ))}
            </div>
          )}
        </div>

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
