const UserGroupForm = ({
  formData,
  setFormData,
  onSave,
  onCancel,
}) => {

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: value,
    }));
  };  

  const inputClass =
    "h-8 w-56 px-2 text-sm border border-gray-300 rounded-md " +
    "focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm"> 
      <div className="flex items-end gap-6 flex-wrap">  
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Group Name
          </label>
          <input
            name="group_name"
            value={formData.group_name || ""}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter group name"
          />
        </div> 
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Remarks
          </label>
          <input
            name="remarks"
            value={formData.remarks || ""}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter remarks"
          />
        </div> 
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="h-8 px-4 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Save
          </button>

          <button
            onClick={onCancel}
            className="h-8 px-4 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>

      </div>

    </div>
  );
};

export default UserGroupForm;
  