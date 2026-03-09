import { useEffect, useCallback } from "react";

const useEnterAsTab = (
  containerSelector = "form",
  moduleHandlers = {}
) => {

  const handleKeyDown = useCallback(
    (e) => {
      const key = e.key.toLowerCase(); 

      if (e.key === "F5") {
        e.preventDefault();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === "r") {
        e.preventDefault();
        return;
      } 
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        moduleHandlers.save?.();
        return;
      }

      // Ctrl + N → New Entry
      if ((e.ctrlKey || e.metaKey) && key === "n") {
        e.preventDefault();
        moduleHandlers.newEntry?.();
        return;
      }

      // Ctrl + W → Close Tab
      if ((e.ctrlKey || e.metaKey) && key === "w") {
        e.preventDefault();
        moduleHandlers.closeTab?.();
        return;
      }

      // Ctrl + F → Focus Search
      if ((e.ctrlKey || e.metaKey) && key === "f") {
        e.preventDefault();
        moduleHandlers.focusSearch?.();
        return;
      }

      // ESC → Close Modal
      if (key === "escape") {
        moduleHandlers.closeModal?.();
        return;
      } 
      if (key !== "enter") return;

      const tag = e.target.tagName.toLowerCase();

      if (!["input", "select", "textarea"].includes(tag)) return;

      if (tag === "textarea") return; // allow multiline

      const container = e.target.closest(containerSelector);
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll(
          "input:not([disabled]):not([readonly]), " +
          "select:not([disabled]), " +
          "textarea:not([disabled]):not([readonly]), " +
          "button:not([disabled])"
        )
      ).filter((el) => el.offsetParent !== null);

      const index = focusable.indexOf(e.target);
      if (index === -1) return;

      e.preventDefault();

      // Shift + Enter → Previous
      if (e.shiftKey) {
        if (index > 0) {
          focusable[index - 1].focus();
        }
        return;
      }

      // Normal Enter → Next
      if (index < focusable.length - 1) {
        focusable[index + 1].focus();
      } else {
        container.requestSubmit?.(); // last field submit
      }

    },
    [containerSelector, moduleHandlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export default useEnterAsTab;