import React, { useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

// Reads a File as a base64 data URL. Resolves null on failure.
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// Reusable image upload control used by the Student / Club / Community
// edit modals. Stores the result as a base64 data URL on the parent form.
//
// Props:
//   label      — section label (e.g. "Profile Photo")
//   value      — current data URL (or empty string)
//   onChange   — (newValue: string) => void   ("" clears)
//   aspect     — "banner" (16:5) | "square" (default)
const ImageUploadField = ({ label, value, onChange, aspect = 'square' }) => {
  const inputRef = useRef(null);
  const previewClass = aspect === 'banner'
    ? 'w-full h-24 rounded-lg'
    : 'w-20 h-20 rounded-xl';

  const pickFile = async (file) => {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
      alert('Only JPG, PNG, or WebP images are supported.');
      return;
    }
    // Soft cap — server JSON limit is 10mb, but base64 inflates ~33%, so cap raw at ~6mb.
    if (file.size > 6 * 1024 * 1024) {
      alert('Image is too large. Please pick one under 6 MB.');
      return;
    }
    const dataUrl = await fileToBase64(file);
    if (dataUrl) onChange(dataUrl);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={label}
            className={`${previewClass} object-cover border border-white/10 bg-zinc-800`}
          />
        ) : (
          <div className={`${previewClass} border border-dashed border-white/10 bg-zinc-900/50 flex items-center justify-center text-gray-600`}>
            <ImageIcon size={20} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <UploadCloud size={12} />
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 transition-colors"
            >
              <X size={12} />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
