import { useEffect, useRef, useCallback } from "react";

export default function useEmbeddedMaster({
  embedded = false,
  initialName = "",
  onSaved,
  onClose,
  handleAdd,
  setFormData,
  nameKey = "group_name",
}) {
  const booted = useRef(false);

  // Embedded mein khulte hi Add mode + naam prefill
  useEffect(() => {
    if (!embedded || booted.current) return;
    booted.current = true;
    handleAdd();
    setTimeout(() => {
      setFormData((p) => ({ ...p, [nameKey]: (initialName || "").toUpperCase() }));
    }, 0);
  }, [embedded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => onClose?.(), [onClose]);

  // true return kare to master page apna normal post-save flow skip kare
  const afterSave = useCallback((name) => {
    if (!embedded) return false;
    onSaved?.(name);
    return true;
  }, [embedded, onSaved]);

  return { isEmbedded: embedded, handleClose, afterSave };
}