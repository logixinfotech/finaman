const MenuMasterActions = ({ onSave, onCancel, onDelete, onExit }) => {
  return (
    <div className="menu-master-actions">
      <button className="menu-master-btn save" onClick={onSave}>
        Save
      </button>
      <button className="menu-master-btn cancel" onClick={onCancel}>
        Cancel
      </button>
      <button className="menu-master-btn delete" onClick={onDelete}>
        Delete
      </button>
      <button className="menu-master-btn exit" onClick={onExit}>
        Exit
      </button>
    </div>
  );
};

export default MenuMasterActions;
