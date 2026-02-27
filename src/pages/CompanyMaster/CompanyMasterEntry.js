import {
  AddButton,
  UpdateButton,
  CancelButton,
} from "../../components/Reusable/ActionButon";

const CompanyMasterForm = ({
  formData,
  setFormData,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!formData.company_id;

  return (
    <div className="menu-master-card">

      <div className="menu-master-header">
        <h3>
          {isEditMode ? "Edit Company" : "Add Company"}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div className="form-field">
          <label>Company Name</label>
          <input
            className="form-input"
            value={formData.company_name}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value })
            }
          />
        </div>

        <div className="form-field">
          <label>Trade Name</label>
          <input
            className="form-input"
            value={formData.trade_name}
            onChange={(e) =>
              setFormData({ ...formData, trade_name: e.target.value })
            }
          />
        </div>

        <div className="form-field">
          <label>Company Type</label>
          <input
            className="form-input"
            value={formData.company_type}
            onChange={(e) =>
              setFormData({ ...formData, company_type: e.target.value })
            }
          />
        </div>

        <div className="form-field">
          <label>City</label>
          <input
            className="form-input"
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
          />
        </div>

        <div className="form-field">
          <label>State</label>
          <input
            className="form-input"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
          />
        </div>

        <div className="form-field">
          <label>Country</label>
          <input
            className="form-input"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
          />
        </div>

        <div className="col-span-3 form-actions">
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

export default CompanyMasterForm;