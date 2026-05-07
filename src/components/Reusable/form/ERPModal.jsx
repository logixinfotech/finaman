/**
 * ERPFormModal — Universal Modal Wrapper
 *
 * Tumhara koi bhi existing form component isko pass karo,
 * woh modal ke andar exactly waise hi render hoga.
 *
 * Usage:
 *   <ERPFormModal
 *     isOpen={showModal}
 *     onClose={() => setShowModal(false)}
 *     size="md"           // "sm" | "md" | "lg" | "xl" | "2xl" | "full"
 *   >
 *     <AddUserMaster
 *       formData={formData}
 *       setFormData={setFormData}
 *       mode={mode}
 *       onSave={handleSave}
 *       onCancel={() => setShowModal(false)}
 *       ...baki saare props
 *     />
 *   </ERPFormModal>
 */

import React, { useEffect, useRef } from "react";

const sizeMap = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  "2xl":"max-w-2xl",
  "3xl":"max-w-3xl",
  full: "max-w-[95vw]",
};

const ERPFormModal = ({
  isOpen,
  onClose,
  children,
  size = "2xl",
  closeOnBackdrop = true,
}) => {

  // Escape key se band ho
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${sizeMap[size] ?? sizeMap["2xl"]} max-h-[95vh] overflow-hidden`}
        style={{ animation: "erpFMIn 0.18s cubic-bezier(.4,0,.2,1)" }}
      >
        {/* Tumhara existing form — bilkul as-is */}
        {children}
      </div>

      <style>{`
        @keyframes erpFMIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
};

export default ERPFormModal;


// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLES — Kisi bhi existing form ke saath use karo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ── AddUserMaster modal ──────────────────────────────────────────────────────
 *
 * const [showUserModal, setShowUserModal] = useState(false);
 *
 * <ERPFormModal
 *   isOpen={showUserModal}
 *   onClose={() => setShowUserModal(false)}
 *   size="2xl"
 * >
 *   <AddUserMaster
 *     formData={formData}
 *     setFormData={setFormData}
 *     mode={mode}
 *     onSave={handleSave}
 *     onCancel={() => setShowUserModal(false)}
 *     onDelete={handleDelete}
 *     onModify={handleModify}
 *     onNewEntry={handleNewEntry}
 *     onEditCancel={handleEditCancel}
 *     saving={saving}
 *     currentRecord={currentRecord}
 *     totalRecords={totalRecords}
 *     rights={rights}
 *     canPrint={canPrint}
 *     onPrint={handlePrint}
 *     activeTab={activeTab}
 *     onTabChange={setActiveTab}
 *   />
 * </ERPFormModal>
 *
 *
 * ── UserGroupForm modal (existing) ──────────────────────────────────────────
 *
 * <ERPFormModal
 *   isOpen={showGroupModal}
 *   onClose={() => setShowGroupModal(false)}
 *   size="md"
 * >
 *   <UserGroupForm
 *     formData={newGroupData}
 *     setFormData={setNewGroupData}
 *     onSave={handleQuickAddGroup}
 *     onCancel={() => setShowGroupModal(false)}
 *     mode="add"
 *     saving={isQuickSaving}
 *     currentRecord={1}
 *     totalRecords={1}
 *     rights={{ add: 1 }}
 *   />
 * </ERPFormModal>
 *
 *
 * ── ShiftMaster, DepartmentMaster, BranchMaster — sab same pattern ──────────
 *
 * <ERPFormModal isOpen={showShiftModal} onClose={() => setShowShiftModal(false)} size="xl">
 *   <ShiftMaster ...props />
 * </ERPFormModal>
 */
