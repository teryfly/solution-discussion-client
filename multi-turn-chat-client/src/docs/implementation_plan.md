- Step 1: Update DocumentReferenceModal UI controls and state
  Purpose: Add new controls for "Only show latest version", "search input", and "selected count" display; wire them to state.
  Expected Output: Modified DocumentReferenceModal.tsx with new UI elements and props wiring to hook state.

- Step 2: Extend useDocumentReference data layer with filtering logic
  Purpose: Add state for latestOnly and searchQuery; implement filtering: (a) fuzzy match on filename/content, AND (b) latest version reduction by filename -> highest id; recalc isAllSelectedInTab.
  Expected Output: Updated useDocumentReference.ts to export filtering state and derived filteredDocuments respecting both filters.

- Step 3: Update LayoutParts TabsBar to render new controls and selected count
  Purpose: Insert a checkbox "仅显示最新版本", a search input for fuzzy filtering, and a selected count indicator before "本页全选/不选" button.
  Expected Output: Updated LayoutParts.tsx to accept new props and render controls; ensure styles compact.

- Step 4: Integrate props across components
  Purpose: Pass latestOnly, setLatestOnly, searchQuery, setSearchQuery, selectedCount from modal to layout parts and DocList; DocList unchanged as it uses filteredDocuments; ensure count shows selected items in current filtered set.
  Expected Output: Updated DocumentReferenceModal.tsx prop passing and minor glue; no API changes.