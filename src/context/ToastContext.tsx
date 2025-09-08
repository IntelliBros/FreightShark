import React, { useState, createContext, useContext } from 'react';
type ToastType = 'success' | 'error' | 'info' | 'warning';
type Toast = {
  id: string;
  message: string;
  type: ToastType;
};
type ToastContextType = {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
};
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  return <ToastContext.Provider value={{
    toasts,
    addToast,
    removeToast
  }}>
      {children}
      {toasts.length > 0 && <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map(toast => <div key={toast.id} className={`px-4 py-3 flex justify-between items-center max-w-md text-sm rounded-lg shadow-md ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-100' : toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' : toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' : 'bg-[#E6EDF8] text-[#2E3B55] border border-[#2E3B55]/10'}`}>
              <span>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="ml-4 text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>)}
        </div>}
    </ToastContext.Provider>;
};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};