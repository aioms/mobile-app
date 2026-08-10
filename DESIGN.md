# Design System: AIOM Mobile App
**Project:** AIOM System - Mobile App

This document serves as the source of truth for the UI/UX design language of the AIOM Mobile App. All AI agents must strictly follow these instructions when creating or refactoring screens, especially list and form pages, to ensure cross-screen consistency.

## 1. Visual Theme & Atmosphere
The application uses a clean, data-dense but breathable UI designed for operational efficiency in retail and inventory management. The aesthetic is utilitarian yet modern, prioritizing readability, clear hierarchy, and quick actions via floating action buttons (FABs) and integrated scanners.

## 2. Color Palette & Roles

*   **Primary Blue** (`bg-blue-600` / `#2563EB`): Used for primary actions, floating action buttons, active states, and emphasis text (like total inventory counts).
*   **Secondary/Muted** (`text-gray-500` / `#6B7280`): Used for secondary text, labels, placeholder text, and inactive icons.
*   **Destructive Red** (`text-red-500` / `#EF4444`): Used for negative values (like debt amounts), delete actions, and error states.
*   **Background - Lists** (`bg-gray-50` / `#F9FAFB`): The universal background color for screens that contain lists of cards. It provides a subtle contrast so the white cards pop.
*   **Background - Cards** (`bg-white` / `#FFFFFF`): The background color for surface-level elements like AppCards, Search Bars, and bottom sheets.
*   **Text Primary** (`text-gray-900` / `#111827`): Used for titles, primary values, and essential list item text.

## 3. Typography Rules
*   **Headers:** `font-bold` and `text-lg` or `text-xl`. Used for page titles and major statistical values (e.g., total count).
*   **Sub-headers:** `font-medium` and `text-md`. Used for section dividers and card titles.
*   **Body Text:** `text-sm` (often with `text-gray-900`). Used for standard data points.
*   **Labels/Hints:** `text-xs` (often with `text-gray-500`). Used for small labels like "Tổng số phiếu thu" or date formats.

## 4. Component Stylings & Usage

### 4.1 Layout Wrapper (The Gold Standard)
All list screens must use the following structural pattern to ensure consistent padding and avoid layout offsets:

```tsx
<IonPage>
  <IonHeader className="ion-no-border border-b border-gray-100">
    {/* Toolbar Content */}
  </IonHeader>

  {/* IMPORTANT: bg-gray-50 for list screens */}
  <IonContent className="bg-gray-50">
    <Refresher onRefresh={handleRefresh} />

    {/* 1. Summary Card (Margin Top & Bottom, Horizontal Padding) */}
    <AppCard className="mx-4 mt-4 mb-3">
      {/* Content */}
    </AppCard>

    {/* 2. Filter / Search Section (Horizontal Padding, Margin Bottom) */}
    <div className="mx-4 mb-3">
      <AppSearchBar />
    </div>

    {/* 3. List Content Wrapper (Horizontal Padding, Bottom Padding for FAB) */}
    <div className="px-4 pb-20">
      <ListItems />
      
      {/* Load More Button */}
      <div className="flex justify-center my-3">
        <AppButton variant="pill">Xem thêm</AppButton>
      </div>
    </div>
  </IonContent>

  {/* FAB (If applicable) */}
  <AppFAB />
</IonPage>
```

### 4.2 Layout Rules & Spacing (Crucial)
*   **Avoid negative margins:** DO NOT use `-mx-4`, `-mt-4`, etc., to counteract `ion-padding`. Instead, remove `className="ion-padding"` from `<IonContent>` and apply `px-4` and `mx-4` precisely where needed as shown above.
*   **Search/Filter Bar:** Always use the `<AppSearchBar>` component inside a `<div className="mx-4 mb-3">`. Do not build raw `<input>` wrappers for search unless absolutely necessary.
*   **Summary Cards:** Always use the `<AppCard>` component for top-level statistics. Standard margin is `mx-4 mt-4 mb-3` if it's the first element, or `mx-4 mb-3` if placed below something else.
*   **Load More Button:** Wrap the "Load More" (Xem thêm) button in `<div className="flex justify-center my-3">` and use `<AppButton variant="pill">`.
*   **End of List Padding:** The main content wrapper must have `pb-20` (padding-bottom: 5rem) if there is an `AppFAB` or a Bottom Tab Bar on the page, to ensure the last list item isn't obscured.

### 4.3 Specific Components
*   **AppSearchBar:** Always pass `searchText`, `setSearchText`, `placeholder`, and `onFilterClick`. For the barcode scanner action, pass it via the `extraAction` prop as an `IonButton`.
*   **AppCard:** Used for the summary blocks. Usually contains a grid with 2 columns `grid grid-cols-2 gap-4`, split by a border `border-l border-gray-100` on the second column.
*   **Lists:** Use raw `div` or `<IonList className="space-y-2 bg-transparent">`. Cards inside the list should be rounded (`rounded-xl` or `rounded-2xl`) with `shadow-sm border border-gray-100`.
