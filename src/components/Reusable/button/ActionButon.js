 
// import React, { useEffect , forwardRef} from "react";
// import {
//   Plus, Printer, Save, Pencil,
//   Trash2, ArrowLeft, XCircle, Loader2, FileText, Ban,
// } from "lucide-react";

// export const BaseButton = forwardRef(
//   (
//     {
//       children,
//       className = "",
//       onClick,
//       disabled = false,
//       loading = false,
//       shortcut,
//       type = "button",
//       id,
//       "data-erp-role": erpRole,
//     },
//     ref
//   ) => {
//     return (
//       <button
//         id={id}
//         ref={ref}
//         data-erp-role={erpRole}
//         type={type}
//         onClick={onClick}
//         disabled={disabled || loading}
//            className={`
//   relative inline-flex items-center justify-center gap-1 sm:gap-1.5
//   h-[32px] sm:h-[34px]
//   px-2.5 sm:px-3.5
//   min-w-[44px] sm:min-w-[80px]
//   rounded-[6px] sm:rounded-[5px]

//   text-[11px] sm:text-[12px]
//   whitespace-nowrap shrink-0 font-medium tracking-[0.01em]

//   transition-all duration-150
//   active:scale-[0.95]

//   focus:outline-none focus:ring-2 focus:ring-offset-1

//   disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none

//   ${className}
// `}
//       >
//         {loading ? (
//           <Loader2 size={13} className="animate-spin" />
//         ) : (
//           <>
//             {children}
//             {shortcut && <span>{shortcut}</span>}
//           </>
//         )}
//       </button>
//     );
//   }
// );

// const useButtonShortcut = (keyConfig, onClick, disabled) => {
//   useEffect(() => {
//     if (disabled || !onClick) return;
//     const handler = (e) => {
//       const isAlt = e.altKey;
//       if (isAlt) {
//         if (keyConfig === "add" && e.code === "KeyA") { e.preventDefault(); onClick(); }
//         if (keyConfig === "modify" && e.code === "KeyM") { e.preventDefault(); onClick(); }
//         if (keyConfig === "delete" && e.code === "KeyD") { e.preventDefault(); onClick(); }
//         if (keyConfig === "save" && e.code === "KeyS") { e.preventDefault(); onClick(); }
//         if (keyConfig === "print" && e.code === "KeyP") { e.preventDefault(); onClick(); }
//         if (keyConfig === "draft" && e.code === "KeyR") { e.preventDefault(); onClick(); }
//         if (keyConfig === "reject" && e.code === "KeyJ") { e.preventDefault(); onClick(); }
//       }
//       if (keyConfig === "cancel" && e.key === "Escape") { e.preventDefault(); onClick(); }
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [keyConfig, onClick, disabled]);
// }; 
// const Kbd = ({ label, dark = false }) => (
//   <span className={`
//   hidden sm:inline-flex
//   ml-0.5 font-mono
//   text-[9px]
//   tracking-[0.04em] leading-none
//   px-[5px]
//   py-[1px] rounded-[3px]

//   ${dark
//       ? "bg-white/[0.18] text-white/70"
//       : "bg-black/[0.08] text-current opacity-60"
//     }
// `}>
//     {label}
//   </span>
// );
// // ── SAVE / ADD (filled emerald)
// export const AddButton = forwardRef(({ id, onClick, disabled, loading, isAdding = false },ref) => {
//   useButtonShortcut(isAdding ? "save" : "add", onClick, disabled);
//   return (
//     // NAYA
//     <BaseButton
//       ref={ref}
//       id={isAdding ? "save" : (id || "add")}
//       data-erp-role={isAdding ? "save" : undefined}
//       onClick={onClick} disabled={disabled} loading={loading}
//       className="bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-emerald-700/30"
//     >
//       {isAdding ? <Save size={13} /> : <Plus size={13} />}
//       {isAdding ? "Save" : "Add"}
//       <Kbd label={isAdding ? "Alt+S" : "Alt+A"} dark />
//     </BaseButton>
//   );
// });

// export const HeaderAddButton = AddButton;

// // ── UPDATE / MODIFY
// export const UpdateButton = ({ onClick, disabled, loading, isEditing = false }) => {
//   useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);
//   return (
//     // NAYA
//     <BaseButton
//       id={isEditing ? "update" : undefined}
//       data-erp-role={isEditing ? "update" : undefined}
//       onClick={onClick} disabled={disabled} loading={loading}
//       className={
//         isEditing
//           ? "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-emerald-700/30"
//           : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 border border-blue-700/30"
//       }
//     >
//       {isEditing ? <Save size={13} /> : <Pencil size={13} />}
//       {isEditing ? "Update" : "Modify"}
//       <Kbd label={isEditing ? "Alt+S" : "Alt+M"} dark />
//     </BaseButton>
//   );
// };

