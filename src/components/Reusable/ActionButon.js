import { useEffect } from "react";
import { Plus } from "lucide-react";

/* ---------------- Base Button ---------------- */

const BaseButton = ({
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition 
      disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

/* ---------------- Shortcut Hook ---------------- */

const useButtonShortcut = (keyConfig, onClick, disabled) => {
  useEffect(() => {
    const handler = (e) => {
      if (disabled) return;

      if (
        keyConfig === "save" &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        onClick?.();
      }

      if (keyConfig === "cancel" && e.key === "Escape") {
        e.preventDefault();
        onClick?.();
      }

      if (keyConfig === "add" && e.key === "F2") {
        e.preventDefault();
        onClick?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyConfig, onClick, disabled]);
};

/* ---------------- Save Button ---------------- */

export const AddButton = ({ onClick, disabled }) => {
  useButtonShortcut("save", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Save (Ctrl + S)
    </BaseButton>
  );
};

/* ---------------- Update Button ---------------- */

export const UpdateButton = ({ onClick, disabled }) => {
  useButtonShortcut("save", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Update (Ctrl + S)
    </BaseButton>
  );
};

/* ---------------- Delete Button ---------------- */

export const DeleteButton = ({ onClick, disabled }) => (
  <BaseButton
    onClick={onClick}
    disabled={disabled}
    className="bg-red-600 hover:bg-red-700 text-white"
  >
    Delete
  </BaseButton>
);

/* ---------------- Cancel Button ---------------- */

export const CancelButton = ({ onClick }) => {
  useButtonShortcut("cancel", onClick);

  return (
    <BaseButton
      onClick={onClick}
      className="bg-slate-200 hover:bg-slate-300 text-slate-800"
    >
      Cancel (Esc)
    </BaseButton>
  );
}; 

export const HeaderAddButton = ({ onClick, disabled }) => {
  useButtonShortcut("add", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Plus size={14} />
      Add (F2)
    </BaseButton>
  );
};