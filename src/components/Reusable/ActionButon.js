import { useEffect } from "react";
 

const BaseButton = ({
  label,
  className,
  onClick,
  disabled = false,
  type = "button",
}) => {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};
 
const useButtonShortcut = (keyConfig, onClick, disabled) => {
  useEffect(() => {
    const handler = (e) => {
      if (disabled) return;

      // CTRL / CMD + S
      if (
        keyConfig === "save" &&
        (e.ctrlKey || e.metaKey) &&
        e.key === "s"
      ) {
        e.preventDefault();
        onClick?.();
      }

      // ESC
      if (keyConfig === "cancel" && e.key === "Escape") {
        e.preventDefault();
        onClick?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyConfig, onClick, disabled]);
};

/* ===== ACTION BUTTONS ===== */

export const AddButton = ({ onClick, disabled }) => {
  useButtonShortcut("save", onClick, disabled);

  return (
    <BaseButton
      label="Add (Ctrl + S)"
      className="save"
      onClick={onClick}
      disabled={disabled}
    />
  );
};

export const UpdateButton = ({ onClick, disabled }) => {
  useButtonShortcut("save", onClick, disabled);

  return (
    <BaseButton
      label="Update (Ctrl + S)"
      className="save"
      onClick={onClick}
      disabled={disabled}
    />
  );
};

export const DeleteButton = ({ onClick, disabled }) => (
  <BaseButton
    label="Delete"
    className="delete"
    onClick={onClick}
    disabled={disabled}
  />
);

export const CancelButton = ({ onClick }) => {
  useButtonShortcut("cancel", onClick);

  return (
    <BaseButton
      label="Cancel (Esc)"
      className="cancel"
      onClick={onClick}
    />
  );
};
