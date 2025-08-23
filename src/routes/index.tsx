import React from "react";
import { Redirect, Route } from "react-router-dom";
import { IonRouterOutlet, IonTabs } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import TabBar from "../components/TabBar/TabBar";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import { useAuth } from "../hooks";

/* Pages */
import Login from "../pages/Auth/Login/Login";
import NotFound from "../pages/Error/NotFound";

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

  return (
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          {/* Public routes - only accessible when not authenticated */}
          <PublicRoute exact path="/login" component={Login} />
          <PublicRoute exact path="/auth/login" component={Login} />

          {/* Private routes - only accessible when authenticated */}
          <PrivateRoute path="/tabs" component={TabBar} />

          {/* Default redirect based on authentication status */}
          <Route exact path="/">
            {isAuthenticated ? (
              <Redirect to="/tabs/home" />
            ) : (
              <Redirect to="/login" />
            )}
          </Route>

          {/* Catch all route */}
          <Route component={NotFound} />
        </IonRouterOutlet>
      </IonTabs>
    </IonReactRouter>
  );
};
