import {
  AddButton,
  UpdateButton,
  CancelButton,
} from "../Reusable/ActionButon";

import useEnterAsTab from "../Reusable/useEnterAsTab";
const MenuMasterForm = ({
  modules,
  formData,
  setFormData,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!formData.masmnu_id;

  const handleEnterAsTab = useEnterAsTab(".menu-master-form");

  return (
    <div className="menu-master-card">
      <div className="menu-master-header">
        <h3 className="menu-master-title">
          {isEditMode ? "Edit Menu Master" : "Add Menu Master"}
        </h3>
      </div>
      <div
        className="menu-master-form grid grid-cols-4 gap-4"
        onKeyDown={handleEnterAsTab}
      >

        {/* MODULE */}
        <div className="form-field col-span-2">
          <label>Module Name</label>
          <select
            className="form-input"
            value={formData.masmod_id}
            onChange={(e) =>
              setFormData({
                ...formData,
                masmod_id: Number(e.target.value),
              })
            }
          >
            <option value="">Select Module</option>
            {modules.map((m) => (
              <option key={m.masmod_id} value={m.masmod_id}>
                {m.mod_name}
              </option>
            ))}
          </select>
        </div>

        {/* PAD */}
        <div className="form-field">
          <label>Pad Name</label>
          <select
            className="form-input"
            value={formData.pad_name}
            onChange={(e) =>
              setFormData({ ...formData, pad_name: e.target.value })
            }
          >
            <option value="">Select Pad</option>
            <option value="Entries">Entries</option>
            <option value="Reports">Reports</option>
            <option value="Install">Install</option>
            <option value="Utility">Utility</option>
          </select>
        </div>

        {/* ITEM TYPE */}
        <div className="form-field">
          <label>Item Type</label>
          <input
            className="form-input"
            placeholder="M / S / R"
            value={formData.item_type}
            onChange={(e) =>
              setFormData({ ...formData, item_type: e.target.value })
            }
          />
        </div>

        {/* SERIAL NO */}
        <div className="form-field">
          <label>Serial No.</label>
          <input
            className="form-input"
            value={formData.srl_no}
            disabled
          />
        </div>

        {/* BAR SERIAL */}
        <div className="form-field">
          <label>Bar Srl.</label>
          <input
            className="form-input"
            value={formData.bar_srl}
            disabled
          />
        </div>

        {/* MENU NAME */}
        <div className="form-field col-span-2">
          <label>Menu Name</label>
          <input
            className="form-input"
            placeholder="Display menu name"
            value={formData.bar_name}
            onChange={(e) =>
              setFormData({ ...formData, bar_name: e.target.value })
            }
          />
        </div>

        {/* APPL TYPE */}
        <div className="form-field">
          <label>Appl. Type</label>
          <select
            className="form-input"
            value={formData.appl_type}
            onChange={(e) =>
              setFormData({ ...formData, appl_type: e.target.value })
            }
          >
            <option value="F">Form</option>
            <option value="P">Program</option>
            <option value="A">Application</option>
            <option value="E">Executable</option>
          </select>
        </div>

        {/* APPL NAME */}
        <div className="form-field">
          <label>Appl. Name</label>
          <input
            className="form-input"
            placeholder="Form / Report name"
            value={formData.appl_name}
            onChange={(e) =>
              setFormData({ ...formData, appl_name: e.target.value })
            }
          />
        </div>

        <div className="form-field col-span-2">
          <label>Parameters</label>
          <input
            className="form-input"
            placeholder="Optional parameters"
            value={formData.appl_para}
            onChange={(e) =>
              setFormData({ ...formData, appl_para: e.target.value })
            }
          />
        </div>

        {/* ACTIONS */}
        <div className="col-span-4 form-actions">
          {isEditMode ? (
            <UpdateButton onClick={onSave} />
          ) : (
            <AddButton onClick={onSave} />
          )}
          <CancelButton onClick={onCancel} />
        </div>

      </div>
    </div>
  );
};

export default MenuMasterForm;

