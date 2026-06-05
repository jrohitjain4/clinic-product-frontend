import codecs
import re

files = {
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/patients/patients.tsx': 'list',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/patients-grid/patientsGrid.tsx': 'grid'
}

for filepath, view_type in files.items():
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'<div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center me-2">.*?</Link>\s*</div>'
    
    list_class = 'btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center' if view_type == 'list' else 'btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center'
    grid_class = 'btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center' if view_type == 'grid' else 'btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center'

    new_ui = f'''
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={{all_routes.patients}}
                  className="{list_class}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={{all_routes.patientsGrid}}
                  className="{grid_class}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
'''
    new_content = re.sub(pattern, new_ui.strip(), content, flags=re.DOTALL)
    
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Updated {filepath}')