// // ── DISCARD / CANCEL (neutral outlined)
// export const DiscardButton = ({ onClick, disabled }) => {
//   useButtonShortcut("cancel", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled}
//       className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 focus:ring-slate-200"
//     >
//       <XCircle size={13} />
//       Cancel
//       <Kbd label="Esc" />
//     </BaseButton>
//   );
// };

// // ── DELETE (filled red)
// export const DeleteButton = ({ onClick, disabled, loading }) => {
//   useButtonShortcut("delete", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled} loading={loading}
//       className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-red-700/30"
//     >
//       <Trash2 size={13} />
//       Delete
//       <Kbd label="Alt+D" dark />
//     </BaseButton>
//   );
// };

// // ── PRINT / PREVIEW (soft indigo outlined)
// export const PrintButton = ({ onClick, disabled, loading }) => {
//   useButtonShortcut("print", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled} loading={loading}
//       className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 focus:ring-indigo-300"
//     >
//       <Printer size={13} />
//       Preview
//       <Kbd label="Alt+P" />
//     </BaseButton>
//   );
// };
// // ── SAVE DRAFT (soft amber outlined)
// export const DraftButton = ({ onClick, disabled, loading }) => {
//   useButtonShortcut("draft", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled} loading={loading}
//       className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 focus:ring-amber-300"
//     >
//       <FileText size={13} />
//       Save Draft
//       <Kbd label="Alt+R" />
//     </BaseButton>
//   );
// };
// // ── EXIT / CLOSE (slate soft)
// // export const CancelButton = ({ onClick }) => {
// //   useButtonShortcut("cancel", onClick);
// //   return (
// //     <BaseButton
// //       onClick={onClick}
// //       className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 hover:border-slate-300 focus:ring-slate-200"
// //     >
// //       <ArrowLeft size={13} />
// //       Exit
// //       <Kbd label="Esc" />
// //     </BaseButton>
// //   );
// // };

// export const CancelButton = ({ onClick }) => (
//   <BaseButton
//     onClick={onClick}
//     className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 hover:border-slate-300 focus:ring-slate-200"
//   >
//     <ArrowLeft size={13} />
//     Exit
//   </BaseButton>
// );

// // ── REJECT (outlined red — Delete se alag dikhe)
// export const RejectButton = ({ onClick, disabled, loading }) => {
//   useButtonShortcut("reject", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled} loading={loading}
//       className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 hover:border-rose-400 focus:ring-rose-300"
//     >
//       <Ban size={13} />
//       Reject
//       <Kbd label="Alt+J" />
//     </BaseButton>
//   );
// };


 import React, { useEffect , forwardRef} from "react";
import {
  Plus, Printer, Save, Pencil,
  Trash2, ArrowLeft, XCircle, Loader2, FileText, Ban,
} from "lucide-react";

export const BaseButton = forwardRef(
  (
    {
      children,
      className = "",
      onClick,
      disabled = false,
      loading = false,
      shortcut,
      type = "button",
      id,
      "data-erp-role": erpRole,
    },
    ref
  ) => {
    return (
      <button
        id={id}
        ref={ref}
        data-erp-role={erpRole}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
           className={`
  relative inline-flex items-center justify-center gap-1 sm:gap-1.5
  h-[32px] sm:h-[34px]
  px-2.5 sm:px-3.5
  min-w-[44px] sm:min-w-[80px]
  rounded-[6px] sm:rounded-[5px]

  text-[11px] sm:text-[12px]
  whitespace-nowrap shrink-0 font-medium tracking-[0.01em]

  transition-all duration-150
  active:scale-[0.95]

  focus:outline-none focus:ring-2 focus:ring-offset-1

  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none

  ${className}
`}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <>
            {children}
            {shortcut && <span>{shortcut}</span>}
          </>
        )}
      </button>
    );
  }
);

