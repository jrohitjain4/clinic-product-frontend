import os
import re
import codecs

# 1. Fix DataTable globally
dt_filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/dataTable/index.tsx'
with codecs.open(dt_filepath, 'r', encoding='utf-8', errors='ignore') as f:
    dt_content = f.read()

if 'card overflow-hidden shadow-none mb-0 border' not in dt_content:
    dt_content = dt_content.replace('    <Table', '    <div className="card overflow-hidden shadow-none mb-0 border"><div className="card-body p-0">\n    <Table')
    dt_content = dt_content.replace('    />\n  );', '    />\n    </div></div>\n  );')
    with codecs.open(dt_filepath, 'w', encoding='utf-8') as f:
        f.write(dt_content)

# 2. Fix 3-dot dropdown globally
base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module'
new_class = 'avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent'

def replace_dots(match):
    before_class = match.group(1)
    class_name = match.group(2)
    after_class = match.group(3)
    
    # We replace whatever the class was with our new class
    return f'{before_class}className="{new_class}"{after_class}'

# Pattern matches: (<Link or <button ... )className="ANYTHING"( ... data-bs-toggle="dropdown" ... <i className="ti ti-dots-vertical")
pattern = r'(<(?:Link|button)[^>]*?)className=\"[^\"]*\"([^>]*?data-bs-toggle=\"dropdown\"[^>]*?>\s*<i className=\"ti ti-dots-vertical\")'

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                if 'ti-dots-vertical' in content and 'data-bs-toggle="dropdown"' in content:
                    new_content, n = re.subn(pattern, replace_dots, content, flags=re.DOTALL)
                    if n > 0:
                        with codecs.open(filepath, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        count += n
            except Exception as e:
                pass

# Clean up patients.tsx if we accidentally added double borders
patients_filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/patients/patients.tsx'
with codecs.open(patients_filepath, 'r', encoding='utf-8', errors='ignore') as f:
    p_content = f.read()

# Since we globally wrapped datatable, we must REMOVE the manual wrap in patients.tsx
p_content = p_content.replace('<div className="card overflow-hidden"><div className="card-body p-0"><div className="table-responsive">', '<div className="table-responsive">')
p_content = p_content.replace('</div></div></div>\n          )}', '</div>\n          )}')

with codecs.open(patients_filepath, 'w', encoding='utf-8') as f:
    f.write(p_content)

print(f'Fixed globally! Replaced 3-dots in {count} places.')
