import os
import codecs

files = [
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todo.tsx',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx'
]

for filepath in files:
    if not os.path.exists(filepath):
        continue
    
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    is_grid = 'todo.tsx' in filepath
    title = 'Todo Grid' if is_grid else 'Todo List'
    
    # We will find the Page Header block
    # from: {/* Page Header */}
    # to: <div className="card overflow-hidden">  OR something similar
    
    start_marker = '{/* Page Header */}'
    end_marker = '<div className="card overflow-hidden">' if not is_grid else '          <div className="row">'
    
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    if start_idx != -1 and end_idx != -1:
        new_header = f"""{{/* Start Page Header */}}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                {title}
              </h4>
            </div>
            <div className="text-end d-flex align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={{all_routes.todoList}}
                  className="btn btn-icon btn-sm {'bg-white text-dark border' if is_grid else 'bg-primary-subtle text-primary border border-primary'} d-flex align-items-center justify-content-center"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={{all_routes.todo}}
                  className="btn btn-icon btn-sm {'bg-primary-subtle text-primary border border-primary' if is_grid else 'bg-white text-dark border'} d-flex align-items-center justify-content-center"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>
              <Link
                to="#"
                className="btn btn-primary fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_todo"
              >
                Create New
                <i className="ti ti-plus ms-2" />
              </Link>
            </div>
          </div>
          {{/* End Page Header */}}
"""
        # Note: I replaced 'ti-circle-plus' with 'ti-plus' to exactly match New Doctor
        content = content[:start_idx] + new_header + content[end_idx:]
        
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed layout in {filepath}')

