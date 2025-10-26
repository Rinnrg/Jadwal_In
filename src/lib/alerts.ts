import Swal from "./sweetalert-config"

// Confirmation dialog
export async function confirmAction(
  title: string, 
  text: string, 
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant: "default" | "destructive" = "default"
): Promise<boolean> {
  const confirmColor = variant === "destructive" ? "#ef4444" : "#3b82f6"
  
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: confirmColor,
    cancelButtonColor: "#6b7280",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  })

  return result.isConfirmed
}

// Success toast
export function showSuccess(message: string) {
  Swal.fire({
    icon: "success",
    title: "Berhasil!",
    text: message,
    timer: 3000,
    showConfirmButton: false,
    toast: true,
    position: "top-end",
  })
}

// Error alert
export function showError(message: string) {
  Swal.fire({
    icon: "error",
    title: "Terjadi Kesalahan",
    text: message,
    confirmButtonText: "OK",
  })
}

// Loading alert
export function showLoading(message = "Memproses...") {
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    },
  })
}

// Close loading
export function closeLoading() {
  Swal.close()
}
