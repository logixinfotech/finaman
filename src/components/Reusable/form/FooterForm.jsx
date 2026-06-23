import {
  AddButton,
  UpdateButton,
  CancelButton,
  DiscardButton,
  DeleteButton,
  PrintButton,
  HeaderAddButton
} from "../button/ActionButon";
import React, { forwardRef } from "react";

const ERPFooter = ({
  
  isAddMode, isViewMode, isEditMode,
  saving, handleSubmit, onModify, onDelete,
  onPrint, onEditCancel, onCancel, formData,
  onNewEntry, canPrint, rights, saveBtnRef, data
}) => {
  
  const CommonActions = (
    <>
      {/* Only render Delete if handler is provided */}
      {onDelete && (
        <DeleteButton
          onClick={onDelete}
          disabled={rights?.del !== 1}
        />
      )}

      {/* Only render Print if handler is provided */}
      {onPrint && (
        <PrintButton
          onClick={() => onPrint(formData)}
          disabled={!canPrint || rights?.print !== 1}
        />
      )}
    </>
  );
  
  return (
    <div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-2 sm:px-4 py-2 overflow-hidden">
      <div className="flex items-center justify-center gap-1 flex-nowrap w-full">
        {isAddMode && (
          <>
            <AddButton id="save" ref={saveBtnRef}  isAdding={true} disabled={saving} onClick={handleSubmit} />
            <DiscardButton onClick={onEditCancel} />
            {CommonActions}
          </>
        )}

        {isViewMode && (
          <>
            {/* Only render New button if handler is provided */}
            {onNewEntry && (
              <HeaderAddButton onClick={onNewEntry} disabled={rights?.add !== 1} />
            )}
            <UpdateButton onClick={onModify} isEditing={false} disabled={rights?.mod !== 1} />
            {CommonActions}
            <CancelButton onClick={onCancel} />
          </>
        )}
 {/* <button ref={saveBtnRef}>
   Test Save
</button> */}
        {isEditMode && (
          <>
            <UpdateButton disabled={saving} onClick={handleSubmit} isEditing={true} />
            <DiscardButton onClick={onEditCancel} />
            {CommonActions}
          </>
        )}
      </div>
    </div>
  );
};

export default ERPFooter;
