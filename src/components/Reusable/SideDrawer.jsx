import { useEffect } from "react";

const SideDrawer = ({ open, title, onClose, children }) => {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[520px] bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            className="text-xl text-gray-500 hover:text-red-500"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
