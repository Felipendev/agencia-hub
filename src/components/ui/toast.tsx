"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from "@/components/icons";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, type, message, duration };
      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => showToast("success", message, duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => showToast("error", message, duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => showToast("info", message, duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => showToast("warning", message, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, info, warning, removeToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4 sm:p-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const config = {
    success: {
      icon: CheckCircleIcon,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-900",
    },
    error: {
      icon: XCircleIcon,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      textColor: "text-red-900",
    },
    warning: {
      icon: AlertTriangleIcon,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      textColor: "text-amber-900",
    },
    info: {
      icon: InfoIcon,
      bg: "bg-sky-50",
      border: "border-sky-200",
      iconColor: "text-sky-600",
      textColor: "text-sky-900",
    },
  };

  const { icon: Icon, bg, border, iconColor, textColor } = config[toast.type];

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border ${border} ${bg} p-4 shadow-lg transition-all duration-300 ${
        isExiting
          ? "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>
        {toast.message}
      </p>
      <button
        onClick={handleRemove}
        className={`shrink-0 rounded p-0.5 transition-colors hover:bg-black/5 ${textColor}`}
        aria-label="Fechar"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
