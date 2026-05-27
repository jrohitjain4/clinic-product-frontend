import { useRef, useState } from "react";
import { apiUrl, resolveMediaUrl } from "../../config/api";

interface PatientProfileUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  fallbackSrc?: string;
}

const PatientProfileUpload = ({
  value,
  onChange,
  fallbackSrc = "assets/img/users/user-08.jpg",
}: PatientProfileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySrc = value ? resolveMediaUrl(value) : resolveMediaUrl(fallbackSrc);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await fetch(apiUrl("/api/uploads/patient-profile"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
        <img
          src={displaySrc}
          alt="Profile"
          className="position-relative z-n1 w-100 h-100"
          style={{ objectFit: "cover" }}
        />
        {uploading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 z-1">
            <span className="spinner-border spinner-border-sm text-white" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="form-control image-sign position-absolute top-0 start-0 w-100 h-100 opacity-0 z-2"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="position-absolute bottom-0 end-0 start-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-1 pointer-events-none">
          <i className="ti ti-photo fs-14 text-white" />
        </div>
      </div>
      {error && <p className="text-danger fs-12 ms-4 mb-0">{error}</p>}
    </div>
  );
};

export default PatientProfileUpload;
