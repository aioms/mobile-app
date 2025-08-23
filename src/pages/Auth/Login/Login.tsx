import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonCheckbox,
  IonInputPasswordToggle,
  useIonViewDidEnter,
  useIonToast,
} from "@ionic/react";
import * as Sentry from "@sentry/capacitor";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../../hooks";
import { defaultConfig } from "@/helpers/axios";

import "./Login.css";

const Login: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      // const {
      //   VITE_ENV,
      //   VITE_API_VERSION,

      //   VITE_API_URL_DEV,
      //   VITE_SERVER_URL_DEV,

      //   VITE_API_URL_STG,
      //   VITE_SERVER_URL_STG,

      //   VITE_API_URL_PROD,
      //   VITE_SERVER_URL_PROD,
      // } = import.meta.env;

      // Sentry.captureMessage(JSON.stringify(defaultConfig), {
      //   extra: {
      //     environment: VITE_ENV,
      //     apiVersion: VITE_API_VERSION,
      //     apiUrl: VITE_API_URL_DEV,
      //     serverUrl: VITE_SERVER_URL_DEV,
      //     apiUrlStg: VITE_API_URL_STG,
      //     serverUrlStg: VITE_SERVER_URL_STG,
      //     apiUrlProd: VITE_API_URL_PROD,
      //     serverUrlProd: VITE_SERVER_URL_PROD,
      //   },
      // });

      const { username, password } = formData;

      if (!username || !password) {
        return setError("Vui lòng nhập đầy đủ thông tin");
      }

      const response = await login(username, password);

      if (response.statusCode !== 200 || !response.data) {
        await presentToast({
          message: response.message,
          duration: 1000,
          position: "top",
          color: "danger",
        });
        return;
      }

      await presentToast({
        message: "Đăng nhập thành công",
        duration: 1000,
        position: "top",
        color: "success",
      });

      setFormData({ username: "", password: "" });

      setTimeout(() => {
        history.replace("/tabs/home");
      }, 500);
    } catch (error: any) {
      presentToast({
        message: error.message,
        duration: 1000,
        position: "top",
        color: "danger",
      });
    }
  };

  useIonViewDidEnter(() => {
    if (isAuthenticated) {
      history.replace("/tabs/home");
    }
  }, [isAuthenticated]);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Welcome back</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Đăng nhập
        </h1>
        <IonGrid>
          {error && (
            <IonRow>
              <IonCol>
                <IonText color="danger">{error}</IonText>
              </IonCol>
            </IonRow>
          )}
          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput
                  type="text"
                  fill="solid"
                  label="Tên đăng nhập"
                  labelPlacement="stacked"
                  errorText="Tên đăng nhập không hợp lệ"
                  debounce={500}
                  onIonInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value as string,
                    }))
                  }
                />
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput
                  type="password"
                  fill="solid"
                  label={"Mật khẩu"}
                  labelPlacement="stacked"
                  errorText="Mật khẩu không đúng"
                  clearInput
                  debounce={400}
                  onIonInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value as string,
                    }))
                  }
                >
                  <IonInputPasswordToggle slot="end" color="dark" />
                </IonInput>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonCheckbox labelPlacement="end">Ghi nhớ đăng nhập</IonCheckbox>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton expand="block" onClick={handleLogin}>
                Đăng nhập
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
