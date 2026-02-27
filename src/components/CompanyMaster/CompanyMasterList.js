import React from 'react';

const CompanyMasterList = ({ companies, onDelete, onEdit }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Company Name</th>
                    <th>Trade Name</th>
                    <th>Company Type</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {companies.map((company) => (
                    <tr key={company.company_id}>
                        <td>{company.company_name}</td>
                        <td>{company.trade_name}</td>
                        <td>{company.company_type}</td>
                        <td>
                            <button onClick={() => onEdit(company)}>Edit</button>
                            <button onClick={() => onDelete(company.company_id)}>Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default CompanyMasterList;
