import codecs
import re

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx'

with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

pattern = r'<div>\s*\{\/\*\s*table list start\s*\*\/\}\s*<div className="table-responsive table-nowrap">\s*<table className="table border mb-0">'

replace_str = """<div className="card">
            <div className="card-body p-0">
            {/* table list start */}
            <div className="table-responsive table-nowrap">
              <table className="table table-hover mb-0">"""

if re.search(pattern, content):
    new_content = re.sub(pattern, replace_str, content)
    
    end_pattern = r'</table>\s*</div>\s*</div>'
    replace_end = """</table>
            </div>
            </div>
          </div>"""
    
    new_content = re.sub(end_pattern, replace_end, new_content, count=1)
    
    with codecs.open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully added card wrapper for border")
else:
    print("Pattern not found!")
