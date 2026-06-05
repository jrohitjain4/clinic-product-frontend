import os
import codecs
import re

directories = [
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/hrm-modules'
]

files_to_fix = []
for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') and ('grid' in file.lower() or file.lower() in ['patients.tsx', 'doctors.tsx', 'staffs.tsx']):
                files_to_fix.append(os.path.join(root, file))

for filepath in files_to_fix:
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Fix header border
    content = content.replace('className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-4"', 'className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom"')
    
    # Also patients.tsx might have a different nav button class, let's check.
    if 'patients' in filepath.lower() or 'staff' in filepath.lower():
        pattern = r'<div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center me-2">.*?<i className="ti ti-(?:layout-grid|list)(?:-tree)? fs-14(?: text-(?:dark|body))?" />\s*(?:</span>|</Link>)\s*</div>'
        
        view_type = 'grid' if 'grid' in filepath.lower() else 'list'
        is_staff = 'staff' in filepath.lower()
        
        list_route = '{all_routes.staffs}' if is_staff else '{all_routes.patients}'
        grid_route = '{all_routes.staffGrid}' if is_staff else '{all_routes.patientsGrid}'
        
        list_class = 'btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center' if view_type == 'list' else 'btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center'
        grid_class = 'btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center' if view_type == 'grid' else 'btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center'

        new_ui = f'''
              <div className="d-flex align-items-center gap-2 me-2">
                <Link
                  to={list_route}
                  className="{list_class}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={grid_route}
                  className="{grid_class}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
'''
        content = re.sub(pattern, new_ui.strip(), content, flags=re.DOTALL)
        
    if content != original:
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filepath}')
