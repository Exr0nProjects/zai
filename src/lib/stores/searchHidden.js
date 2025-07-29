import { writable } from 'svelte/store';

// Search-specific hidden blocks (temporary UI state)
export const searchHiddenBlocks = writable(new Set());

// Editor reference for forcing decoration updates
let editorRef = null;
export function setEditorRef(editor) {
  editorRef = editor;
}

// Force editor to update decorations
function forceEditorUpdate() {
  if (editorRef && editorRef.view) {
    // Force a view update by dispatching an empty transaction
    editorRef.view.dispatch(editorRef.state.tr.setMeta('forceUpdate', true));
  }
}

// Helper function to check if a block should be hidden
export function isBlockHidden(blockId, searchStore) {
  return searchStore.has(blockId);
}

// Clear all search hiding (when search is cleared)
export function clearSearchHiding() {
  searchHiddenBlocks.set(new Set());
  forceEditorUpdate();
}

// Hide a block during search
export function hideBlockInSearch(blockId) {
  searchHiddenBlocks.update(set => {
    const newSet = new Set(set);
    newSet.add(blockId);
    return newSet;
  });
  forceEditorUpdate();
}

// Show a block during search  
export function showBlockInSearch(blockId) {
  searchHiddenBlocks.update(set => {
    const newSet = new Set(set);
    newSet.delete(blockId);
    return newSet;
  });
  forceEditorUpdate();
} 

// Debug functions for console
export function debugSearchStore() {
  const hiddenSet = get(searchHiddenBlocks);
  console.log('🔍 Search Hidden Store State:');
  console.log('  Hidden blocks count:', hiddenSet.size);
  console.log('  Hidden block IDs:', Array.from(hiddenSet));
  return { size: hiddenSet.size, ids: Array.from(hiddenSet) };
}

export function debugEditorRef() {
  console.log('📝 Editor Reference:');
  console.log('  Editor exists:', !!editorRef);
  console.log('  Editor view exists:', !!(editorRef && editorRef.view));
  console.log('  Editor state exists:', !!(editorRef && editorRef.state));
  return editorRef;
} 