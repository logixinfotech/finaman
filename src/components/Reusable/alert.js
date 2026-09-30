import Swal from "sweetalert2";

/* ================= BASE CONFIG ================= */

const baseSwal = Swal.mixin({
  confirmButtonColor: "var(--bg-active)",
  cancelButtonColor: "#94a3b8",
  buttonsStyling: true,
  reverseButtons: true,
}); 


export const showToast = ({
  icon = "success",
  title = "",
  timer = 2500,
}) => {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    customClass: {
      popup: "erp-toast-popup",
      title: "erp-toast-title",
      timerProgressBar: "erp-toast-progress",
    },
    didOpen: (toastEl) => {
      toastEl.addEventListener("mouseenter", Swal.stopTimer);
      toastEl.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });
};
/* ================= SUCCESS ================= */

export const alertSuccess = (title, text = "") => {
  return baseSwal.fire({
    icon: "success",
    title,
    text,
  });
};
 

export const alertError = (title, text = "") => {
  return baseSwal.fire({
    icon: "error",
    title,
    text,
  });
}; 

export const alertWarning = (title, text = "") => {
  return baseSwal.fire({
    icon: "warning",
    title,
    text,
  });
}; 

export const confirmDelete = async ({
  title = "Are you sure?",
  text = "This action cannot be undone",
  confirmText = "Yes, delete",
}) => {
  const res = await baseSwal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
  });

  return res.isConfirmed;
};

/* ================= CONFIRM SAVE / UPDATE ================= */

export const confirmSave = async ({
  title = "Save changes?",
  text = "",
  confirmText = "Save",
}) => {
  const res = await baseSwal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
  });

  return res.isConfirmed;
};
/* ================= CONFIRM DISCARD (For Dirty Check) ================= */

export const confirmWarning = async ({
  title = "Unsaved Changes",
  text = "You have modified the data. Do you really want to discard these changes?",
  confirmButtonText = "Yes, Discard",
  cancelButtonText = "No, Stay"
}) => {
  const res = await baseSwal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: "#ef4444", // Red color for 'Discard' to show it's a destructive action
    cancelButtonColor: "#94a3b8",
  });

  return res.isConfirmed;
};