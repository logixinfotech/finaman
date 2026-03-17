import {
  AddButton,
  UpdateButton,
  CancelButton,
  DeleteButton,
  PrintButton,
  HeaderAddButton
} from "../ActionButon";

const ERPFooter = ({
  isAddMode,
  isViewMode,
  isEditMode,
  saving,
  handleSubmit,
  onModify,
  onDelete,
  onPrint,
  onCancel,
  formData,
  onNewEntry,
  canPrint,
  showPrevious,
  showNext,
  onPrevious,
  onNext
}) => {

  return (
    <div className="flex justify-between items-center px-5 py-2 border-t bg-white">
      <div className="flex gap-3">
        {showPrevious && (
          <button
            onClick={onPrevious}
            className="px-4 py-1 text-xs rounded-md bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] transition"
          >
            ← Previous
          </button>
        )}
        {showNext && (
          <button
            onClick={onNext}
            className="px-4 py-1 text-xs rounded-md bg-[var(--accent-soft)] hover:bg-[var(--accent-hover)] transition"
          >
            Next →
          </button>
        )}

      </div>
      <div className="flex gap-3"> 
        {isAddMode && (
          <AddButton
            disabled={saving}
            onClick={handleSubmit}
          />
        )}
 
        {isViewMode && (
          <>
            <HeaderAddButton onClick={onNewEntry} />
            <UpdateButton onClick={onModify} isEditing={false} />
            <DeleteButton onClick={onDelete} />
            {canPrint && <PrintButton onClick={() => onPrint(formData)} />}           
          </>
        )} 
        {isEditMode && (
          <>
            <UpdateButton
              disabled={saving}
              onClick={handleSubmit}
              isEditing={true}  
            />
            <DeleteButton onClick={onDelete} />
            <PrintButton onClick={() => onPrint(formData)} disabled={!canPrint} />
          </>
        )}

        <CancelButton onClick={onCancel} />
      </div>
    </div>
  );
};

export default ERPFooter;