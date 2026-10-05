"use client";

import { Toast } from "@base-ui/react/toast";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

export const toastManager = Toast.createToastManager();

export function showToast(
  title: string,
  description?: string,
  type: ToastType = "success",
) {
  toastManager.add({
    title,
    description,
    type,
    priority: type === "error" ? "high" : "low",
  });
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const Icon =
      toast.type === "error"
        ? CircleAlert
        : toast.type === "info"
          ? Info
          : CheckCircle2;
    const iconClassName =
      toast.type === "error"
        ? "text-red-600"
        : toast.type === "info"
          ? "text-blue-600"
          : "text-emerald-600";

    return (
      <Toast.Root
        className="data-ending-style:translate-x-4 data-ending-style:opacity-0 data-starting-style:translate-x-4 data-starting-style:opacity-0"
        key={toast.id}
        toast={toast}
      >
        <Toast.Content className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-slate-950 shadow-lg">
          <Icon className={`mt-0.5 size-4 shrink-0 ${iconClassName}`} />
          <div className="min-w-0 flex-1">
            <Toast.Title className="text-[13px] font-semibold" />
            <Toast.Description className="mt-1 text-[12px] leading-relaxed text-slate-600" />
          </div>
          <Toast.Close
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    );
  });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={4} toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none sm:right-6 sm:bottom-6">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
