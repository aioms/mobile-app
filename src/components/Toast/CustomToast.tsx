import React, { useEffect, useState } from "react";
import { CustomToastProps } from "@/types/customToast";
import "./CustomToast.css";

const CustomToast: React.FC<CustomToastProps> = ({
  message,
  type,
  duration = 3000,
  position = "top",
  showIcon = true,
  dismissible = true,
  className = "",
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  const getIcon = () => {
    if (!showIcon) return null;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    return <span className="custom-toast-icon">{icons[type]}</span>;
  };

  return (
    <div
      className={`custom-toast custom-toast-${type} custom-toast-${position} ${
        isVisible ? "custom-toast-visible" : ""
      } ${isRemoving ? "custom-toast-removing" : ""} ${className}`}
      onClick={dismissible ? handleDismiss : undefined}
      style={{ cursor: dismissible ? "pointer" : "default" }}
    >
      <div className="custom-toast-content">
        {getIcon()}
        <span className="custom-toast-message">{message}</span>
        {dismissible && (
          <button
            className="custom-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            aria-label="Close toast"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomToast;
