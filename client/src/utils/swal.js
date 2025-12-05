import Swal from 'sweetalert2'

export async function confirm(title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel') {
  const result = await Swal.fire({
    title: title || 'Are you sure?',
    text: text || '',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText,
  })
  return !!result.isConfirmed
}

export function success(title, text) {
  return Swal.fire({
    icon: 'success',
    title: title || 'Done',
    text: text || '',
  })
}

export function error(title, text) {
  return Swal.fire({
    icon: 'error',
    title: title || 'Error',
    text: text || '',
  })
}

export async function inputPrompt(title, text, inputPlaceholder = '') {
  const result = await Swal.fire({
    title: title || 'Confirm',
    text: text || '',
    input: 'text',
    inputPlaceholder,
    showCancelButton: true,
  })
  if (result.isConfirmed) return result.value
  return null
}

export async function inputTextarea(title, html, inputPlaceholder = '', inputValue = '') {
  const result = await Swal.fire({
    title: title || 'Message',
    html: html || '',
    input: 'textarea',
    inputPlaceholder,
    inputValue,
    showCancelButton: true,
    confirmButtonText: 'Send',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#6b7280',
    width: '600px',
    preConfirm: (value) => {
      if (!value || !value.trim()) {
        Swal.showValidationMessage('Please enter a message');
        return false;
      }
      return value;
    }
  })
  if (result.isConfirmed) return result.value
  return null
}

export default { confirm, success, error }
