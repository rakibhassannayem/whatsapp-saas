"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Trash2 } from "lucide-react";

interface ClearAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  busy: boolean;
  onConfirmClear: () => void;
}

export default function ClearAudienceDialog({
  open,
  onOpenChange,
  selectedCount,
  busy,
  onConfirmClear,
}: ClearAudienceDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Trigger
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        disabled={busy || selectedCount === 0}
        type="button"
      >
        <Trash2 className="size-3.5" />
        Clear
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[110] bg-slate-950/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-[111] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div>
            <AlertDialog.Title className="text-[16px] font-bold">
              Clear campaign audience?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-[13px] leading-relaxed text-slate-600">
              This will remove all {selectedCount} selected contact
              {selectedCount === 1 ? "" : "s"} from this campaign&apos;s audience.
            </AlertDialog.Description>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialog.Close
              className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              disabled={busy}
            >
              Cancel
            </AlertDialog.Close>
            <button
              className="rounded-full bg-red-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={busy}
              onClick={onConfirmClear}
            >
              {busy ? "Clearing…" : "Clear audience"}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
