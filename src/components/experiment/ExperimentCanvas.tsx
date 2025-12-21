import { ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExperimentCanvasProps {
  leftColumnIds: string[];
  rightColumnIds: string[];
  renderSection: (id: string, column: 'left' | 'right') => ReactNode;
  onMoveSection: (sectionId: string, newColumn: 'left' | 'right', newOrder: number) => void;
  onReorderWithinColumn: (sectionId: string, newOrder: number) => void;
}

export function ExperimentCanvas({
  leftColumnIds,
  rightColumnIds,
  renderSection,
  onMoveSection,
  onReorderWithinColumn,
}: ExperimentCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<'left' | 'right' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setActiveColumn(leftColumnIds.includes(id) ? 'left' : 'right');
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine which column the item is being dragged over
    const isOverLeftColumn = leftColumnIds.includes(overId) || overId === 'left-drop-zone';
    const isOverRightColumn = rightColumnIds.includes(overId) || overId === 'right-drop-zone';

    if (isOverLeftColumn && activeColumn !== 'left') {
      setActiveColumn('left');
    } else if (isOverRightColumn && activeColumn !== 'right') {
      setActiveColumn('right');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeInLeft = leftColumnIds.includes(activeId);
    const activeInRight = rightColumnIds.includes(activeId);
    const overInLeft = leftColumnIds.includes(overId) || overId === 'left-drop-zone';
    const overInRight = rightColumnIds.includes(overId) || overId === 'right-drop-zone';

    // Moving between columns
    if ((activeInLeft && overInRight) || (activeInRight && overInLeft)) {
      const targetColumn = overInLeft ? 'left' : 'right';
      const targetIds = overInLeft ? leftColumnIds : rightColumnIds;
      const overIndex = overId.includes('drop-zone') ? targetIds.length : targetIds.indexOf(overId);
      onMoveSection(activeId, targetColumn, Math.max(0, overIndex));
    } 
    // Reordering within the same column
    else if (activeId !== overId) {
      const currentIds = activeInLeft ? leftColumnIds : rightColumnIds;
      const newIndex = currentIds.indexOf(overId);
      if (newIndex !== -1) {
        onReorderWithinColumn(activeId, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div
          className={cn(
            "space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin",
            activeColumn === 'left' && activeId && !leftColumnIds.includes(activeId) && "ring-2 ring-primary/30 ring-offset-2 rounded-lg"
          )}
        >
          <SortableContext items={leftColumnIds} strategy={verticalListSortingStrategy}>
            {leftColumnIds.map(id => renderSection(id, 'left'))}
          </SortableContext>
          {/* Drop zone for empty or end of column */}
          <div
            id="left-drop-zone"
            className={cn(
              "h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm transition-colors",
              activeId && !leftColumnIds.includes(activeId) && "border-primary/50 bg-primary/5"
            )}
          >
            {leftColumnIds.length === 0 ? "Drop sections here" : "Drop to add at end"}
          </div>
        </div>

        {/* Right Column */}
        <div
          className={cn(
            "space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 scrollbar-thin",
            activeColumn === 'right' && activeId && !rightColumnIds.includes(activeId) && "ring-2 ring-primary/30 ring-offset-2 rounded-lg"
          )}
        >
          <SortableContext items={rightColumnIds} strategy={verticalListSortingStrategy}>
            {rightColumnIds.map(id => renderSection(id, 'right'))}
          </SortableContext>
          {/* Drop zone for empty or end of column */}
          <div
            id="right-drop-zone"
            className={cn(
              "h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm transition-colors",
              activeId && !rightColumnIds.includes(activeId) && "border-primary/50 bg-primary/5"
            )}
          >
            {rightColumnIds.length === 0 ? "Drop sections here" : "Drop to add at end"}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-80 shadow-xl">
            {renderSection(activeId, activeColumn || 'left')}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
