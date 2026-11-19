import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  addToast: (message: string, type: ToastType) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// --- Config ---

const toastConfig: Record<
  ToastType,
  { icon: React.FC<{ className?: string }>; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-green-600 text-white',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-600 text-white',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-500 text-white',
  },
  info: {
    icon: Info,
    className: 'bg-blue-600 text-white',
  },
};

// --- Toast Item ---

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const [mounted, setMounted] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMounted(true);
      });
    });
  }, []);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ease-out',
        config.className,
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
};

// --- Provider ---

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, 3000);

    timersRef.current.set(id, timer);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container — fixed above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        <div className="w-full max-w-sm flex flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

// --- Hook ---

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  return {
    toast: {
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(message, 'error'),
      info: (message: string) => addToast(message, 'info'),
      warning: (message: string) => addToast(message, 'warning'),
    },
  };
};
