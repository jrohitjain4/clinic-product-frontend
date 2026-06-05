import { useRef, useState } from "react";
import { apiUrl, resolveMediaUrl } from "../../config/api";

interface DoctorProfileUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  fallbackSrc?: string;
}

const DoctorProfileUpload = ({
  value,
  onChange,
  fallbackSrc = "assets/img/doctors/doctor-01.jpg",
}: DoctorProfileUploadProps) => {
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

      const res = await fetch(apiUrl("/api/uploads/doctor-profile"), {
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
    <div className="position-relative d-inline-block ms-4 mb-2 profile-upload-wrapper">
      <div className="avatar avatar-xxl rounded-circle bg-light text-primary position-relative overflow-hidden z-1 p-0 d-flex align-items-center justify-content-center" style={{ border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
        {value ? (
          <>
            <img
              src={resolveMediaUrl(value)}
              alt="Profile"
              className="position-relative z-n1 w-100 h-100 object-fit-cover"
              style={{ objectFit: "cover" }}
            />
            <div className="upload-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 opacity-0 transition-all">
               <i className="ti ti-camera fs-24 text-white" />
            </div>
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center w-100 h-100" style={{ backgroundColor: "#f3f4f6" }}>
            <i className="ti ti-camera-plus" style={{ fontSize: "36px", color: "#6366f1" }} />
          </div>
        )}
        
        {uploading && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 z-1"
          >
            <span className="spinner-border spinner-border-sm text-white" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="position-absolute top-0 start-0 w-100 h-100 opacity-0 z-4"
        style={{ cursor: 'pointer' }}
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error && <p className="text-danger fs-12 mt-2 position-absolute w-100 text-center mb-0">{error}</p>}
    </div>
  );
};

export default DoctorProfileUpload;
