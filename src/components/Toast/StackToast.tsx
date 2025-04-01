import { useEffect, useState } from 'react';
import './StackToast.css';

interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
}

interface ToastManagerProps {
  messages: ToastMessage[];
  position?: 'top' | 'bottom';
  onRemove: (id: string) => void;
}

export const StackToast: React.FC<ToastManagerProps> = ({
  messages,
  position = 'top',
  onRemove,
}) => {
  return (
    <div className={`stack-toast-container ${position}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`stack-toast-item ${msg.type || 'success'}`}
          onClick={() => onRemove(msg.id)}
        >
          <p>{msg.message}</p>
        </div>
      ))}
    </div>
  );
};

export const useStackToast = (duration: number = 3000) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, message, type }]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setMessages((prev) => prev.slice(1));
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [messages, duration]);

  return {
    messages,
    addMessage,
    removeMessage,
  };
};