// Small helper to upload images to Cloudinary using unsigned upload preset.
// Expects the following Vite env variables to be set in the client:
// VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadToCloudinary(file) {
  if (!file) return '';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your client env.');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json && json.error && json.error.message ? json.error.message : 'Cloudinary upload failed';
    throw new Error(msg);
  }

  return json.secure_url || json.url || '';
}
