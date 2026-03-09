import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, FileDown, ArrowLeft } from "lucide-react";

const ERPPrintPreview = ({
  title,
  data,
  sections,
  onBack,
  logo
}) => {

  const handlePrint = () => window.print();

  const handleExportPDF = () => window.print();

  return (

    <div className="fixed inset-0 z-50 bg-slate-100 overflow-auto flex flex-col items-center py-10">

      {/* ================= TOOLBAR ================= */}
      <div className="w-[820px] flex justify-between items-center mb-6 print:hidden">

        <h2 className="text-sm font-semibold text-gray-600 tracking-wide">
          Document Preview
        </h2>

        <div className="flex gap-3">

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            <Printer size={16} />
            Print
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            <FileDown size={16} />
            Export PDF
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

        </div>
      </div>

      {/* ================= DOCUMENT ================= */}

      <div className="print-area bg-white w-[820px] min-h-[1100px] rounded-lg shadow-xl border border-gray-200 p-12">

        {/* ================= HEADER ================= */}

        <div className="flex justify-between items-start border-b pb-6 mb-8">

          <div className="flex items-center gap-4">

            {logo && (
              <img
                src={logo}
                alt="logo"
                className="h-14 object-contain"
              />
            )}

            <div>

              <h1 className="text-2xl font-bold text-gray-900 tracking-wide">
                {title}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Generated from ERP System
              </p>

              {data.company_name && (
                <p className="text-lg font-semibold text-gray-800 mt-2">
                  {data.company_name}
                </p>
              )}

            </div>

          </div>

          {/* QR CODE */}

          <QRCodeCanvas
            value={JSON.stringify(data)}
            size={80}
          />

        </div>

        {/* ================= SECTIONS ================= */}

        <div className="space-y-8">

          {sections.map((section, index) => (

            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >

              {/* Section Title */}

              <h3 className="text-sm font-semibold text-gray-700 mb-5 uppercase tracking-wider">
                {section.title}
              </h3>

              {/* Fields */}

              <div className="grid grid-cols-2 gap-5">

                {section.fields.map((field, i) => (

                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >

                    <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                      {field.label}
                    </div>

                    <div className="text-sm font-medium text-gray-800">
                      {data[field.key] || "-"}
                    </div>

                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

        {/* ================= FOOTER ================= */}

        <div className="border-t mt-12 pt-4 text-center text-xs text-gray-400">

          Generated on {new Date().toLocaleString()}

        </div>

      </div>

      {/* ================= PRINT CSS ================= */}

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
            border: none;
            box-shadow: none;
          }

        }
        `}
      </style>

    </div>
  );
};

export default ERPPrintPreview;