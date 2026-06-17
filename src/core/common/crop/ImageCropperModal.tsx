import React, { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import type { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspect?: number;
  title?: string;
  fileName?: string;
}

// Helper to center the initial crop overlay based on aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspect,
  title = "Crop Image",
  fileName = "cropped-image.jpg"
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  if (!isOpen) return null;

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect));
    } else {
      // Free aspect crop, initial bounding box at 80% width/height centered
      setCrop({
        unit: "%",
        x: 10,
        y: 10,
        width: 80,
        height: 80
      });
    }
  };

  const handleCropSave = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      alert("Please select a crop area first.");
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Failed to get 2d context for canvas cropping");
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set crop canvas size to high resolution cropped dimensions
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    // Smooth image rendering on canvas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Canvas crop returned empty blob");
          return;
        }
        const file = new File([blob], fileName, { type: "image/jpeg" });
        onCropComplete(file);
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div
      className="modal fade show d-block"
      style={{
        zIndex: 10050,
        backgroundColor: "rgba(15,23,42,0.75)",
        backdropFilter: "blur(8px)",
        overflowY: "auto",
        padding: "20px 0"
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "550px" }}>
        <div
          className="modal-content border-0"
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 15px 40px rgba(0,0,0,0.2)"
          }}
        >
          {/* Header */}
          <div
            className="modal-header d-flex align-items-center justify-content-between py-3 px-4"
            style={{
              background: "linear-gradient(135deg, #2e37a4, #1e2896)",
              borderBottom: "none"
            }}
          >
            <h5 className="modal-title fw-bold text-white mb-0" style={{ fontSize: "16px" }}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
              style={{
                filter: "none",
                background: "none",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer"
              }}
            >
              <i className="ti ti-x" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4 text-center bg-light d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "300px" }}>
            <div className="img-crop-container bg-dark rounded overflow-hidden p-2 d-flex align-items-center justify-content-center" style={{ maxWidth: "100%", maxHeight: "400px" }}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop source"
                  style={{ maxHeight: "350px", maxWidth: "100%", objectFit: "contain" }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            <p className="text-muted fs-12 mt-3 mb-0">
              Drag the handles or select a region to crop.
            </p>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top px-4 py-3 bg-light d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
              onClick={handleCropSave}
            >
              <i className="ti ti-crop" /> Crop & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
