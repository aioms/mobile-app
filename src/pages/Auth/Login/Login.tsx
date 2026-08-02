import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonCheckbox,
  IonInputPasswordToggle,
  useIonToast,
  IonSpinner,
} from "@ionic/react";
import { useAuth } from "../../../hooks";

import "./Login.css";

const Login: React.FC = () => {
  const [presentToast] = useIonToast();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      const { username, password } = formData;

      if (!username || !password) {
        return setError("Vui lòng nhập đầy đủ thông tin");
      }
      
      setError("");
      setIsSubmitting(true);

      const response = await login(username, password);

      if (response && (response.statusCode !== 200 || !response.data)) {
        setIsSubmitting(false);
        await presentToast({
          message: response.message || "Đăng nhập thất bại",
          duration: 2000,
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
    } catch (error: any) {
      setIsSubmitting(false);
      setError(error.message || "Có lỗi xảy ra trong quá trình đăng nhập");
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="flex flex-col min-h-screen bg-white">
          {/* Top Header Section */}
          <div className="relative flex flex-col justify-center px-6 pt-16 pb-24 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 shrink-0 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white opacity-10 blur-3xl"></div>
              <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full bg-teal-300 opacity-20 blur-2xl"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-emerald-200 opacity-20 blur-xl"></div>
            </div>
            
            <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
              <div className="h-20 w-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/20 transform -rotate-3 transition-transform duration-300 hover:rotate-0">
                <span className="text-white text-4xl font-extrabold rotate-3">A</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                AIOM System
              </h2>
              <p className="mt-2 text-center text-teal-50 font-medium text-sm tracking-wide">
                Hệ thống quản lý thông minh
              </p>
            </div>
          </div>

          {/* Bottom Form Section */}
          <div className="flex-1 bg-white rounded-t-[32px] -mt-10 px-6 pt-10 pb-8 shadow-[0_-12px_30px_-15px_rgba(0,0,0,0.3)] sm:mx-auto sm:w-full sm:max-w-md relative z-20 flex flex-col">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Đăng nhập</h3>
              <p className="text-sm text-gray-500 mt-1">Vui lòng điền thông tin để tiếp tục</p>
            </div>

            <form className="space-y-6 flex-1 flex flex-col" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-fade-in shrink-0">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-5 shrink-0">
                <IonInput
                  type="text"
                  fill="outline"
                  label="Tên đăng nhập"
                  labelPlacement="floating"
                  className="custom-input"
                  value={formData.username}
                  onIonInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value as string,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />

                <IonInput
                  type="password"
                  fill="outline"
                  label="Mật khẩu"
                  labelPlacement="floating"
                  className="custom-input"
                  value={formData.password}
                  onIonInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value as string,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                >
                  <IonInputPasswordToggle slot="end" color="medium" />
                </IonInput>
              </div>

              <div className="pt-1 shrink-0">
                <IonCheckbox 
                  className="custom-checkbox text-sm font-medium text-gray-700" 
                  labelPlacement="end"
                  justify="start"
                >
                  Ghi nhớ tôi
                </IonCheckbox>
              </div>

              <div className="pt-4 shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full flex justify-center items-center h-[52px] px-4 border border-transparent rounded-2xl shadow-lg shadow-teal-500/30 text-[16px] font-bold text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 overflow-hidden group"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                  
                  {isSubmitting ? (
                    <IonSpinner name="crescent" className="h-6 w-6 text-white" />
                  ) : (
                    "Đăng nhập ngay"
                  )}
                </button>
              </div>
              
              <div className="mt-auto pt-8 pb-4 text-center text-xs font-medium text-gray-400">
                &copy; {new Date().getFullYear()} AIOM System v1.0
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
