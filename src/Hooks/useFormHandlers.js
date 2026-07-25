// hooks/useFormHandlers.js
import { useCallback } from "react";
import { useERPFormMeta , useERPFormData} from "../theme/ERPFormContext"; 

// ── Enter / Shift+Backspace field navigation ──
export function useFieldNavigation() {
  const { activeTab, isViewMode, tabs, setActiveTab, saveBtnRef } = useERPFormMeta();

  return useCallback((e) => {
    if (isViewMode) return;
    const targetTag = e.target.tagName.toLowerCase();

    if (e.key === "Enter") {
      if (targetTag === 'button' || e.target.type === 'file') return;
      if (targetTag === 'textarea' && e.shiftKey) return;
      e.preventDefault();

      const container = document.getElementById(`tab-content-${activeTab}`);
      if (!container) return;
      const fieldContainers = Array.from(container.querySelectorAll('[id^="field-container-"]'));
      const currentContainer = e.target.closest('[id^="field-container-"]');
      if (!currentContainer) return;

      const currentIndex = fieldContainers.indexOf(currentContainer);
      if (currentIndex > -1 && currentIndex < fieldContainers.length - 1) {
        const nextInput = fieldContainers[currentIndex + 1].querySelector(
          'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        );
        if (nextInput) setTimeout(() => nextInput.focus(), 10);
      } else if (currentIndex === fieldContainers.length - 1) {
        const currentTabIndex = tabs.indexOf(activeTab);
        if (currentTabIndex > -1 && currentTabIndex < tabs.length - 1) {
          setActiveTab(tabs[currentTabIndex + 1]);
        } else {
          setTimeout(() => saveBtnRef?.current?.focus(), 10);
        }
      }
    }

    if (e.key === "Backspace" && e.shiftKey) {
      e.preventDefault();
      const container = document.getElementById(`tab-content-${activeTab}`);
      if (!container) return;
      const fieldContainers = Array.from(container.querySelectorAll('[id^="field-container-"]'));
      const currentContainer = e.target.closest('[id^="field-container-"]');
      if (!currentContainer) return;

      const currentIndex = fieldContainers.indexOf(currentContainer);
      if (currentIndex > 0) {
        const prevInput = fieldContainers[currentIndex - 1].querySelector(
          'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        );
        if (prevInput) {
          setTimeout(() => {
            prevInput.focus();
            if (prevInput.setSelectionRange && prevInput.value) {
              const len = prevInput.value.length;
              prevInput.setSelectionRange(len, len);
            }
          }, 10);
        }
      } else if (currentIndex === 0) {
        const currentTabIndex = tabs.indexOf(activeTab);
        if (currentTabIndex > 0) {
          const prevTabName = tabs[currentTabIndex - 1];
          setActiveTab(prevTabName);
          setTimeout(() => {
            const prevTabContainer = document.getElementById(`tab-content-${prevTabName}`);
            if (!prevTabContainer) return;
            const prevTabFields = Array.from(prevTabContainer.querySelectorAll('[id^="field-container-"]'));
            if (prevTabFields.length > 0) {
              const lastInput = prevTabFields[prevTabFields.length - 1].querySelector(
                'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
              );
              lastInput?.focus();
            }
          }, 50);
        }
      }
    }
  }, [activeTab, isViewMode, tabs, setActiveTab, saveBtnRef]);
}

// ── Save + validation + error-focus ──
export function useFormSaveHandler() {
  const {
    validateForm, activeTab, setActiveTab,
    scrollContainerRef, isMounted, skipAutoFocusRef, onSave,
  } = useERPFormMeta();
  const { formDataRef, setErrors } = useERPFormData();

  return useCallback(() => {
    const { isValid, errors: errs } = validateForm(formDataRef.current);

    if (isValid) {
      onSave(formDataRef.current);
      return;
    }

    setErrors(errs);
    const errorFields = Object.keys(errs);
    const targetField = errorFields[0] ?? null;

    const tryFocus = (fieldToFocus, attempts = 0) => {
      if (!isMounted.current || attempts > 12) return;
      const errorContainer = document.getElementById(`field-container-${fieldToFocus}`);
      if (errorContainer) {
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        if (scrollContainerRef.current) {
          const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
          const elementTop = errorContainer.getBoundingClientRect().top;
          if (elementTop < containerTop || elementTop > containerTop + scrollContainerRef.current.clientHeight) {
            scrollContainerRef.current.scrollTop = errorContainer.offsetTop - scrollContainerRef.current.offsetTop - 10;
          }
        }
        setTimeout(() => {
          errorContainer.querySelector(
            'input:not([disabled]):not([type="hidden"]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
          )?.focus();
        }, 30);
      } else {
        setTimeout(() => tryFocus(fieldToFocus, attempts + 1), 40);
      }
    };
    if (targetField) tryFocus(targetField);
  }, [validateForm, formDataRef, setErrors, activeTab, setActiveTab, scrollContainerRef, isMounted, skipAutoFocusRef, onSave]);
}

// ── Global keyboard shortcuts (Alt+A/M/D/S/etc via erpShortcuts.js) ──
export function useFormShortcuts() {
  // imported lazily inside function to avoid circular import issues if needed later
  const { mode, saving, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry } = useERPFormMeta();
  const { formData } = useERPFormData();

  const handleSave = useFormSaveHandler();

  return { mode, saving, formData, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry, handleSave };
}