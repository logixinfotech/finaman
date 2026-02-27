import { useCallback } from "react";

const useEnterAsTab = (containerSelector) => {
  return useCallback(
    (e) => {
      if (e.key !== "Enter") return;

      const tag = e.target.tagName.toLowerCase();
      if (!["input", "select", "textarea"].includes(tag)) return;
 
      if (tag === "textarea") return;

      e.preventDefault();

      const container = e.target.closest(containerSelector);
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll(
          "input:not([disabled]):not([readonly]), " +
            "select:not([disabled]), " +
            "textarea:not([disabled]), " +
            "button:not([disabled])"
        )
      ).filter((el) => el.offsetParent !== null);  

      const index = focusable.indexOf(e.target);
      if (index > -1 && index < focusable.length - 1) {
        focusable[index + 1].focus();
      }
    },
    [containerSelector]
  );
};

export default useEnterAsTab;
