
let isLoading = false;
let modalElement = null;

export const setERPGlobalLoading = (status) => {
  isLoading = status;
};

export const registerERPModal = (element) => {
  modalElement = element;
};

export const unregisterERPModal = () => {
  modalElement = null;
};
export const initERPShortcuts = ({
  onSave,
  onNew,
  onClose,
  onSearch,
  onEsc
}) => {

  const isInputField = (el) => {
    if (!el) return false;

    const tag = el.tagName?.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      el.isContentEditable
    );
  };

  const getScopeRoot = () => {
    if (modalElement) return modalElement;
    return document;
  };

  const getFocusableFields = () => {
    return Array.from(
      getScopeRoot().querySelectorAll(
        "input, select, textarea, [contenteditable='true']"
      )
    ).filter(
      (el) =>
        !el.disabled &&
        el.type !== "hidden" &&
        el.offsetParent !== null
    );
  };

const focusNext = (current) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(current);

  if (index > -1 && elements[index + 1]) { 
    elements[index + 1].focus();
  } else {
    // NEW LOGIC: If this is the last input, find and click the submit button
    const form = current.closest("form");
    if (form) { 
      const submitBtn = form.querySelector('button[type="submit"], .login-btn');
      if (submitBtn) {
        submitBtn.click();
      }
    }
  }
};

  const focusPrev = (current) => {
    const elements = getFocusableFields();
    const index = elements.indexOf(current);
    if (index > 0) {
      elements[index - 1].focus();
    }
  };

  const trapModalFocus = (e) => {
    if (!modalElement) return;

    if (!modalElement.contains(e.target)) {
      e.stopPropagation();
      e.preventDefault();

      const focusables = getFocusableFields();
      if (focusables.length) {
        focusables[0].focus();
      }
    }
  };

  const handleKeyDown = (e) => {

    if (isLoading) return;

    const key = (e.key || "").toLowerCase();

    if (e.ctrlKey) {
      const blocked = ["KeyN", "KeyS", "KeyW", "KeyF", "KeyR"];
      if (blocked.includes(e.code)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    if (e.key === "F5" || (e.ctrlKey && key === "r")) {
      e.preventDefault();
      return;
    }

    if (e.key === "F2") {
      e.preventDefault();
      onNew && onNew();
      return;
    }
    if (e.ctrlKey && e.code === "KeyS") {
      e.preventDefault();
      onSave && onSave();
      return;
    }
    if (e.ctrlKey && e.code === "KeyW") {
      e.preventDefault();
      onClose && onClose();
      return;
    }
    if (e.ctrlKey && e.code === "KeyF") {
      e.preventDefault();
      onSearch && onSearch();
      return;
    }

    if (e.key === "Escape") {
      onEsc && onEsc();
      return;
    }
  if (e.key === "Enter") {

  if (e.target.closest("[data-dropdown-open='true']")) {
    return;
  }

  if (e.target?.tagName?.toLowerCase() === "textarea") {
    return;
  }

  if (!isInputField(e.target)) return;

  e.preventDefault();

  if (e.shiftKey) {
    focusPrev(e.target);
  } else {
    focusNext(e.target);
  }
}
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("focusin", trapModalFocus);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("focusin", trapModalFocus);
  };
};