import Swal from "sweetalert2"

// Global SweetAlert configuration
const configuredSwal = Swal.mixin({
  customClass: {
    container: 'swal-z-index-max',
  },
  backdrop: true,
  allowOutsideClick: true,
  allowEscapeKey: true,
  heightAuto: false, // Prevent body scrolling issues
})

export default configuredSwal
