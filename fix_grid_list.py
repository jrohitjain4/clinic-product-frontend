import codecs

def update_file(filepath):
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add gap-2 and align-items-center to text-end d-flex
    content = content.replace('<div className="text-end d-flex">', '<div className="text-end d-flex align-items-center gap-2">')
    
    # Replace the single block grid/list with separated grid/list
    old_grid_list = '''<div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  to={all_routes.doctorsList}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div>'''
              
    new_grid_list = '''<div className="d-flex align-items-center gap-2">
                <Link
                  to={all_routes.doctorsList}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary active d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={all_routes.doctors}
                  className="btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                >
                  <i className="ti ti-layout-grid fs-16" />
                </Link>
              </div>'''

    content = content.replace(old_grid_list, new_grid_list).replace(old_grid_list.replace('\n', '\r\n'), new_grid_list.replace('\n', '\r\n'))
    
    # Remove me-1, me-2 since we have gap-2
    content = content.replace('<div className="dropdown me-1">', '<div className="dropdown">')
    content = content.replace('<div className="dropdown me-2">', '<div className="dropdown">')
    content = content.replace('btn-primary ms-2 fs-13 btn-md', 'btn-primary fs-13 btn-md')
    
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/doctors-list/doctorsList.tsx')
update_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/doctors/doctorsGrid.tsx')
