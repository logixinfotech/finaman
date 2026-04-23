import { useEffect } from "react";
import { Plus, Printer, Save, Pencil, Trash2, ArrowLeft, XCircle } from "lucide-react";
export const BaseButton = ({ children, className = "", onClick, disabled = false, shortcut, type = "button", id }) => {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold shadow-sm transition-all active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed ${className}`}
    >
      {children}
      {shortcut && <span className="ml-0.5 text-[9px] opacity-60 border border-current px-1 rounded">{shortcut}</span>}
    </button>
  );
};

const useButtonShortcut = (keyConfig, onClick, disabled) => {
  useEffect(() => {
    const handler = (e) => {
      if (disabled) return;
      const code = e.code;
      if (e.altKey) {
        if (keyConfig === "add" && code === "KeyA") { e.preventDefault(); onClick?.(); }
        if (keyConfig === "modify" && code === "KeyM") { e.preventDefault(); onClick?.(); }
        if (keyConfig === "delete" && code === "KeyD") { e.preventDefault(); onClick?.(); }
        if (keyConfig === "save" && code === "KeyS") { e.preventDefault(); onClick?.(); }
        if (keyConfig === "print" && code === "KeyP") { e.preventDefault(); onClick?.(); }
      }
      if (keyConfig === "cancel" && e.key === "Escape") { e.preventDefault(); onClick?.(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyConfig, onClick, disabled]);
};
 
export const AddButton = ({ onClick, disabled, isAdding = false }) => {
  useButtonShortcut(isAdding ? "save" : "add", onClick, disabled);
  return (
    <BaseButton 
      onClick={onClick} 
      disabled={disabled} 
      shortcut={isAdding ? "Alt+S" : "Alt+A"} 
      className="bg-emerald-600 hover:bg-emerald-700 text-white"
    >
      {isAdding ? <Save size={14} /> : <Plus size={14} />}
      {isAdding ? "Save" : "Add"}
    </BaseButton>
  );
};

export const HeaderAddButton = AddButton; 

// Requirement: Modify turns into Save
export const UpdateButton = ({ onClick, disabled, isEditing = false }) => {
  useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick}
      disabled={disabled}
      shortcut={isEditing ? "Alt+S" : "Alt+M"}
      className={isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
    >
      {isEditing ? <Save size={14} /> : <Pencil size={14} />}
      {isEditing ? "Save" : "Modify"}
    </BaseButton>
  );
};

// Requirement: Discard button (shown as "Cancel" in UI)
export const DiscardButton = ({ onClick, disabled }) => {
  useButtonShortcut("cancel", onClick, disabled);
  return (
    <BaseButton 
      onClick={onClick} 
      disabled={disabled} 
      shortcut="Alt+C" 
      className="bg-slate-200 hover:bg-slate-300 text-slate-700"
    >
      <XCircle size={14} /> Cancel
    </BaseButton>
  );
};

export const DeleteButton = ({ onClick, disabled }) => {
  useButtonShortcut("delete", onClick, disabled);
  return (
    <BaseButton onClick={onClick} disabled={disabled} shortcut="Alt+D" className="bg-red-600 hover:bg-red-700 text-white">
      <Trash2 size={14} /> Delete
    </BaseButton>
  );
};

export const PrintButton = ({ onClick, disabled }) => {
  useButtonShortcut("print", onClick, disabled);
  return (
    <BaseButton onClick={onClick} disabled={disabled} shortcut="Alt+P" className="bg-purple-600 hover:bg-purple-700 text-white">
      <Printer size={14} /> Preview
    </BaseButton>
  );
};

export const CancelButton = ({ onClick }) => {
  useButtonShortcut("cancel", onClick);
  return (
    <BaseButton onClick={onClick} shortcut="Esc" className="bg-slate-200 hover:bg-slate-300 text-slate-800">
      <ArrowLeft size={14} /> Exit
    </BaseButton>
  );
};