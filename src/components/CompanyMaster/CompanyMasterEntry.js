import React, { useState } from "react";

// Company Master Form for adding a new company
const CompanyMasterEntryPage = () => {
    const [formData, setFormData] = useState({
        company_name: "",
        trade_name: "",
        company_type: "",
        business_address: "",
        postal_code: "",
        phone_number: "",
        email_address: "",
        website_url: "",
        country: "",
        state: "",
        city: "",
        registration_number: "",
        incorporation_date: "",
        legal_form: "",
        director_name: "",
        authorized_signatory: "",
        gstin_number: "",
        pan_number: "",
        tin_number: "",
        cin_number: "",
        license_info: "",
    });

    const [formError, setFormError] = useState(null);

    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Validate form fields
    const validateForm = () => {
        if (!formData.company_name || !formData.trade_name) {
            setFormError("Company Name and Trade Name are required.");
            return false;
        }
        setFormError(null);
        return true;
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        // Simulate form submission
        console.log("Form submitted with data:", formData);
        alert("Company added successfully!");
    };

    return (
        <div className="company-form-container">
            <h1>Company Master - Create Company</h1>
            {formError && <div className="error-message">{formError}</div>}
            <form onSubmit={handleSubmit} className="company-form">
                {/* Basic Information Section */}
                <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="form-field">
                        <label>Company Name:</label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label>Trade Name:</label>
                        <input
                            type="text"
                            name="trade_name"
                            value={formData.trade_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label>Company Type:</label>
                        <select
                            name="company_type"
                            value={formData.company_type}
                            onChange={handleChange}
                        >
                            <option value="Private">Private</option>
                            <option value="Public">Public</option>
                            <option value="LLC">LLC</option>
                        </select>
                    </div>
                </div>

                {/* Contact Information Section */}
                <div className="form-section">
                    <h3>Contact Information</h3>
                    <div className="form-field">
                        <label>Business Address:</label>
                        <input
                            type="text"
                            name="business_address"
                            value={formData.business_address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Postal Code:</label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Phone Number:</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Email Address:</label>
                        <input
                            type="email"
                            name="email_address"
                            value={formData.email_address}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Website URL:</label>
                        <input
                            type="url"
                            name="website_url"
                            value={formData.website_url}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Legal and Other Details Section */}
                <div className="form-section">
                    <h3>Legal Information</h3>
                    <div className="form-field">
                        <label>Incorporation Date:</label>
                        <input
                            type="date"
                            name="incorporation_date"
                            value={formData.incorporation_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Director Name:</label>
                        <input
                            type="text"
                            name="director_name"
                            value={formData.director_name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-field">
                        <label>Authorized Signatory:</label>
                        <input
                            type="text"
                            name="authorized_signatory"
                            value={formData.authorized_signatory}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                    <button type="submit" className="btn-submit">
                        Submit
                    </button>
                    <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setFormData({})}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyMasterEntryPage;
