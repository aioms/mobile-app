import React, { useCallback, useRef } from "react";
import { IonContent, IonPage } from "@ionic/react";

import { AppText } from "@/design-system";

import { UIKitSections } from "./UIKitSections";

const UIKitPage: React.FC = () => {
  const contentRef = useRef<HTMLIonContentElement>(null);
  const getPrimaryScrollElement = useCallback(async () => {
    return contentRef.current?.getScrollElement() ?? null;
  }, []);

  return (
    <IonPage data-testid="ui-kit-page">
      <IonContent ref={contentRef} fullscreen>
        <main className="ds-root min-h-full bg-ds-background-page px-ds-page-x py-ds-page-y text-ds-text-primary">
          <div className="mx-auto max-w-ds-content space-y-ds-6">
            <header className="space-y-ds-2">
              <AppText as="h1" variant="display">
                AIOM Design System
              </AppText>
              <AppText as="p" tone="secondary">
                Internal catalog. Foundation only; no production screen
                migration.
              </AppText>
            </header>
            <UIKitSections
              getPrimaryScrollElement={getPrimaryScrollElement}
            />
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
};

export default UIKitPage;
