import { useEffect, useRef } from "react";

const Dialog = ({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="outline-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-2xl w-120 p-6 rounded-xl bg-secondary text-white"
      onClose={onClose}
      onClick={(e) => {
        if (
          dialogRef.current &&
          !dialogRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      }}
    >
      <div className="grid">
        <div className="mb-3 text-gray-300 font-bold">{title}</div>
        <div className="text-gray-400">{description}</div>
        <button
          className="justify-self-end font-bold mt-4 cursor-pointer outline-0"
          onClick={onClose}
        >
          Ok
        </button>
      </div>
    </dialog>
  );
};

export default Dialog;
