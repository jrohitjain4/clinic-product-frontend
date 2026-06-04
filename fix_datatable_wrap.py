import codecs

dt_filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/dataTable/index.tsx'
with codecs.open(dt_filepath, 'r', encoding='utf-8', errors='ignore') as f:
    dt_content = f.read()

# First undo previous wrap
dt_content = dt_content.replace('<div className="card overflow-hidden shadow-none mb-0 border"><div className="card-body p-0">\n    <Table', '<Table')
dt_content = dt_content.replace('/>\n    </div></div>\n  );', '/>\n  );')

# Now do the new wrap that includes table-responsive and solid styling
new_wrap_start = '<div className="card overflow-hidden bg-white shadow-sm border"><div className="card-body p-0"><div className="table-responsive">\n    <Table'
new_wrap_end = '/>\n    </div></div></div>\n  );'

if '<div className="card overflow-hidden bg-white shadow-sm border"' not in dt_content:
    dt_content = dt_content.replace('<Table', new_wrap_start)
    dt_content = dt_content.replace('/>\n  );', new_wrap_end)

with codecs.open(dt_filepath, 'w', encoding='utf-8') as f:
    f.write(dt_content)

print('Datatable index updated.')
