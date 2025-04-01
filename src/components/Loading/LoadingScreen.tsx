import { IonSpinner } from "@ionic/react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Đang tải dữ liệu...",
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
      <div className="flex flex-col items-center space-y-4">
        <IonSpinner name="crescent" className="w-10 h-10 text-primary" />
        <p className="text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
