import codecs
import re

files = [
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/doctor-profile-upload/DoctorProfileUpload.tsx',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/patient-profile-upload/PatientProfileUpload.tsx',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/staff-profile-upload/StaffProfileUpload.tsx'
]

new_ui = '''
    <div className="position-relative d-inline-block ms-4 mb-2">
      <div className="avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 p-0" style={{ border: '3px solid #fff', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
        <img
          src={displaySrc}
          alt="Profile"
          className="position-relative z-n1 w-100 h-100 object-fit-cover"
          style={{ objectFit: "cover" }}
        />
        {uploading && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 z-1"
          >
            <span className="spinner-border spinner-border-sm text-white" />
          </div>
        )}
      </div>
      
      <div 
        className="position-absolute z-3 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
        style={{
          bottom: '5px', 
          right: '5px', 
          width: '32px', 
          height: '32px', 
          backgroundColor: '#6366f1',
          color: '#fff', 
          border: '2px solid #fff',
          cursor: 'pointer'
        }}
      >
        <i className="ti ti-camera fs-16" />
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
'''

for filepath in files:
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try matching regex
    old_block_pattern = r'<div>\s*<div className="drag-upload-btn.*?\{error && <p className="text-danger fs-12 ms-4 mb-0\">\{error\}</p>\}\s*</div>'
    
    new_content = re.sub(old_block_pattern, new_ui.strip(), content, flags=re.DOTALL)
    
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'Updated {filepath}')
