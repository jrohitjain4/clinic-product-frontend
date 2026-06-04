import codecs
import re

new_class = 'className="avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent"'

# Fix patientsGrid.tsx
filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/patients-grid/patientsGrid.tsx'
with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

content = re.sub(r'className="btn btn-link p-0 shadow-sm fs-14 border rounded-2"', new_class, content)
content = re.sub(r'className="avatar avatar-xs border border-primary text-primary rounded-2 bg-transparent"', new_class, content)

with codecs.open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix patients.tsx
filepath_patients = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/patients/patients.tsx'
with codecs.open(filepath_patients, 'r', encoding='utf-8', errors='ignore') as f:
    content_patients = f.read()

content_patients = re.sub(r'className="avatar avatar-xs border border-primary text-primary rounded-2 bg-transparent"', new_class, content_patients)

with codecs.open(filepath_patients, 'w', encoding='utf-8') as f:
    f.write(content_patients)

# Fix doctorsGrid.tsx
filepath_doc = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/doctors/doctorsGrid.tsx'
with codecs.open(filepath_doc, 'r', encoding='utf-8', errors='ignore') as f:
    content_doc = f.read()

content_doc = re.sub(r'className="avatar avatar-xs border border-primary text-primary rounded-2 bg-transparent"', new_class, content_doc)

with codecs.open(filepath_doc, 'w', encoding='utf-8') as f:
    f.write(content_doc)

print('Updated 3-dot classes in all grids')
