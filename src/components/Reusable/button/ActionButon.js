// import React, { useEffect, forwardRef } from "react";
// import {
//   Plus, Printer, Save, Pencil,
//   Trash2, ArrowLeft, XCircle, Loader2, FileText, Ban,
//   CheckCircle2, ClipboardCheck, Download, Upload,
//   RefreshCw, Paperclip, Copy, Lock, Search, RotateCcw,
// } from "lucide-react";

// /**
//  * ─────────────────────────────────────────────────────────────────────────
//  * Design tokens
//  * ─────────────────────────────────────────────────────────────────────────
//  * One place to own each action's color. Every button below just references
//  * a `tone` name instead of repeating a bg/border/text/ring string — change
//  * the palette here and every button using that tone updates together.
//  */
// const TONES = {
//   emerald: "bg-emerald-100 border-emerald-300 text-emerald-700 focus-visible:ring-emerald-400",
//   blue: "bg-blue-100    border-blue-300    text-blue-700    focus-visible:ring-blue-400",
//   slate: "bg-slate-100   border-slate-300   text-slate-600   focus-visible:ring-slate-400",
//   red: "bg-red-100     border-red-300     text-red-700     focus-visible:ring-red-400",
//   violet: "bg-violet-100  border-violet-300  text-violet-700  focus-visible:ring-violet-400",
//   amber: "bg-amber-100   border-amber-300   text-amber-700   focus-visible:ring-amber-400",
//   rose: "bg-rose-100    border-rose-300    text-rose-700    focus-visible:ring-rose-400",
//   teal: "bg-teal-100    border-teal-300    text-teal-700    focus-visible:ring-teal-400",
//   indigo: "bg-indigo-100  border-indigo-300  text-indigo-700  focus-visible:ring-indigo-400",
//   sky: "bg-sky-100     border-sky-300     text-sky-700     focus-visible:ring-sky-400",
//   cyan: "bg-cyan-100    border-cyan-300    text-cyan-700    focus-visible:ring-cyan-400",
//   lime: "bg-lime-100    border-lime-300    text-lime-800    focus-visible:ring-lime-400",
//   zinc: "bg-zinc-200    border-zinc-300    text-zinc-700    focus-visible:ring-zinc-400",
//   purple: "bg-purple-100  border-purple-300  text-purple-700  focus-visible:ring-purple-400",
//   orange: "bg-orange-100  border-orange-300  text-orange-700  focus-visible:ring-orange-400",
//   gray: "bg-gray-200    border-gray-300    text-gray-700    focus-visible:ring-gray-400",
//   fuchsia: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700 focus-visible:ring-fuchsia-400",
// };

// /**
//  * Alt+<key> shortcuts, declared once instead of an if/else chain per action.
//  * `plain: true` means the key fires without Alt (used only for Escape).
//  */
// const SHORTCUTS = {
//   add: { code: "KeyA" },
//   modify: { code: "KeyM" },
//   delete: { code: "KeyD" },
//   save: { code: "KeyS" },
//   print: { code: "KeyP" },
//   draft: { code: "KeyR" },
//   reject: { code: "KeyJ" },
//   approve: { code: "KeyV" },
//   post: { code: "KeyO" },
//   export: { code: "KeyE" },
//   import: { code: "KeyI" },
//   refresh: { code: "KeyY" },
//   attach: { code: "KeyT" },
//   clone: { code: "KeyC" },
//   lock: { code: "KeyL" },
//   search: { code: "KeyF" },
//   cancel: { key: "Escape", plain: true },
// };

// const useButtonShortcut = (keyConfig, onClick, disabled) => {
//   useEffect(() => {
//     if (disabled || !onClick) return;
//     const shortcut = SHORTCUTS[keyConfig];
//     if (!shortcut) return;
//     const handler = (e) => {
//       const matches = shortcut.plain
//         ? e.key === shortcut.key
//         : e.altKey && e.code === shortcut.code;
//       if (matches) {
//         e.preventDefault();
//         onClick();
//       }
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [keyConfig, onClick, disabled]);
// };

