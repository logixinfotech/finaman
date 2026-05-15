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
<div className="w-full border-t bg-slate-50/90 backdrop-blur-md rounded-b-xl px-3 sm:px-4 py-3 overflow-x-auto">       
      <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2 min-w-max">        
        {isAddMode && (
          <>
            <AddButton id={"save"} isAdding={true} disabled={saving} onClick={handleSubmit} />
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