# Project Rules

## 1. API Handling with `useLoading`

* **Always** use `withLoading` from the `useLoading` hook when handling API calls.
* This ensures consistent loading state management and avoids duplicate implementations.
* Example:

```typescript
withLoading(async () => {
  try {
      await apiCall()
  } catch (error) {
      await Toast.show({
         text: (error as Error).message,
         duration: "short",
         position: "top",
      });
   }
});
```

---

## 2. Type & Interface Definitions

* Create a separate `*.d.ts` file for **all** interface and type definitions.
* **Do not** write types or interfaces in the same file as the component.
* Example file structure:

```
src/
  components/
    MyComponent.tsx
  types/
    myComponent.d.ts
```

---

## 3. Component Structure

* **Separate child components** into their own files when necessary.
* Avoid creating one excessively long component file.
* Criteria for separation:

  * The child component has independent logic.
  * The JSX block is large and complex.
  * The child component can be reused.

---

## 4. Toast Notifications

* Use the `useIonToast` hook **instead of** the `Toast` from Capacitor.
* This ensures UI consistency with Ionic's component styling.
* Example:

```typescript
const [presentToast] = useIonToast();

presentToast({
  message: 'Operation successful!',
  duration: 2000,
  position: 'top'
});
```

## 4. Package Manager

* Use `yarn` as the package manager for the project.
* **Do not** use `npm` or `pnpm` for package management.
