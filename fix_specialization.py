import codecs

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/specializations/specializations.tsx'
with codecs.open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace parent wrapper
content = content.replace('<div className="text-end d-flex">\r\n              \r\n              <div className="dropdown me-2">', '<div className="text-end d-flex align-items-center gap-2">\r\n              \r\n              <div className="dropdown">')
content = content.replace('<div className="text-end d-flex">\n              \n              <div className="dropdown me-2">', '<div className="text-end d-flex align-items-center gap-2">\n              \n              <div className="dropdown">')

# Replace button
target = '''<Link
                to="#"
                className="btn btn-primary text-white ms-2 fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
              >
                <i className="ti ti-plus me-1" />
                Add New Specialization
              </Link>'''

replacement = '''<Link
                to="#"
                className="btn btn-primary text-white fs-13 btn-md"
                data-bs-toggle="modal"
                data-bs-target="#add_specialization"
              >
                Add New Specialization
                <i className="ti ti-plus ms-2" />
              </Link>'''

content = content.replace(target, replacement).replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))

with codecs.open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
