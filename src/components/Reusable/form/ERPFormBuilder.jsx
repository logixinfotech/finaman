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
import { useAuth } from "../../../theme/AuthContext";


function ERPFormBuilderInner() {
  const {
    title, isAddMode, isEditMode, isViewMode,
    effectiveHeaderTab, handleHeaderTabChange, showSettingsTab,
    currentRecord, totalRecords, onPrevRecord, onNextRecord,
    hideSidebar, saving, rights, canPrint,
    onModify, onCancel, onDelete, onNewEntry, onEditCancel, onPrint,
    settingsConfig, settingsDefaults, onSettingsSave,
    saveBtnRef,
    nextStage, isMyTurn, canReject, onSignedSave, activeTab, alwaysSignTabs, isStageComplete, draftStatus, savingDraft, handleSaveDraftClick, canAddNew,
  } = useERPFormMeta();
  const { formData } = useERPFormData();
  const { user } = useAuth();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signSaving, setSignSaving] = useState(false);
  const [showReject, setShowReject] = useState(false);
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

  const confirmReject = async (typedName, reason) => {
    setSignSaving(true);
    try {
      await onSignedSave(formData, typedName, "Rejected", reason);
      setShowReject(false);
    } finally { setSignSaving(false); }
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
      // onCancel: () => { if (isEditMode) onEditCancel?.(); else onCancel?.(); },
      // onEsc: () => { if (isEditMode) onEditCancel?.(); else onCancel?.(); },
      onCancel: () => { if (isAddMode || isEditMode) onEditCancel?.(); },
      onEsc: () => { if (isAddMode || isEditMode) onEditCancel?.(); },
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
        rightContent={
          <div className="flex items-center gap-3">
            {(isAddMode || isEditMode) && draftStatus && (
              <span className={`text-[11px] font-medium ${draftStatus === 'saving' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {draftStatus === 'saving' ? 'Saving draft…' : '✓ Draft saved'}
              </span>
            )}
            <span>{currentRecord || 1}/{totalRecords || 1}</span>
          </div>
        }
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
          onRestore={() => { }}
        />
      ) : (
        <>

          <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full h-full md:h-[calc(100vh-120px)] overflow-hidden">
            {!hideSidebar && <FormSidebar />}
            <FormBody />
          </div>
          {activeTab !== "audit" && (
            <div id="erp-footer-container">
              <ERPFooter
                isAddMode={isAddMode}
                isViewMode={isViewMode}
                isEditMode={isEditMode}
                saving={saving}
                saveBtnRef={saveBtnRef}
                onSaveDraft={handleSaveDraftClick}
                savingDraft={savingDraft}
                rights={rights}
                handleSubmit={effectiveSaveHandler}
                onModify={onModify}
                onCancel={onCancel}
                onNewEntry={onNewEntry}
                onPrint={() => onPrint?.(formData)}
                onEditCancel={onEditCancel}
                onDelete={() => onDelete?.(formData)}
                canPrint={canPrint}
                canReject={canReject}
                onReject={() => setShowReject(true)}
                onNewEntry={onNewEntry}
              />
            </div>
          )}
          {showSignDialog && (
            <ESignDialog
              meaning={`Save & advance: ${formData?.Status} → ${nextStage}`}
              signingAsLabel={user?.user_name || user?.user_id || "Unknown"}
              onConfirm={confirmSignedSave}
              onCancel={() => setShowSignDialog(false)}
            />
          )}

          {showReject && (
            <ESignDialog
              meaning={`Reject record at "${formData?.Status}"`}
              signingAsLabel={user?.user_name || user?.user_id || "Unknown"}
              requireReason
              reasonLabel="Rejection Reason"
              onConfirm={confirmReject}
              onCancel={() => setShowReject(false)}
            />
          )}
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