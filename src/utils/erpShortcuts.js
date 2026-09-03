 
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

// NAYA
const focusNext = (current) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(current);
  if (index > -1 && elements[index + 1]) {
    elements[index + 1].focus();
  } else {
    focusSaveOrUpdateButton();
  }
};

const focusPrev = (current) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(current);
  if (index > 0) elements[index - 1].focus();
}; 


const handleBackspaceNavigation = (e) => {
  const elements = getFocusableFields();
  const index = elements.indexOf(e.target);

  let shouldGoBack = false;
  if (e.target.tagName === "INPUT") {
    const isEmpty = e.target.value === "";
    const atStart =
      e.target.selectionStart === 0 &&
      e.target.selectionEnd === 0;

    if (isEmpty || atStart) {
      shouldGoBack = true;
    }
  }
  if (e.target.dataset.auto) {
    shouldGoBack = true;
  }
  if (e.target.dataset.toggle) {
    shouldGoBack = true;
  }
  if (shouldGoBack && index > 0) {
    e.preventDefault();
    elements[index - 1].focus();
  }
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
//  if (e.altKey || e.ctrlKey) {
//     const erpKeyCodes = ["KeyA", "KeyM", "KeyD", "KeyV", "KeyP", "KeyE", "KeyS", "KeyF", "KeyR", "KeyG"];
    
//     // Check if it's an ERP shortcut
//     if (erpKeyCodes.includes(code)) {
      
//       /* 🟢 FIX: If user is pressing Ctrl+A, do NOT preventDefault. 
//          This allows the browser's "Select All" to work. */
//       if (e.ctrlKey && code === "KeyA") {
//         return; // Exit and let the browser handle it
//       }

//       e.preventDefault();
//       e.stopPropagation();
//     }
//   }
if (e.altKey || e.ctrlKey) {
    const erpKeyCodes = ["KeyA", "KeyM", "KeyD", "KeyV", "KeyP", "KeyE", "KeyS", "KeyF", "KeyR", "KeyG"];

    // NAYA: Ctrl+A/C/V/X/Z/Y (jab Alt na ho) ko exception diya
    const nativeClipboardCodes = ["KeyA", "KeyC", "KeyV", "KeyX", "KeyZ", "KeyY"];
    if (e.ctrlKey && !e.altKey && nativeClipboardCodes.includes(code)) {
      return;
    }

    if (erpKeyCodes.includes(code)) {
      e.preventDefault();
      e.stopPropagation();
    }
}
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
 
  // NAYA
  if (e.key === "Enter") {
    if (e.target.closest("[data-dropdown-open='true']") || e.target?.tagName?.toLowerCase() === "textarea") {
      return;
    }
    // FIX: agar focus Save/Update button pe hai to click karo
    if (e.target?.tagName?.toLowerCase() === "button") {
      const role = e.target.dataset.erpRole;
      if (role === "save" || role === "update") {
        e.preventDefault();
        e.target.click();
      }
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
 
export const focusFirstInput = (formRef) => {
  if (!formRef?.current) return;

  setTimeout(() => {
    const firstField = formRef.current.querySelector(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [data-auto]"
    );

    if (firstField) {
      firstField.focus();
    }
  }, 120);
}; 
export const handleERPEnterNavigation = (
  e,
  formRef,
  isViewMode,
  saveBtnRef
) => {
  if (isViewMode || e.key !== "Enter") return;

  // TEXTAREA
  if (e.target.tagName === "TEXTAREA") {

    // Shift + Enter = new line
    if (e.shiftKey) return;

    e.preventDefault();

    focusSaveOrUpdateButton(saveBtnRef);
    return;
  }
   focusSaveOrUpdateButton(saveBtnRef);
  e.preventDefault();

  if (!formRef?.current) return;

  const elements = Array.from(
    formRef.current.querySelectorAll(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [data-auto]"
    )
  ).filter((el) => !el.disabled);

  let index = elements.indexOf(e.target);

  // ERPAutocomplete fix
  if (index === -1) {
    index = elements.findIndex(
      (el) =>
        el.contains(e.target) ||
        e.target.contains(el)
    );
  }

  // next field
  if (index > -1 && index < elements.length - 1) {
    elements[index + 1].focus();
  } else {
    // last field → save/update button
    focusSaveOrUpdateButton();
  }
}; 
// ── Add these two functions to your existing erpShortcuts.js ────────────────

/**
 * Error wali pehli field pe focus karo
 * @param {React.RefObject} formRef - form container ref
 * @param {object} newErrors        - { fieldKey: "Required", ... }
 * @param {string[]} requiredFields - ordered array of field keys
 * @param {object} fieldIndexMap    - { fieldKey: domInputIndex } override for custom components
 */
export const focusFirstError = (formRef, newErrors, requiredFields, fieldIndexMap = {}) => {
  if (!formRef?.current) return;
  requestAnimationFrame(() => {
    const firstErrorKey = requiredFields.find(f => newErrors[f]);
    if (!firstErrorKey) return;

    const allInputs = Array.from(
      formRef.current.querySelectorAll(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
      )
    );

    let el = null;

    // Custom index override diya hai (e.g. ERPAutocomplete)
    if (fieldIndexMap[firstErrorKey] !== undefined) {
      el = allInputs[fieldIndexMap[firstErrorKey]];
    }

    // name attribute se dhundo
    if (!el) {
      el = formRef.current.querySelector(`[name="${firstErrorKey}"]`);
    }

    // fallback: pehla input
    if (!el) el = allInputs[0];

    if (el) el.focus();
  });
};

/**
 * Shift+Backspace → previous field
 * Plain Backspace on time input empty minute → jump to hour
 * @param {KeyboardEvent} e
 * @param {React.RefObject} formRef
 * @param {boolean} isViewMode
 */
export const handleERPBackspaceNavigation = (e, formRef, isViewMode) => {
  if (isViewMode) return;
  if (!formRef?.current) return;

  const elements = Array.from(
    formRef.current.querySelectorAll(
      "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [data-auto]"
    )
  ).filter(el => !el.disabled);

  let index = elements.indexOf(e.target);
  if (index === -1) {
    index = elements.findIndex(
      el => el.contains(e.target) || e.target.contains(el)
    );
  }

  // Shift+Backspace → previous field
  if (e.key === "Backspace" && e.shiftKey) {
    e.preventDefault();
    if (index > 0) elements[index - 1].focus();
    return;
  }

  // Time input: plain Backspace on empty/zero minute → jump to hour
  if (e.key === "Backspace" && !e.shiftKey && e.target.type === "time") {
    const val    = e.target.value || "";
    const pos    = e.target.selectionStart;
    const minute = val.slice(3, 5);
    if (pos >= 3 && (minute === "00" || minute === "" || minute === "--")) {
      e.preventDefault();
      e.target.setSelectionRange(0, 2);
    }
  }
  
};
// NAYA
export const focusSaveOrUpdateButton = (saveBtnRef) => {
   saveBtnRef?.current?.focus();
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