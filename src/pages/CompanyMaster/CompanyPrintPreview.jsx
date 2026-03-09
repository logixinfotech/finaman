import React from "react";

const CompanyPrintPreview = ({ data, onBack }) => {

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex justify-center">

      <div className="bg-white w-[700px] shadow-lg border p-6 print-area">

        <h2 className="text-lg font-bold text-center mb-6">
          COMPANY DETAILS
        </h2>

        <div className="grid grid-cols-2 gap-3 text-sm">

          <p><b>Company Name:</b> {data.company_name}</p>
          <p><b>Company Code:</b> {data.company_code}</p>

          <p><b>Business Type:</b> {data.business_type}</p>
          <p><b>Short Name:</b> {data.short_name}</p>

          <p><b>GSTIN:</b> {data.gstin}</p>
          <p><b>PAN:</b> {data.pan_no}</p>

          <p><b>Phone:</b> {data.phone}</p>
          <p><b>Email:</b> {data.email}</p>

          <p><b>Bank Name:</b> {data.bank_name}</p>
          <p><b>Account No:</b> {data.account_no}</p>

          <p><b>IFSC:</b> {data.ifsc_code}</p>

        </div>

        <div className="mt-4">
          <b>Address:</b> {data.address}
        </div>

        {/* BUTTONS */}
        <div className="flex justify-center gap-4 mt-8 print:hidden">

          <button
            onClick={handlePrint}
            className="px-4 py-1 bg-green-600 text-white rounded"
          >
            Print
          </button>

          <button
            onClick={onBack}
            className="px-4 py-1 bg-gray-400 text-white rounded"
          >
            Back
          </button>

        </div>

      </div>

      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        `}
      </style>

    </div>
  );
};

export default CompanyPrintPreview;