// /** Small muted pill that mirrors the OS-style shortcut hint (e.g. "Alt+S"). */
//  const Kbd = ({ label }) => (
//   <span
//     aria-hidden="true"
//     className="
//       hidden sm:inline-flex items-center
//       px-[5px] py-[1px]
//       font-mono text-[9px] tracking-[0.03em] leading-none
//       rounded-[4px]
//       bg-black/10 text-current/70
//     "
//   >
//     {label}
//   </span>
// );

// /**
//  * BaseButton
//  * Shared visual + a11y primitive for every ERP toolbar action below.
//  * - Icon, label and shortcut are always visible (no hover-only reveal).
//  * - Focus ring only appears for keyboard users (focus-visible), not on click.
//  * - Loading replaces the icon with a spinner but keeps the label in place,
//  *   so the button doesn't jump around while a request is in flight.
//  */
// export const BaseButton = forwardRef(
//   (
//     {
//       icon,
//       label,
//       shortcut,
//       tone,
//       className = "",
//       onClick,
//       disabled = false,
//       loading = false,
//       type = "button",
//       id,
//       "data-erp-role": erpRole,
//     },
//     ref
//   ) => {
//     const title = shortcut ? `${label} (${shortcut})` : label;
//     const toneClasses = tone ? TONES[tone] : "";

//     return (
//       <button
//         id={id}
//         ref={ref}
//         data-erp-role={erpRole}
//         type={type}
//         onClick={onClick}
//         disabled={disabled || loading}
//         aria-label={label}
//         aria-busy={loading}
//         aria-keyshortcuts={shortcut || undefined}
//         title={title}
//         className={`
//           relative inline-flex items-center justify-center
//           gap-2
//           min-h-7 sm:min-h-8
//           px-2.5
//           rounded-xl
//           border
//           cursor-pointer
//           whitespace-nowrap
//           select-none
//           active:scale-[0.96]
//           focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
//           disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
//           ${toneClasses}
//           ${className}
//         `}
//       >
//         <span className="shrink-0 inline-flex items-center">
//           {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
//         </span>
//         <span className="text-[12.5px] font-medium leading-none">{label}</span>
//         {shortcut && !loading && <Kbd label={shortcut} />}
//       </button>
//     );
//   }
// );
// BaseButton.displayName = "BaseButton";

// /**
//  * Thin factory so every action button below is a one-line declaration:
//  * config in, fully-wired component out. Keeps icon/tone/shortcut/label
//  * next to each other instead of duplicated across ten similar components.
//  */
// function createActionButton({ label, icon: Icon, shortcut, tone, keyConfig }) {
//   const Button = forwardRef(({ onClick, disabled, loading, label: labelOverride, tone: toneOverride, className, id, "data-erp-role": erpRole }, ref) => {
//     useButtonShortcut(keyConfig, onClick, disabled);
//     return (
//       <BaseButton
//         ref={ref}
//         id={id}
//         data-erp-role={erpRole}
//         onClick={onClick}
//         disabled={disabled}
//         loading={loading}
//         label={labelOverride || label}
//         shortcut={shortcut}
//         tone={toneOverride || tone}
//         icon={<Icon size={17} />}
//         className={className}
//       />
//     );
//   });
//   Button.displayName = `${label.replace(/\s+/g, "")}Button`;
//   return Button;
// }

