import codecs
import os

files = [
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todo.tsx',
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx'
]

old_buttons = """<ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
              <li>
                <Link
                  to={all_routes.todo}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid" />
                </Link>
              </li>
              <li>
                <Link
                  to={all_routes.todoList}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list-tree" />
                </Link>
              </li>
            </ul>"""

old_buttons_2 = """<ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
              <li>
                <Link
                  to={all_routes.todo}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid" />
                </Link>
              </li>
              <li>
                <Link
                  to={all_routes.todoList}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list-tree" />
                </Link>
              </li>
            </ul>"""

for filepath in files:
    if not os.path.exists(filepath):
        continue
        
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    is_grid = 'todo.tsx' in filepath
    
    new_buttons = f"""<div className="d-flex align-items-center gap-2">
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
            </div>"""

    content = content.replace(old_buttons, new_buttons).replace(old_buttons.replace('\n', '\r\n'), new_buttons.replace('\n', '\r\n'))
    content = content.replace(old_buttons_2, new_buttons).replace(old_buttons_2.replace('\n', '\r\n'), new_buttons.replace('\n', '\r\n'))

    # Fix Create New button
    old_create = """<Link
              to="#"
              className="btn btn-sm btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add_todo"
            >
              <i className="ti ti-circle-plus me-1" />
              Create New
            </Link>"""
    new_create = """<Link
              to="#"
              className="btn btn-primary fs-13 btn-md"
              data-bs-toggle="modal"
              data-bs-target="#add_todo"
            >
              Create New
              <i className="ti ti-circle-plus ms-2" />
            </Link>"""
            
    content = content.replace(old_create, new_create).replace(old_create.replace('\n', '\r\n'), new_create.replace('\n', '\r\n'))
    
    # Fix header line. Currently it is gap-2 pb-3
    # Let's make it gap-2 pb-3 mb-3 border-bottom if it doesn't have border-bottom
    old_header = '<div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3">'
    new_header = '<div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">'
    content = content.replace(old_header, new_header).replace(old_header.replace('\n', '\r\n'), new_header.replace('\n', '\r\n'))

    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed {filepath}')

