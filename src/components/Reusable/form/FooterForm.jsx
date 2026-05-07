import { 
  AddButton, 
  UpdateButton, 
  CancelButton, 
  DiscardButton, 
  DeleteButton, 
  PrintButton, 
  HeaderAddButton 
} from "../button/ActionButon";

const ERPFooter = ({
  isAddMode, isViewMode, isEditMode,
  saving, handleSubmit, onModify, onDelete,
  onPrint, onEditCancel, onCancel, formData,
  onNewEntry, canPrint, rights
}) => { 

  const CommonActions = (
    <>
      <DeleteButton 
        onClick={onDelete} 
        disabled={isViewMode ? rights?.del !== 1 : !canPrint} 
      />
      <PrintButton 
        onClick={() => onPrint(formData)} 
        disabled={isViewMode ? rights?.print !== 1 : !canPrint} 
      />
    </>
  );

  return (  
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 px-6 py-3 border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl w-full min-h-[60px]">
       
      <div className="flex flex-wrap items-center justify-center gap-2">         
        {isAddMode && (
          <>
            <AddButton isAdding={true} disabled={saving} onClick={handleSubmit} />
            <DiscardButton onClick={onEditCancel} />
            {CommonActions}            
          </>
        )} 

        {isViewMode && (
          <>
            <HeaderAddButton onClick={onNewEntry} disabled={rights?.add !== 1} />
            <UpdateButton onClick={onModify} isEditing={false} disabled={rights?.mod !== 1} />
            {CommonActions} 
            <CancelButton onClick={onCancel} />           
          </>
        )} 

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