// // ── SAVE / ADD ───────────────────────────────────────────────────────────
//  export const AddButton = forwardRef(({ id, onClick, disabled, loading, isAdding = false, compact = false }, ref) => {
//   useButtonShortcut(isAdding ? "save" : "add", onClick, disabled);
//   const iconSize = compact ? 12 : 17;
//   return (
//     <BaseButton
//       ref={ref}
//       id={isAdding ? "save" : (id || "add")}
//       data-erp-role={isAdding ? "save" : undefined}
//       onClick={onClick} disabled={disabled} loading={loading}
//       compact={compact}
//       label={isAdding ? "Save" : "Add"}
//       shortcut={isAdding ? "Alt+S" : "Alt+A"}
//       icon={isAdding ? <Save size={iconSize} /> : <Plus size={iconSize} />}
//       tone="emerald"
//     />
//   );
// });
// AddButton.displayName = "AddButton";
// export const HeaderAddButton = AddButton;

// // ── UPDATE / MODIFY ──────────────────────────────────────────────────────
// export const UpdateButton = ({ onClick, disabled, loading, isEditing = false }) => {
//   useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);
//   return (
//     <BaseButton
//       id={isEditing ? "update" : undefined}
//       data-erp-role={isEditing ? "update" : undefined}
//       onClick={onClick} disabled={disabled} loading={loading}
//       label={isEditing ? "Update" : "Modify"}
//       shortcut={isEditing ? "Alt+S" : "Alt+M"}
//       icon={isEditing ? <Save size={17} /> : <Pencil size={17} />}
//       tone={isEditing ? "emerald" : "blue"}
//     />
//   );
// };

// // ── DISCARD / CANCEL ─────────────────────────────────────────────────────
// export const DiscardButton = ({ onClick, disabled }) => {
//   useButtonShortcut("cancel", onClick, disabled);
//   return (
//     <BaseButton
//       onClick={onClick} disabled={disabled}
//       label="Cancel" shortcut="Esc"
//       icon={<XCircle size={17} />}
//       tone="slate"
//     />
//   );
// };

// // ── EXIT / CLOSE (no shortcut — deliberately outside the Escape/Cancel flow)
// export const CancelButton = ({ onClick }) => (
//   <BaseButton
//     onClick={onClick}
//     label="Exit"
//     icon={<ArrowLeft size={17} />}
//     tone="fuchsia"
//   />
// );

// // ── Remaining single-purpose actions, declared via the factory ──────────
// export const DeleteButton = createActionButton({ label: "Delete", icon: Trash2, shortcut: "Alt+D", tone: "red", keyConfig: "delete" });
// export const PrintButton = createActionButton({ label: "Preview", icon: Printer, shortcut: "Alt+P", tone: "violet", keyConfig: "print" });
// export const DraftButton = createActionButton({ label: "Draft", icon: FileText, shortcut: "Alt+R", tone: "amber", keyConfig: "draft" });
// export const RejectButton = createActionButton({ label: "Reject", icon: Ban, shortcut: "Alt+J", tone: "rose", keyConfig: "reject" });
// export const ApproveButton = createActionButton({ label: "Approve", icon: CheckCircle2, shortcut: "Alt+V", tone: "teal", keyConfig: "approve" });
// export const PostButton = createActionButton({ label: "Post", icon: ClipboardCheck, shortcut: "Alt+O", tone: "indigo", keyConfig: "post" });
// export const ExportButton = createActionButton({ label: "Export", icon: Download, shortcut: "Alt+E", tone: "sky", keyConfig: "export" });
// export const ImportButton = createActionButton({ label: "Import", icon: Upload, shortcut: "Alt+I", tone: "cyan", keyConfig: "import" });
// export const RefreshButton = createActionButton({ label: "Refresh", icon: RefreshCw, shortcut: "Alt+Y", tone: "lime", keyConfig: "refresh" });
// export const AttachButton = createActionButton({ label: "Attach", icon: Paperclip, shortcut: "Alt+T", tone: "zinc", keyConfig: "attach" });
// export const CloneButton = createActionButton({ label: "Duplicate", icon: Copy, shortcut: "Alt+C", tone: "purple", keyConfig: "clone" });
// export const LockButton = createActionButton({ label: "Lock", icon: Lock, shortcut: "Alt+L", tone: "orange", keyConfig: "lock" });
// export const SearchButton = createActionButton({ label: "Search", icon: Search, shortcut: "Alt+F", tone: "gray", keyConfig: "search" });
// export const ResetButton = createActionButton({ label: "Reset", icon: RotateCcw, shortcut: "Alt+R", tone: "slate", keyConfig: "reset" });