const useButtonShortcut = (keyConfig, onClick, disabled) => {
  useEffect(() => {
    if (disabled || !onClick) return;
    const handler = (e) => {
      const isAlt = e.altKey;
      if (isAlt) {
        if (keyConfig === "add" && e.code === "KeyA") { e.preventDefault(); onClick(); }
        if (keyConfig === "modify" && e.code === "KeyM") { e.preventDefault(); onClick(); }
        if (keyConfig === "delete" && e.code === "KeyD") { e.preventDefault(); onClick(); }
        if (keyConfig === "save" && e.code === "KeyS") { e.preventDefault(); onClick(); }
        if (keyConfig === "print" && e.code === "KeyP") { e.preventDefault(); onClick(); }
        if (keyConfig === "draft" && e.code === "KeyR") { e.preventDefault(); onClick(); }
        if (keyConfig === "reject" && e.code === "KeyJ") { e.preventDefault(); onClick(); }
      }
      if (keyConfig === "cancel" && e.key === "Escape") { e.preventDefault(); onClick(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyConfig, onClick, disabled]);
}; 
const Kbd = ({ label, dark = false }) => (
  <span className={`
  hidden sm:inline-flex
  ml-0.5 font-mono
  text-[9px]
  tracking-[0.04em] leading-none
  px-[5px]
  py-[1px] rounded-[3px]

  ${dark
      ? "bg-white/[0.18] text-white/70"
      : "bg-black/[0.08] text-current opacity-60"
    }
`}>
    {label}
  </span>
);

// ── SAVE / ADD (filled emerald)
export const AddButton = forwardRef(({ id, onClick, disabled, loading, isAdding = false },ref) => {
  useButtonShortcut(isAdding ? "save" : "add", onClick, disabled);
  return (
    <BaseButton
      ref={ref}
      id={isAdding ? "save" : (id || "add")}
      data-erp-role={isAdding ? "save" : undefined}
      onClick={onClick} disabled={disabled} loading={loading}
      className="bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-emerald-700/30"
    >
      {isAdding ? <Save size={13} /> : <Plus size={13} />}
      {isAdding ? "Save" : "Add"}
      <Kbd label={isAdding ? "Alt+S" : "Alt+A"} dark />
    </BaseButton>
  );
});

export const HeaderAddButton = AddButton;

// ── UPDATE / MODIFY (filled blue / emerald)
export const UpdateButton = ({ onClick, disabled, loading, isEditing = false }) => {
  useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);
  return (
    <BaseButton
      id={isEditing ? "update" : undefined}
      data-erp-role={isEditing ? "update" : undefined}
      onClick={onClick} disabled={disabled} loading={loading}
      className={
        isEditing
          ? "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 border border-emerald-700/30"
          : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 border border-blue-700/30"
      }
    >
      {isEditing ? <Save size={13} /> : <Pencil size={13} />}
      {isEditing ? "Update" : "Modify"}
      <Kbd label={isEditing ? "Alt+S" : "Alt+M"} dark />
    </BaseButton>
  );
};

// ── DISCARD / CANCEL (filled slate)
export const DiscardButton = ({ onClick, disabled }) => {
  useButtonShortcut("cancel", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled}
      className="bg-slate-500 hover:bg-slate-600 text-white focus:ring-slate-400 border border-slate-600/30"
    >
      <XCircle size={13} />
      Cancel
      <Kbd label="Esc" dark />
    </BaseButton>
  );
};

// ── DELETE (filled red)
export const DeleteButton = ({ onClick, disabled, loading }) => {
  useButtonShortcut("delete", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled} loading={loading}
      className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-red-700/30"
    >
      <Trash2 size={13} />
      Delete
      <Kbd label="Alt+D" dark />
    </BaseButton>
  );
};

// ── PRINT / PREVIEW (filled indigo)
export const PrintButton = ({ onClick, disabled, loading }) => {
  useButtonShortcut("print", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled} loading={loading}
      className="bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500 border border-cyan-700/30"
    >
      <Printer size={13} />
      Preview
      <Kbd label="Alt+P" dark />
    </BaseButton>
  );
};

// ── SAVE DRAFT (filled amber)
export const DraftButton = ({ onClick, disabled, loading }) => {
  useButtonShortcut("draft", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled} loading={loading}
      className="bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 border border-orange-700/30"
    >
      <FileText size={13} />
      Save Draft
      <Kbd label="Alt+R" dark />
    </BaseButton>
  );
};

// ── EXIT / CLOSE (filled slate)
export const CancelButton = ({ onClick }) => (
  <BaseButton
    onClick={onClick}
    className="bg-slate-500 hover:bg-slate-600 text-white focus:ring-slate-400 border border-slate-600/30"
  >
    <ArrowLeft size={13} />
    Exit
  </BaseButton>
);

// ── REJECT (filled rose)
export const RejectButton = ({ onClick, disabled, loading }) => {
  useButtonShortcut("reject", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled} loading={loading}
      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white focus:ring-fuchsia-500 border border-fuchsia-700/30"
    >
      <Ban size={13} />
      Reject
      <Kbd label="Alt+J" dark />
    </BaseButton>
  );
};