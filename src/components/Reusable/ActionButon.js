import { useEffect } from "react";
import { Plus, Printer,Save ,Pencil,Trash2 ,ArrowLeft   } from "lucide-react"; 

const BaseButton = ({
  children,
  className = "",
  onClick,
  disabled = false,
  shortcut,
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2
        px-3 py-1.5
        rounded-md
        text-xs font-semibold
        shadow-sm
        transition-all
        active:scale-[0.98]
        disabled:opacity-40
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}

      {shortcut && (
        <span className="ml-1 text-[10px] opacity-70">
          {shortcut}
        </span>
      )}
    </button>
  );
};
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

      if (
        keyConfig === "delete" &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "d"
      ) {
        e.preventDefault();
        onClick?.();
      }

      if (
        keyConfig === "print" &&
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "p"
      ) {
        e.preventDefault();   // prevent browser print
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
      // Inside useButtonShortcut
if (
  keyConfig === "modify" &&
  (e.ctrlKey || e.metaKey) &&
  e.key.toLowerCase() === "m"
) {
  e.preventDefault();
  onClick?.();
}
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyConfig, onClick, disabled]);
};

export const AddButton = ({ onClick, disabled }) => {
  useButtonShortcut("save", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut="Ctrl+S"
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      <Save size={14} />
      Save
    </BaseButton>
  );
};
export const UpdateButton = ({ onClick, disabled, isEditing = false }) => {
  // If editing, use Save shortcut; otherwise use Modify shortcut
  useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut={isEditing ? "Ctrl+S" : "Ctrl+M"}
      className={isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
    >
      {isEditing ? <Save size={14} /> : <Pencil size={14} />}
      {isEditing ? "Save" : "Modify"}
    </BaseButton>
  );
}; 

export const DeleteButton = ({ onClick, disabled }) => {
  useButtonShortcut("delete", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut="Ctrl+D"
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      <Trash2 size={14} />
      Delete
    </BaseButton>
  );
};
export const CancelButton = ({ onClick }) => {
  useButtonShortcut("cancel", onClick);

  return (
    <BaseButton
      onClick={onClick}
      shortcut="Esc"
      className="bg-slate-200 hover:bg-slate-300 text-slate-800"
    >
      <ArrowLeft size={14} />
      Back
    </BaseButton>
  );
}; 

export const PrintButton = ({ onClick, disabled }) => {
  useButtonShortcut("print", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut="Ctrl+P"
      className="bg-purple-600 hover:bg-purple-700 text-white"
    >
      <Printer size={14} />
      Preview
    </BaseButton>
  );
};

export const HeaderAddButton = ({ onClick, disabled }) => {
  useButtonShortcut("add", onClick, disabled);

  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut="F2"
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Plus size={14} />
      Add
    </BaseButton>
  );
};