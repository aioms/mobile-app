import React, { useState } from "react";
import { IonPage, useIonToast } from "@ionic/react";
import { Block, List, ListItem, Checkbox } from "konsta/react";
import { useAuth } from "../../../hooks";
import { AppTextField } from "@/design-system/components/AppTextField/AppTextField";
import { AppButton } from "@/design-system/primitives/AppButton/AppButton";
import { AppText } from "@/design-system/primitives/AppText/AppText";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";

const Login: React.FC = () => {
  const [presentToast] = useIonToast();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const { username, password } = formData;

      if (!username || !password) {
        return setError("Vui lòng nhập đầy đủ thông tin");
      }
      
      setError("");
      setIsLoading(true);

      const response = await login(username, password);

      if (response.statusCode !== 200 || !response.data) {
        await presentToast({
          message: response.message,
          duration: 1000,
          position: "top",
          color: "danger",
        });
        setIsLoading(false);
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
      presentToast({
        message: error.message,
        duration: 1000,
        position: "top",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <div className="ds-root flex h-screen w-full flex-col bg-ds-surface-default">
        <header className="flex h-14 shrink-0 items-center justify-center border-b border-ds-border-default bg-ds-surface-default">
          <AppText as="h1" variant="heading" className="font-semibold text-ds-text-primary">
            Welcome back
          </AppText>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-md pt-6 pb-6 px-5">
            <AppText as="h2" variant="title" className="mb-6 text-center font-bold text-ds-text-primary">
              Đăng nhập
            </AppText>
            
            {error && (
              <div className="text-center text-red-500 mb-4">
                {error}
              </div>
            )}
            
            <List margin="m-0" className="!bg-transparent mb-5 !p-0">
              <div className="flex flex-col gap-5">
                <AppTextField
                  label="Tên đăng nhập"
                  size="lg"
                  value={formData.username}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, username: val }))}
                  placeholder="Nhập tên đăng nhập"
                  state={error ? "error" : "default"}
                />
                
                <AppTextField
                  label="Mật khẩu"
                  size="lg"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, password: val }))}
                  placeholder="Nhập mật khẩu"
                  state={error ? "error" : "default"}
                  trailingAction={
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-ds-text-secondary hover:text-ds-text-primary focus:outline-none"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>
            </List>
            
            <label className="flex items-center gap-3 mb-8 cursor-pointer pl-1">
              <Checkbox
                checked={rememberMe}
                onChange={(e: any) => setRememberMe(e.target.checked)}
              />
              <AppText as="span" variant="body" className="text-ds-text-primary select-none">
                Ghi nhớ đăng nhập
              </AppText>
            </label>
            
            <AppButton 
              fullWidth 
              size="lg" 
              onClick={handleLogin}
              loading={isLoading}
            >
              ĐĂNG NHẬP
            </AppButton>
          </div>
        </main>
      </div>
    </IonPage>
  );
};

export default Login;
