import { AlertTriangle } from "lucide-react";

import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const dialogMessage = message ?? description ?? "Are you sure?";
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>

          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle size={20} />
        </div>

        <p className="pt-1 text-sm leading-6 text-gray-600">{dialogMessage}</p>
      </div>
    </Modal>
  );
}