import React, { forwardRef, useEffect, useRef } from "react";
import {
  Plus, Printer, Save, Pencil,
  Trash2, ArrowLeft, XCircle, Loader2, FileText, Ban,
  CheckCircle2, ClipboardCheck, Download, Upload,
  RefreshCw, Paperclip, Copy, Lock, Search, RotateCcw,
} from "lucide-react";
// TODO: agar ye file KeyboardShortcuts.jsx jitni hi depth (src/xxx/yyy/) par nahi hai,
// to ye 3 paths us hisaab se adjust karo (yahan src/utils/Shortcuts/... maana hai).
import { useShortcuts } from "../../../utils/Shortcuts/ShortcutsContext";
import { formatCombo } from "../../../utils/Shortcuts/ShortcutRegistry";
import { registerShortcutAction } from "../../../utils/erpShortcuts";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Design tokens
 * ─────────────────────────────────────────────────────────────────────────
 * One place to own each action's color. Every button below just references
 * a `tone` name instead of repeating a bg/border/text/ring string — change
 * the palette here and every button using that tone updates together.
 */
const TONES = {
  emerald: "bg-emerald-100 border-emerald-300 text-emerald-700 focus-visible:ring-emerald-400",
  blue: "bg-blue-100    border-blue-300    text-blue-700    focus-visible:ring-blue-400",
  slate: "bg-slate-100   border-slate-300   text-slate-600   focus-visible:ring-slate-400",
  red: "bg-red-100     border-red-300     text-red-700     focus-visible:ring-red-400",
  violet: "bg-violet-100  border-violet-300  text-violet-700  focus-visible:ring-violet-400",
  amber: "bg-amber-100   border-amber-300   text-amber-700   focus-visible:ring-amber-400",
  rose: "bg-rose-100    border-rose-300    text-rose-700    focus-visible:ring-rose-400",
  teal: "bg-teal-100    border-teal-300    text-teal-700    focus-visible:ring-teal-400",
  indigo: "bg-indigo-100  border-indigo-300  text-indigo-700  focus-visible:ring-indigo-400",
  sky: "bg-sky-100     border-sky-300     text-sky-700     focus-visible:ring-sky-400",
  cyan: "bg-cyan-100    border-cyan-300    text-cyan-700    focus-visible:ring-cyan-400",
  lime: "bg-lime-100    border-lime-300    text-lime-800    focus-visible:ring-lime-400",
  zinc: "bg-zinc-200    border-zinc-300    text-zinc-700    focus-visible:ring-zinc-400",
  purple: "bg-purple-100  border-purple-300  text-purple-700  focus-visible:ring-purple-400",
  orange: "bg-orange-100  border-orange-300  text-orange-700  focus-visible:ring-orange-400",
  gray: "bg-gray-200    border-gray-300    text-gray-700    focus-visible:ring-gray-400",
  fuchsia: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700 focus-visible:ring-fuchsia-400",
};

/**
 * Har button ka shortcut ab yahan HARDCODE nahi hai — Settings ke registry se aata hai
 * (src/shortcuts/shortcutRegistry.js, id wahi hai jo `keyConfig` neeche har button ko diya hai).
 * Isse: (1) Settings mein rebind/disable ho sakta hai, (2) sirf EK global listener chalti hai
 * (erpShortcuts.js), har button apna alag window listener nahi lagata — pehle do listeners
 * (yeh file + erpShortcuts.js) kabhi-kabhi same key ke liye takra jaate the, ab nahi.
 *
 * `id === "cancel"` special case hai: Escape universal convention hai, isliye registry mein
 * nahi, customise nahi hoti, seedha yahin plain listener se handle hoti hai (jaisa pehle tha).
 */
