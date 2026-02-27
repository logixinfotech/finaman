import React, { useState, useEffect } from 'react';
import { TextField, Button, Grid } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const CompanyMasterEdit = ({ companyData }) => {
    const [formValues, setFormValues] = useState(companyData);

    useEffect(() => {
        setFormValues(companyData);
    }, [companyData]);

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Updated Values:', formValues);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
                {/* Populate fields similar to the entry page, but with pre-filled values */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Company Name"
                        value={formValues.companyName}
                        onChange={(e) => setFormValues({ ...formValues, companyName: e.target.value })}
                    />
                </Grid>
                {/* More fields go here */}
            </Grid>

            <Button
                variant="contained"
                color="primary"
                type="submit"
                startIcon={<SaveIcon />}
            >
                Save Changes
            </Button>
        </form>
    );
};

export default CompanyMasterEdit;
