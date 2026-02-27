import React, { useEffect, useState } from "react";
import { getCompanyList } from "../../utils/api"; // Import the API function to get companies
import "./CompanyMasterPage.css"; // Optional: Add page-specific CSS

export default function CompanyMasterPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch the list of companies when the component mounts
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const data = await getCompanyList(); // Fetch companies from the API
                setCompanies(data); // Set the company data to state
            } catch (err) {
                setError("Failed to load companies.");
            } finally {
                setLoading(false); // Set loading to false once the data is fetched
            }
        };

        fetchCompanies();
    }, []);

    // Handle loading state
    if (loading) return <div>Loading...</div>;

    // Handle error state
    if (error) return <div>{error}</div>;

    return (
        <div className="page-wrapper">
            <h1>Company Master</h1>
            <p>This is the page for managing company information.</p>

            <div className="company-list">
                <h2>Company List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Company Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((company) => (
                            <tr key={company.id}>
                                <td>{company.company_name}</td>
                                <td>
                                    <button>Edit</button> {/* Implement Edit functionality later */}
                                    <button>Delete</button> {/* Implement Delete functionality later */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
