import Swal from "sweetalert2";

/* ================= BASE CONFIG ================= */

const baseSwal = Swal.mixin({
  confirmButtonColor: "var(--bg-active)",
  cancelButtonColor: "#94a3b8",
  buttonsStyling: true,
  reverseButtons: true,
});

/* ================= TOAST ================= */

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

/* ================= ERROR ================= */

export const alertError = (title, text = "") => {
  return baseSwal.fire({
    icon: "error",
    title,
    text,
  });
};

/* ================= WARNING ================= */

export const alertWarning = (title, text = "") => {
  return baseSwal.fire({
    icon: "warning",
    title,
    text,
  });
};

/* ================= CONFIRM DELETE ================= */

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
