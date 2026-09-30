import {
  AddButton,
  UpdateButton,
  CancelButton,
  DiscardButton,
  DeleteButton,
  PrintButton,
  HeaderAddButton,
  DraftButton, RejectButton,
} from "../button/ActionButon";
import React from "react";

const ERPFooter = ({

  isAddMode, isViewMode, isEditMode,
  saving, handleSubmit, onModify, onDelete,
  onPrint, onEditCancel, onCancel, formData,
  onNewEntry, canPrint, rights, saveBtnRef, data, onSaveDraft, savingDraft, canReject, onReject, canDelete, moduleKey,
}) => {
  const SaveDraftBtn = onSaveDraft && (isAddMode || isEditMode) && (
    <DraftButton onClick={onSaveDraft} disabled={savingDraft} loading={savingDraft} />
  );

  const RejectBtn = canReject && onReject && (
    <RejectButton onClick={onReject} />
  );

  const CommonActions = (
    <>
      {onDelete && (
        <DeleteButton
          onClick={onDelete}
          disabled={rights?.del !== 1}
        />
      )}
      {onPrint && (
        <PrintButton
          onClick={() => onPrint(formData)}
          disabled={!canPrint || rights?.print !== 1}
        />
      )}
    </>
  );

  return (
    <>
      <div
        className="w-full"
        style={{
          height: "1px",
          background: " var( --header-middle) ",
        }}
      />
 <div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-2 sm:px-4 py-2">
  <div
    className="w-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
    style={{
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      WebkitOverflowScrolling: "touch",
    }}
  >
    <div className="flex items-center gap-1 flex-nowrap w-max min-w-full justify-center [&>*]:shrink-0">
      {isAddMode && (
        <>
          <AddButton id="save" ref={saveBtnRef} isAdding={true} disabled={saving} onClick={handleSubmit} />
          {SaveDraftBtn}
          <DiscardButton onClick={onEditCancel} />
        </>
      )}

      {isViewMode && (
        <>
          {onNewEntry && (
            <HeaderAddButton onClick={onNewEntry} disabled={rights?.add !== 1} />
          )}
          {(!moduleKey || formData?.Id) && (
            <UpdateButton onClick={onModify} isEditing={false} disabled={rights?.mod !== 1} />
          )}
          {CommonActions}
          {RejectBtn}
          <CancelButton onClick={onCancel} />
        </>
      )}

      {isEditMode && (
        <>
          <UpdateButton disabled={saving} onClick={handleSubmit} isEditing={true} />
          {SaveDraftBtn}
          <DiscardButton onClick={onEditCancel} />
        </>
      )}
    </div>
  </div>
</div>
    </>
  );
};


export default ERPFooter;
