import { useCallback } from "react";
import { useERPFormMeta , useERPFormData} from "../theme/ERPFormContext"; 

 
export function useFieldNavigation() {
  const { activeTab, isViewMode, tabs, setActiveTab, saveBtnRef, fieldGroups, sectionAccess, customTabs } = useERPFormMeta();
  const handleSave = useFormSaveHandler();

  const getTabSectionTitles = useCallback((tab) => {
    const group = fieldGroups?.[tab];
    if (!group) return [];
    if (Array.isArray(group)) {
      return group.flatMap((row) => row.map(([secTitle]) => secTitle));
    }
    return Object.keys(group);
  }, [fieldGroups]);

  const isNavigableTab = useCallback((tab) => {
    if (customTabs?.[tab]) return false; // custom tab (Audit Trail etc.) — kabhi navigate/save-trigger nahi hoga
    if (!sectionAccess) return true;
    const titles = getTabSectionTitles(tab);
    if (!titles.length) return true; // fieldGroups wala normal tab hai bas access-info nahi mila
    return titles.some((t) => sectionAccess[t]?.state === 'editable');
  }, [sectionAccess, getTabSectionTitles, customTabs]);

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
        let nextIdx = currentTabIndex + 1;
        while (nextIdx < tabs.length && !isNavigableTab(tabs[nextIdx])) nextIdx++;

        if (nextIdx < tabs.length) {
          setActiveTab(tabs[nextIdx]);
        } else {
         setTimeout(() => saveBtnRef?.current?.focus(), 10); 
        }
      }
    }

    if ( e.shiftKey && e.key === "Backspace" ) {
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
        let prevIdx = currentTabIndex - 1;
        while (prevIdx >= 0 && !isNavigableTab(tabs[prevIdx])) prevIdx--;

        if (prevIdx >= 0) {
          const prevTabName = tabs[prevIdx];
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
  }, [activeTab, isViewMode, tabs, setActiveTab, saveBtnRef, isNavigableTab, handleSave]);
}
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
export function useFormShortcuts() {
  const { mode, saving, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry } = useERPFormMeta();
  const { formData } = useERPFormData();

  const handleSave = useFormSaveHandler();

  return { mode, saving, formData, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry, handleSave };
}