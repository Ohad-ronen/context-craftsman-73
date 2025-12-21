import { useState, useEffect, useCallback } from 'react';

export interface LayoutSection {
  id: string;
  label: string;
  column: 'left' | 'right';
  order: number;
  visible: boolean;
}

export interface ExperimentLayout {
  sections: LayoutSection[];
}

const DEFAULT_SECTIONS: LayoutSection[] = [
  // Left column
  { id: 'tags', label: 'Tags', column: 'left', order: 0, visible: true },
  { id: 'request_id', label: 'Request ID', column: 'left', order: 1, visible: true },
  { id: 'annotations', label: 'Annotations', column: 'left', order: 2, visible: true },
  { id: 'goal', label: 'The Goal', column: 'left', order: 3, visible: true },
  { id: 'mission', label: 'The Mission', column: 'left', order: 4, visible: true },
  { id: 'example', label: 'The Example', column: 'left', order: 5, visible: true },
  { id: 'desired', label: 'Desired', column: 'left', order: 6, visible: true },
  // Right column
  { id: 'rules', label: 'Rules', column: 'right', order: 0, visible: true },
  { id: 'use_websearch', label: 'Web Search', column: 'right', order: 1, visible: true },
  { id: 'board_name', label: 'Board Name', column: 'right', order: 2, visible: true },
  { id: 'board_full_context', label: 'Board Full Context', column: 'right', order: 3, visible: true },
  { id: 'board_pulled_context', label: 'Board Pulled Context', column: 'right', order: 4, visible: true },
  { id: 'search_terms', label: 'Search Terms', column: 'right', order: 5, visible: true },
  { id: 'search_context', label: 'Search Context', column: 'right', order: 6, visible: true },
  { id: 'agentic_prompt', label: 'The Agentic Prompt', column: 'right', order: 7, visible: true },
  { id: 'output', label: 'The Output', column: 'right', order: 8, visible: true },
  { id: 'ai_evaluation', label: 'AI Evaluation', column: 'right', order: 9, visible: true },
  { id: 'notes', label: 'Evaluation Notes', column: 'right', order: 10, visible: true },
];

const STORAGE_KEY = 'experiment-layout';

export function useExperimentLayout() {
  const [sections, setSections] = useState<LayoutSection[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new sections
        const storedIds = new Set(parsed.map((s: LayoutSection) => s.id));
        const merged = [
          ...parsed,
          ...DEFAULT_SECTIONS.filter(d => !storedIds.has(d.id))
        ];
        return merged;
      } catch {
        return DEFAULT_SECTIONS;
      }
    }
    return DEFAULT_SECTIONS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const toggleSection = useCallback((sectionId: string) => {
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId ? { ...s, visible: !s.visible } : s
      )
    );
  }, []);

  const moveSection = useCallback((sectionId: string, newColumn: 'left' | 'right', newOrder: number) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId);
      if (!section) return prev;

      // Update the moved section
      const updated = prev.map(s => {
        if (s.id === sectionId) {
          return { ...s, column: newColumn, order: newOrder };
        }
        return s;
      });

      // Reorder sections in the target column
      const columnSections = updated
        .filter(s => s.column === newColumn && s.id !== sectionId)
        .sort((a, b) => a.order - b.order);

      // Insert at new position and reassign orders
      columnSections.splice(newOrder, 0, { ...section, column: newColumn, order: newOrder });
      
      return updated.map(s => {
        if (s.column === newColumn) {
          const idx = columnSections.findIndex(cs => cs.id === s.id);
          return { ...s, order: idx >= 0 ? idx : s.order };
        }
        return s;
      });
    });
  }, []);

  const reorderWithinColumn = useCallback((sectionId: string, newOrder: number) => {
    setSections(prev => {
      const section = prev.find(s => s.id === sectionId);
      if (!section) return prev;

      const columnSections = prev
        .filter(s => s.column === section.column)
        .sort((a, b) => a.order - b.order);

      const oldIndex = columnSections.findIndex(s => s.id === sectionId);
      if (oldIndex === -1) return prev;

      // Remove and reinsert
      columnSections.splice(oldIndex, 1);
      columnSections.splice(newOrder, 0, section);

      // Reassign orders
      const orderMap = new Map<string, number>();
      columnSections.forEach((s, idx) => orderMap.set(s.id, idx));

      return prev.map(s => ({
        ...s,
        order: orderMap.has(s.id) ? orderMap.get(s.id)! : s.order
      }));
    });
  }, []);

  const resetLayout = useCallback(() => {
    setSections(DEFAULT_SECTIONS);
  }, []);

  const getLeftColumnSections = useCallback(() => {
    return sections
      .filter(s => s.column === 'left' && s.visible)
      .sort((a, b) => a.order - b.order);
  }, [sections]);

  const getRightColumnSections = useCallback(() => {
    return sections
      .filter(s => s.column === 'right' && s.visible)
      .sort((a, b) => a.order - b.order);
  }, [sections]);

  const getHiddenSections = useCallback(() => {
    return sections.filter(s => !s.visible);
  }, [sections]);

  return {
    sections,
    toggleSection,
    moveSection,
    reorderWithinColumn,
    resetLayout,
    getLeftColumnSections,
    getRightColumnSections,
    getHiddenSections,
  };
}
