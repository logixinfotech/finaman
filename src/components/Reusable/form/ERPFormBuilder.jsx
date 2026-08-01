import { useEffect, useState } from "react";
import ERPHeader from "./HeaderForm";
import ERPFooter from "./FooterForm";
import ERPSettings from "../ERPSettings";
import FormBody from "./FormBody";
import FormSidebar from "./FormSidebar";
import ESignDialog from "../../../pages/Modules/QMS/Components/ESignDialog"; 
import { ERPFormProvider, useERPFormMeta, useERPFormData } from "../../../theme/ERPFormContext";
import { useFormSaveHandler } from "../../../Hooks/useFormHandlers";
import { initERPShortcuts, setERPHandlers, setERPGlobalLoading } from '../../../utils/erpShortcuts';

function getCurrentUser() {
  try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
  catch { return {}; }
}

function ERPFormBuilderInner() {
  const {
    title, isAddMode, isEditMode, isViewMode,
    effectiveHeaderTab, handleHeaderTabChange, showSettingsTab,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    hideSidebar, saving, rights, canPrint,
    onModify, onCancel, onDelete, onNewEntry, onEditCancel, onPrint,
    settingsConfig, settingsDefaults, onSettingsSave,
    saveBtnRef,
    nextStage, isMyTurn, onSignedSave, activeTab, alwaysSignTabs, isStageComplete, 
  } = useERPFormMeta();
  const { formData } = useERPFormData();

  const [showSignDialog, setShowSignDialog] = useState(false); 
  const [signSaving, setSignSaving] = useState(false);    

  const handleSave = useFormSaveHandler();
  const mode = isAddMode ? "add" : isEditMode ? "edit" : "view";
 
const forceSign = (alwaysSignTabs || []).includes(activeTab);
  const requiresSignOnSave =
    !!onSignedSave &&
    !!nextStage &&
    isStageComplete &&     
    (forceSign || isMyTurn);

  const effectiveSaveHandler = () => {
    if (requiresSignOnSave) {
      setShowSignDialog(true);
    } else {
      handleSave();
    }
  };

  const confirmSignedSave = async (typedName) => {
    setSignSaving(true);
    try {
      await onSignedSave(formData, typedName, nextStage);
      setShowSignDialog(false);
    } finally {
      setSignSaving(false);
    }
  };

  useEffect(() => { setERPGlobalLoading(saving); }, [saving]);

  useEffect(() => {
    const cleanup = initERPShortcuts();
    setERPHandlers({
      onSave: () => { if (isAddMode || isEditMode) effectiveSaveHandler(); },    
      onAdd: () => { if (isViewMode) onNewEntry?.(); },
      onModify: () => { if (isViewMode) onModify?.(); },
      onCancel: () => { if (isEditMode) onEditCancel?.(); else onCancel?.(); },
      onEsc: () => { if (isEditMode) onEditCancel?.(); else onCancel?.(); },
      onDelete: () => { if (isViewMode) onDelete?.(formData); },
      onPrint: () => onPrint?.(formData),
      onBackspaceNavigation: true,
    });
    return () => cleanup();
  }, [isAddMode, isEditMode, isViewMode, formData, handleSave, onModify, onCancel, onDelete, onPrint, onEditCancel, onNewEntry, requiresSignOnSave]);

  return (
    <div className="w-full h-full sm:h-[calc(100vh-100px)] bg-[#eef1f8] flex flex-col overflow-hidden font-['Segoe_UI',system-ui,Arial,sans-serif] text-[13px] text-[#0f172a] leading-[1.4]">
      <ERPHeader
        title={title}
        isAddMode={isAddMode}
        isEditMode={isEditMode}
        isViewMode={isViewMode}
        activeTab={effectiveHeaderTab}
        onTabChange={handleHeaderTabChange}
        showSettingsTab={showSettingsTab}
        rightContent={`${currentRecord || 1}/${totalRecords || 1}`}
        currentIndex={currentRecord}
        totalRecords={totalRecords}
        onPrevRecord={onPrevRecord}
        onNextRecord={onNextRecord}
      />

      {effectiveHeaderTab === "settings" ? (
        <ERPSettings
          applName={title}
          config={settingsConfig}
          initialValues={settingsDefaults}
          onSave={(values) => { onSettingsSave?.(values); handleHeaderTabChange("entry"); }}
          onCancel={() => handleHeaderTabChange("entry")}
          onRestore={() => {}}
        />
      ) : (
        <>
          
          <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
            {!hideSidebar && <FormSidebar />}
            <FormBody />
          </div>

          <div id="erp-footer-container">
            <ERPFooter
              isAddMode={isAddMode}
              isViewMode={isViewMode}
              isEditMode={isEditMode}
              saving={saving}
              saveBtnRef={saveBtnRef}
              rights={rights}
              handleSubmit={effectiveSaveHandler} 
              onModify={onModify}
              onCancel={onCancel}
              onNewEntry={onNewEntry}
              onPrint={() => onPrint?.(formData)}
              onEditCancel={onEditCancel}
              onDelete={() => onDelete?.(formData)}
              canPrint={canPrint}
            />
          </div>
 
         {showSignDialog && (() => {
            const u = getCurrentUser();
            return (
              <ESignDialog
                meaning={`Save & advance: ${formData?.Status} → ${nextStage}`}
                signingAsLabel={u?.user_name || u?.user_id || "Unknown"}
                hint={`Type "${u?.user_name || u?.user_id}" to sign`}
                onConfirm={confirmSignedSave}
                onCancel={() => setShowSignDialog(false)}
              />
            );
          })()}
        </>
      )}
    </div>
  );
}

export default function ERPFormBuilder(props) {
  return (
    <ERPFormProvider {...props}>
      <ERPFormBuilderInner />
    </ERPFormProvider>
  );
}