 import { DEFAULT_SHORTCUTS, eventToCombo } from "./Shortcuts/ShortcutRegistry";
let isLoading = false;
let modalElement = null;
let currentHandlers = {};
const actionRegistry = new Map();
export const registerShortcutAction = (id, fn) => {
  actionRegistry.set(id, fn);
  return () => { if (actionRegistry.get(id) === fn) actionRegistry.delete(id); };
};
const buildDefaultBindings = () => {
  const map = {};
  DEFAULT_SHORTCUTS.forEach((s) => { map[s.keys] = s; });
  return map;
};
let bindings = buildDefaultBindings();
export const setERPBindings = (resolvedShortcuts) => {
  if (!resolvedShortcuts) { bindings = buildDefaultBindings(); return; }
  if (!Array.isArray(resolvedShortcuts)) {
    console.error("setERPBindings: array expected, mila:", resolvedShortcuts, "— shortcuts default pe rakhe ja rahe hain");
    bindings = buildDefaultBindings();
    return;
  }
  const map = {};
  resolvedShortcuts.forEach((s) => { if (s.enabled) map[s.keys] = s; });
  bindings = map;
};
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
const LEGACY_SUPPRESSED_CODES = ["KeyA", "KeyM", "KeyD", "KeyV", "KeyP", "KeyE", "KeyS", "KeyF", "KeyR", "KeyG"];
const NATIVE_EDIT_CODES = ["KeyA", "KeyC", "KeyV", "KeyX", "KeyZ", "KeyY"];
const isDebug = () => {
  try { return localStorage.getItem("erpShortcutsDebug") === "1"; } catch { return false; }
};
const logShortcut = (...args) => { if (isDebug()) console.log("[ERP shortcuts]", ...args); };
const handleShortcutKeyDown = (e) => {
  const isCombo = e.altKey || e.ctrlKey || e.metaKey;
  if (isLoading) {
    if (isCombo) logShortcut("blocked: page is loading (setERPGlobalLoading)");
    return;
  }
  const combo = eventToCombo(e);
  const entry = combo ? bindings[combo] : null;
  if (!entry) {
    if (isCombo && combo) logShortcut("no shortcut bound to", combo);
    return;
  }
  const handler = actionRegistry.get(entry.id) || (entry.action ? currentHandlers[entry.action] : null);
  logShortcut(combo, "->", entry.id, handler ? "running" : "NO HANDLER set on this screen");
  e.preventDefault();  
  if (handler) handler();
};
const handleKeyDown = (e) => {
  if (isLoading) return;
  if (e.altKey || e.ctrlKey) {
    const isNativeEdit = e.ctrlKey && !e.altKey && NATIVE_EDIT_CODES.includes(e.code);
    if (!isNativeEdit && LEGACY_SUPPRESSED_CODES.includes(e.code)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  if (e.key === "Escape") {
    currentHandlers.onCancel && currentHandlers.onCancel();
    currentHandlers.onClose && currentHandlers.onClose();
    return;
  }

  if (e.key === "Enter") {
    if (e.target.closest("[data-dropdown-open='true']") || e.target?.tagName?.toLowerCase() === "textarea") {
      return;
    }
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
  if (e.target.tagName === "TEXTAREA") {
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
  if (index === -1) {
    index = elements.findIndex(
      (el) =>
        el.contains(e.target) ||
        e.target.contains(el)
    );
  }
  if (index > -1 && index < elements.length - 1) {
    elements[index + 1].focus();
  } else {
    focusSaveOrUpdateButton();
  }
};
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
    if (fieldIndexMap[firstErrorKey] !== undefined) {
      el = allInputs[fieldIndexMap[firstErrorKey]];
    }
    if (!el) {
      el = formRef.current.querySelector(`[name="${firstErrorKey}"]`);
    }
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
  if (e.key === "Backspace" && e.shiftKey) {
    e.preventDefault();
    if (index > 0) elements[index - 1].focus();
    return;
  }
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

export const focusSaveOrUpdateButton = (saveBtnRef) => {
  saveBtnRef?.current?.focus();
};
let isInitialized = false;
export const initERPShortcuts = () => {
  if (isInitialized) return () => { };
  document.addEventListener("keydown", handleShortcutKeyDown, true);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("focusin", trapModalFocus);
  isInitialized = true;
  return () => {
    document.removeEventListener("keydown", handleShortcutKeyDown, true);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("focusin", trapModalFocus);
    isInitialized = false;
  };
};