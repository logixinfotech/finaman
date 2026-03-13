import React, { useRef, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Printer, FileDown, ArrowLeft } from "lucide-react";
import { useReactToPrint } from "react-to-print";

const ERPPrintPreview = ({
  title,
  data = {},
  sections = [],
  onBack,
  logo
}) => {

  const printRef = useRef();

  const getValue = (key) => data?.[key] ?? "-";

  const memoSections = useMemo(() => sections, [sections]);

const handlePrint = useReactToPrint({
  contentRef: printRef,
  documentTitle: title || "ERP Document"
});

  return (
    <div className="w-full bg-gray-100 flex flex-col items-center py-10"> 
      <div className="w-[820px] flex justify-between items-center mb-5 print:hidden">

        <div className="text-sm font-semibold text-gray-600">
          Document Preview
        </div>

        <div className="flex gap-2">

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-green-600 text-white rounded"
          >
            <Printer size={14} />
            Print
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded"
          >
            <FileDown size={14} />
            PDF
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-500 text-white rounded"
          >
            <ArrowLeft size={14} />
            Back
          </button>

        </div>
      </div> 
      <div
        ref={printRef}
        className="print-area bg-white w-[820px] min-h-[1123px] border border-gray-300 px-12 py-10 text-[13px] leading-relaxed"
      > 
        <div className="flex justify-between items-start border-b pb-6 mb-8">

          <div className="flex items-start gap-4">

            {logo && (
              <img
                src={logo}
                alt="logo"
                className="h-14 object-contain"
              />
            )}

            <div>

              <h1 className="text-xl font-bold text-gray-900">
                {title}
              </h1>

              {data?.company_name && (
                <div className="text-gray-600 mt-1">
                  {data.company_name}
                </div>
              )}

              <div className="text-xs text-gray-400 mt-1">
                Generated from ERP System
              </div>

            </div>

          </div>

          <QRCodeCanvas
            value={data?.company_id || JSON.stringify(data)}
            size={70}
          />

        </div> 
        <div className="space-y-8">

          {memoSections.map((section, index) => {

            if (section.type === "table") {

              const rows = data?.[section.dataKey] || [];

              return (
                <div key={index}>

                  <div className="flex items-center justify-between mb-2">

                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {section.title}
                    </h3>

                    <div className="flex-1 border-b ml-3"></div>

                  </div>

                  <table className="w-full border border-gray-300 text-sm">

                    <thead>
                      <tr className="bg-gray-100">

                        {section.columns.map((col, i) => (
                          <th
                            key={i}
                            className="border border-gray-300 px-3 py-2 text-left font-semibold"
                          >
                            {col.label}
                          </th>
                        ))}

                      </tr>
                    </thead>

                    <tbody>

                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={section.columns.length}
                            className="text-center py-4 text-gray-400 border"
                          >
                            No data available
                          </td>
                        </tr>
                      )}

                      {rows.map((row, rIndex) => (
                        <tr key={rIndex}>

                          {section.columns.map((col, cIndex) => (
                            <td
                              key={cIndex}
                              className="border border-gray-200 px-3 py-2"
                            >
                              {row?.[col.key] ?? "-"}
                            </td>
                          ))}

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>
              );
            }

            return (
              <div key={index}>

                <div className="flex items-center justify-between mb-3">

                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {section.title}
                  </h3>

                  <div className="flex-1 border-b ml-3"></div>

                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-2">

                  {section.fields.map((field, i) => (

                    <div
                      key={i}
                      className="flex justify-between border-b border-gray-200 py-1"
                    >

                      <span className="text-gray-500">
                        {field.label}
                      </span>

                      <span className="font-medium text-gray-800">
                        {getValue(field.key)}
                      </span>

                    </div>

                  ))}

                </div>

              </div>
            );

          })}
        </div> 
        <div className="border-t mt-12 pt-4 text-xs text-gray-400 flex justify-between">

          <span>
            Generated on {new Date().toLocaleString()}
          </span>

          <span>
            ERP System Document
          </span>

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
            border: none;
          }

        }
        `}
      </style>

    </div>
  );
};

export default ERPPrintPreview;