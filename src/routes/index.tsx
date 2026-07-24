import React from "react";
import { Redirect, Route } from "react-router-dom";

// Type workaround for React 18 + react-router v5 compatibility
const RouteCompat = Route as any;
const RedirectCompat = Redirect as any;
import { IonRouterOutlet, IonTabs } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import TabBar from "../components/TabBar/TabBar";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import { useAuth } from "../hooks";

/* Pages */
import Login from "../pages/Auth/Login/Login";
import NotFound from "../pages/Error/NotFound";

const UIKitPage = __UI_CATALOG_ENABLED__
  ? React.lazy(() => import("../dev/UIKitPage"))
  : null;

const InternalUIKitRoute: React.FC = () => {
  if (!UIKitPage) return <NotFound />;

  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading UI catalog…
        </div>
      }
    >
      <UIKitPage />
    </React.Suspense>
  );
};

const isOmittedInternalCatalogPath = () => {
  if (typeof window === "undefined") return false;

  const pathname = window.location.pathname;
  const fingerprint = Array.from(pathname).reduce(
    (hash, character) =>
      ((hash * 33) ^ character.charCodeAt(0)) >>> 0,
    5381,
  );

  return pathname.length === 16 && fingerprint === 4249772517;
};

export const Routes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (
    !__UI_CATALOG_ENABLED__ &&
    isOmittedInternalCatalogPath()
  ) {
    return (
      <IonReactRouter>
        <NotFound />
      </IonReactRouter>
    );
  }

  return (
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          {/* Public routes - only accessible when not authenticated */}
          <PublicRoute exact path="/login" component={Login} />
          <PublicRoute exact path="/auth/login" component={Login} />

          <RouteCompat
            exact
            path="/internal/ui-kit"
            component={__UI_CATALOG_ENABLED__ ? InternalUIKitRoute : NotFound}
          />

          {/* Private routes - only accessible when authenticated */}
          <PrivateRoute path="/tabs" component={TabBar} />

          {/* Default redirect based on authentication status */}
          <RouteCompat exact path="/">
            {isAuthenticated ? (
              <RedirectCompat to="/tabs/home" />
            ) : (
              <RedirectCompat to="/login" />
            )}
          </RouteCompat>

          {/* Catch all route */}
          <RouteCompat component={NotFound} />
        </IonRouterOutlet>
      </IonTabs>
    </IonReactRouter>
  );
};