const useButtonShortcut = (id, onClick, disabled) => {
  const { shortcuts } = useShortcuts();
  const entry = id === "cancel" ? null : shortcuts.find((s) => s.id === id);
  const active = id === "cancel" || (entry && entry.enabled);
  const label = id === "cancel" ? "Esc" : entry && entry.enabled ? formatCombo(entry.keys).join("+") : "";

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    if (disabled || !onClickRef.current || !active) return undefined;

    if (id === "cancel") {
      const handler = (e) => {
        if (e.key === "Escape") { e.preventDefault(); onClickRef.current?.(); }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }

    // Dusre saare: central dispatcher ke saath register karo, apna listener mat lagao
    return registerShortcutAction(id, () => onClickRef.current?.());
  }, [id, disabled, active]);

  return label;
};

/** Small muted pill that mirrors the OS-style shortcut hint (e.g. "Alt+S"). */
 const Kbd = ({ label }) => (
  <span
    aria-hidden="true"
    className="
      hidden sm:inline-flex items-center
      px-[5px] py-[1px]
      font-mono text-[9px] tracking-[0.03em] leading-none
      rounded-[4px]
      bg-black/10 text-current/70
    "
  >
    {label}
  </span>
);

/**
 * BaseButton
 * Shared visual + a11y primitive for every ERP toolbar action below.
 * - Icon, label and shortcut are always visible (no hover-only reveal).
 * - Focus ring only appears for keyboard users (focus-visible), not on click.
 * - Loading replaces the icon with a spinner but keeps the label in place,
 *   so the button doesn't jump around while a request is in flight.
 */
export const BaseButton = forwardRef(
  (
    {
      icon,
      label,
      shortcut,
      tone,
      className = "",
      onClick,
      disabled = false,
      loading = false,
      type = "button",
      id,
      "data-erp-role": erpRole,
    },
    ref
  ) => {
    const title = shortcut ? `${label} (${shortcut})` : label;
    const toneClasses = tone ? TONES[tone] : "";

    return (
      <button
        id={id}
        ref={ref}
        data-erp-role={erpRole}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={label}
        aria-busy={loading}
        aria-keyshortcuts={shortcut || undefined}
        title={title}
        className={`
          relative inline-flex items-center justify-center
          gap-2
          min-h-7 sm:min-h-8
          px-2.5
          rounded-xl
          border
          cursor-pointer
          whitespace-nowrap
          select-none
          active:scale-[0.96]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
          disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
          ${toneClasses}
          ${className}
        `}
      >
        <span className="shrink-0 inline-flex items-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
        </span>
        <span className="text-[12.5px] font-medium leading-none">{label}</span>
        {shortcut && !loading && <Kbd label={shortcut} />}
      </button>
    );
  }
);
BaseButton.displayName = "BaseButton";

/**
 * Thin factory so every action button below is a one-line declaration:
 * config in, fully-wired component out. Keeps icon/tone/shortcut/label
 * next to each other instead of duplicated across ten similar components.
 */
function createActionButton({ label, icon: Icon, tone, keyConfig }) {
  const Button = forwardRef(({ onClick, disabled, loading, label: labelOverride, tone: toneOverride, className, id, "data-erp-role": erpRole }, ref) => {
    const shortcut = useButtonShortcut(keyConfig, onClick, disabled);
    return (
      <BaseButton
        ref={ref}
        id={id}
        data-erp-role={erpRole}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        label={labelOverride || label}
        shortcut={shortcut}
        tone={toneOverride || tone}
        icon={<Icon size={17} />}
        className={className}
      />
    );
  });
  Button.displayName = `${label.replace(/\s+/g, "")}Button`;
  return Button;
}

