Cloudinary setup (client)
=========================

This project supports uploading images to Cloudinary from the client using an unsigned upload preset.

1) Create a Cloudinary account at https://cloudinary.com

2) In the Cloudinary dashboard create an "Upload Preset" and set it to unsigned (or configure according to your security needs).

3) In the client (Vite) project, set the following environment variables. Create a `.env` or `.env.local` in the `client` folder (do NOT commit secrets to Git):

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

4) Restart the Vite dev server after changing env vars.

5) The upload helper used is `client/src/utils/cloudinary.js` and the report form `client/src/components/user/Report-Item.jsx` will upload the selected image before creating the item. The server expects `imageUrl` in the POST body for `/items` and will store it in the database.

Security note
-------------
Unsigned presets are convenient for client-side uploads but are less secure. For production consider uploading via a signed endpoint on the server (use Cloudinary SDK with API key/secret on the server) or restrict your preset with allowed formats, size limits and other restrictions.
