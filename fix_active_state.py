import os
import codecs
import re

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'

active_class = "btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
inactive_class = "btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                # Check if it's a grid page or list page
                # For doctors, doctors.tsx is grid, doctorsList.tsx is list
                # For patients, patients.tsx is grid, patientsList.tsx is list
                
                is_grid_page = False
                
                if 'Grid' in f:
                    is_grid_page = True
                elif f in ['doctors.tsx', 'patients.tsx', 'appointments.tsx', 'specializations.tsx']:
                    is_grid_page = True
                elif 'List' in f:
                    is_grid_page = False
                else:
                    # Let's just guess based on content or leave as is
                    pass
                    
                if "ti-list-tree" not in content and "ti-layout-grid" not in content:
                    continue
                    
                # We need to find the List link and Grid link
                # They look like:
                # <Link to={...} className="...">
                #   <i className="ti ti-list-tree fs-16" />
                # </Link>
                # <Link to={...} className="...">
                #   <i className="ti ti-layout-grid fs-16" />
                # </Link>
                
                def replace_classes(match):
                    link_start = match.group(1)
                    cls = match.group(2)
                    rest = match.group(3)
                    icon = match.group(4)
                    
                    if 'ti-list' in icon:
                        # List icon
                        new_cls = inactive_class if is_grid_page else active_class
                    else:
                        # Grid icon
                        new_cls = active_class if is_grid_page else inactive_class
                        
                    return f'{link_start}className="{new_cls}"{rest}<i className="{icon}"'
                
                regex = re.compile(r'(<Link\s+to=\{[^\}]+\}\s+)className=\"([^\"]+)\"([^>]+>\s*)<i className=\"(ti ti-list-tree[^\"]*|ti ti-layout-grid[^\"]*)\"')
                new_content = regex.sub(replace_classes, content)
                
                if new_content != content:
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    count += 1
                    print(f'Fixed active state in {f} (is_grid_page={is_grid_page})')
            except Exception as e:
                pass

print(f'Done! Fixed {count} files.')
