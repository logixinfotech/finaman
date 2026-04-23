// utils/erpShortcuts.js

let isLoading = false;
let modalElement = null;
let currentHandlers = {}; 

export const setERPGlobalLoading = (status) => {
  isLoading = status;
};

export const registerERPModal = (element) => {
  modalElement = element;
};

export const unregisterERPModal = () => {
  modalElement = null;
};

export const setERPHandlers = (handlers) => {
  currentHandlers = handlers || {};
};

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

const getScopeRoot = () => (modalElement ? modalElement : document);

const getFocusableFields = () => {
  return Array.from(
    getScopeRoot().querySelectorAll(
      "input, select, textarea, [contenteditable='true']"
    )
  ).filter(
    (el) => !el.disabled && el.type !== "hidden" && el.offsetParent !== null
  );
};

const focusNext = (current) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(current);
  if (index > -1 && elements[index + 1]) {
    elements[index + 1].focus();
  } else { 
    const form = current.closest("form");
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"], .login-btn');
      if (submitBtn) submitBtn.click();
    }
  }
};

const focusPrev = (current) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(current);
  if (index > 0) elements[index - 1].focus();
}; 

const trapModalFocus = (e) => {
  if (!modalElement) return;
  if (!modalElement.contains(e.target)) {
    e.stopPropagation();
    e.preventDefault();
    const focusables = getFocusableFields();
    if (focusables.length) focusables[0].focus();
  }
}; 

const handleKeyDown = (e) => {
  if (isLoading) return;

  const key = (e.key || "").toLowerCase();
  const code = e.code;

  // 1. Prevent Default for Boss's Shortcut Keys
  if (e.altKey || e.ctrlKey) {
    const erpKeyCodes = ["KeyA", "KeyM", "KeyD", "KeyV", "KeyP", "KeyE", "KeyS", "KeyF", "KeyR", "KeyG"];
    if (erpKeyCodes.includes(code)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // 🟢 RECORD ACTIONS (Alt + A, M, D)
  if (e.altKey && code === "KeyA") {
    currentHandlers.onAdd && currentHandlers.onAdd();
    return;
  }
  if (e.altKey && code === "KeyM") {
    currentHandlers.onModify && currentHandlers.onModify();
    return;
  }
  if (e.altKey && code === "KeyD") {
    currentHandlers.onDelete && currentHandlers.onDelete();
    return;
  }

  // 🔵 VIEW / OUTPUT (Alt + V, P, E)
  if (e.altKey && code === "KeyV") {
    currentHandlers.onPreview && currentHandlers.onPreview();
    return;
  }
  if (e.altKey && code === "KeyP") {
    currentHandlers.onPrint && currentHandlers.onPrint();
    return;
  }
  if (e.altKey && code === "KeyE") {
    currentHandlers.onExport && currentHandlers.onExport();
    return;
  }

  // 🟣 MAIN CONTROLS (Alt + S, F)
  if (e.altKey && code === "KeyS") {
    currentHandlers.onSave && currentHandlers.onSave();
    return;
  }
  if (e.altKey && code === "KeyF") {
    currentHandlers.onSearch && currentHandlers.onSearch();
    return;
  }
 
  if (e.key === "Escape") {
    currentHandlers.onCancel && currentHandlers.onCancel();
    currentHandlers.onClose && currentHandlers.onClose();
    return;
  }
  if (e.altKey && code === "KeyR") {
    currentHandlers.onRefresh && currentHandlers.onRefresh();
    return;
  }
  if (e.altKey && code === "KeyG") {
    currentHandlers.onGlobalSearch && currentHandlers.onGlobalSearch();
    return;
  }

  // ⚡ ADVANCED (Ctrl + D) - As per list Duplicate is still Ctrl
  if (e.ctrlKey && code === "KeyD") {
    e.preventDefault();
    currentHandlers.onDuplicateRecord && currentHandlers.onDuplicateRecord();
    return;
  }

  // 🟡 NAVIGATION (Enter / Shift + Enter)
  if (e.key === "Enter") {
    if (e.target.closest("[data-dropdown-open='true']") || e.target?.tagName?.toLowerCase() === "textarea") {
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

let isInitialized = false;

export const initERPShortcuts = () => {
  if (isInitialized) return () => { };
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("focusin", trapModalFocus);
  isInitialized = true;
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("focusin", trapModalFocus);
    isInitialized = false;
  };
};