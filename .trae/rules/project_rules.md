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


## 5. Use ionic react lifecycle when possible

Guidance for Each LifeCycle Method
Below are some tips on use cases for each of the life cycle events.

ionViewWillEnter - Since ionViewWillEnter is called every time the view is navigated to (regardless if initialized or not), it's a good method to load data from services.
ionViewDidEnter - If you see performance problems from using ionViewWillEnter when loading data, you can do your data calls in ionViewDidEnter instead. This event won't fire until after the page is visible to the user, however, so you might want to use either a loading indicator or a skeleton screen, so content doesn't flash in un-naturally after the transition is complete.
ionViewWillLeave - Can be used for cleanup, like unsubscribing from data sources. Since componentWillUnmount might not fire when you navigate from the current page, put your cleanup code here if you don't want it active while the screen is not in view.
ionViewDidLeave - When this event fires, you know the new page has fully transitioned in, so any logic you might not normally do when the view is visible can go here.