// ── SAVE / ADD ───────────────────────────────────────────────────────────
 export const AddButton = forwardRef(({ id, onClick, disabled, loading, isAdding = false, compact = false }, ref) => {
  const shortcut = useButtonShortcut(isAdding ? "save" : "add", onClick, disabled);
  const iconSize = compact ? 12 : 17;
  return (
    <BaseButton
      ref={ref}
      id={isAdding ? "save" : (id || "add")}
      data-erp-role={isAdding ? "save" : undefined}
      onClick={onClick} disabled={disabled} loading={loading}
      compact={compact}
      label={isAdding ? "Save" : "Add"}
      shortcut={shortcut}
      icon={isAdding ? <Save size={iconSize} /> : <Plus size={iconSize} />}
      tone="emerald"
    />
  );
});
AddButton.displayName = "AddButton";
export const HeaderAddButton = AddButton;

// ── UPDATE / MODIFY ──────────────────────────────────────────────────────
export const UpdateButton = ({ onClick, disabled, loading, isEditing = false }) => {
  const shortcut = useButtonShortcut(isEditing ? "save" : "modify", onClick, disabled);
  return (
    <BaseButton
      id={isEditing ? "update" : undefined}
      data-erp-role={isEditing ? "update" : undefined}
      onClick={onClick} disabled={disabled} loading={loading}
      label={isEditing ? "Update" : "Modify"}
      shortcut={shortcut}
      icon={isEditing ? <Save size={17} /> : <Pencil size={17} />}
      tone={isEditing ? "emerald" : "blue"}
    />
  );
};

// ── DISCARD / CANCEL ─────────────────────────────────────────────────────
export const DiscardButton = ({ onClick, disabled }) => {
  const shortcut = useButtonShortcut("cancel", onClick, disabled);
  return (
    <BaseButton
      onClick={onClick} disabled={disabled}
      label="Cancel" shortcut={shortcut}
      icon={<XCircle size={17} />}
      tone="slate"
    />
  );
};

// ── EXIT / CLOSE (no shortcut — deliberately outside the Escape/Cancel flow)
export const CancelButton = ({ onClick }) => (
  <BaseButton
    onClick={onClick}
    label="Exit"
    icon={<ArrowLeft size={17} />}
    tone="fuchsia"
  />
);

// ── Remaining single-purpose actions, declared via the factory ──────────
export const DeleteButton = createActionButton({ label: "Delete", icon: Trash2, tone: "red", keyConfig: "delete" });
export const PrintButton = createActionButton({ label: "Preview", icon: Printer, tone: "violet", keyConfig: "print" });
export const DraftButton = createActionButton({ label: "Draft", icon: FileText, tone: "amber", keyConfig: "draft" });
export const RejectButton = createActionButton({ label: "Reject", icon: Ban, tone: "rose", keyConfig: "reject" });
export const ApproveButton = createActionButton({ label: "Approve", icon: CheckCircle2, tone: "teal", keyConfig: "approve" });
export const PostButton = createActionButton({ label: "Post", icon: ClipboardCheck, tone: "indigo", keyConfig: "post" });
export const ExportButton = createActionButton({ label: "Export", icon: Download, tone: "sky", keyConfig: "export" });
export const ImportButton = createActionButton({ label: "Import", icon: Upload, tone: "cyan", keyConfig: "import" });
export const RefreshButton = createActionButton({ label: "Refresh", icon: RefreshCw, tone: "lime", keyConfig: "refresh" });
export const AttachButton = createActionButton({ label: "Attach", icon: Paperclip, tone: "zinc", keyConfig: "attach" });
export const CloneButton = createActionButton({ label: "Duplicate", icon: Copy, tone: "purple", keyConfig: "clone" });
export const LockButton = createActionButton({ label: "Lock", icon: Lock, tone: "orange", keyConfig: "lock" });
export const SearchButton = createActionButton({ label: "Search", icon: Search, tone: "gray", keyConfig: "search" });
export const ResetButton = createActionButton({ label: "Reset", icon: RotateCcw, tone: "slate", keyConfig: "reset" });