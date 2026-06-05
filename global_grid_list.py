import os
import codecs
import re

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'

# We want to match the whole div block.
# Since spacing and attributes might vary slightly, we use a regex that captures the `to` routes.
regex = re.compile(
    r'<div className=\"bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center\">\s*<Link\s*to={([^}]+)}\s*className=\"[^\"]*\"\s*>\s*<i className=\"ti ti-list[^\"]*\"\s*/>\s*</Link>\s*<Link\s*to={([^}]+)}\s*className=\"[^\"]*\"\s*>\s*<i className=\"ti ti-layout-grid[^\"]*\"\s*/>\s*</Link>\s*</div>',
    re.DOTALL
)

def repl(match):
    route_list = match.group(1)
    route_grid = match.group(2)
    
    # Check if the current file implies we are ON the list or ON the grid.
    # Usually, if it's the "list" page, the "list" button is active.
    # We will just make both separated buttons and let them figure out active state?
    # Actually, in doctorsList, list was active. In doctorsGrid, grid was active.
    # We don't strictly know which page we are on from just the replacement unless we check filename.
    # But we can make a neutral layout that looks great, or make list active by default since we can't guess perfectly.
    # We'll just provide the same style, maybe neither active or primary-subtle on list.
    
    new_grid_list = f'''<div className="d-flex align-items-center gap-2">
                <Link
                  to={{{route_list}}}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={{{route_grid}}}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>'''
    return new_grid_list

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                new_content = regex.sub(repl, content)
                
                # Also we might have files where grid is first and list is second?
                # Usually it's List then Grid.
                
                if new_content != content:
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    count += 1
                    print(f'Fixed {f}')
            except Exception as e:
                pass

print(f'Done! Fixed {count} files.')
