import os
import codecs
import re

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'

def extract_and_move_filter(content):
    # Find the filter button
    filter_start_str = '<Link\n                  to="#"\n                  className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"\n                  data-bs-toggle="dropdown"\n                  data-bs-auto-close="outside"\n                >\n                  <i className="ti ti-filter text-gray-5 me-1" />\n                  Filters\n                </Link>'
    
    # We need to find the <div className="dropdown me-2"> that encloses this.
    # It's usually right before it.
    idx = content.find('Filters\n                </Link>')
    if idx == -1:
        # Try a more relaxed search
        idx = content.find('<i className="ti ti-filter')
        if idx == -1:
            return content
            
    # Simple stack-based parser to extract the entire dropdown block
    # Start looking for `<div className="dropdown me-2">` before the filter link
    dropdown_start = content.rfind('<div className="dropdown', 0, idx)
    if dropdown_start == -1:
        return content
        
    # Find matching closing div
    stack = 0
    i = dropdown_start
    while i < len(content):
        if content[i:i+4] == '<div':
            stack += 1
        elif content[i:i+5] == '</div':
            stack -= 1
            if stack == 0:
                dropdown_end = i + 6
                break
        i += 1
        
    if stack != 0:
        return content
        
    filter_block = content[dropdown_start:dropdown_end]
    
    # Remove it from original location
    new_content = content[:dropdown_start] + content[dropdown_end:]
    
    # Clean up empty table-dropdown wrapper if it's now empty
    empty_wrapper = '<div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">\n            </div>'
    new_content = new_content.replace(empty_wrapper, '')
    
    # Now, find where to insert it!
    # We want to insert it in the top row, right before the "New XXX" button.
    # The New XXX button usually looks like <Link to={all_routes...} className="btn btn-primary ...">
    # Let's find "New "
    new_btn_idx = new_content.find('New ')
    if new_btn_idx == -1:
        return content
        
    # Find the <Link tag enclosing it
    link_start = new_content.rfind('<Link', 0, new_btn_idx)
    if link_start != -1:
        # Insert before link_start
        final_content = new_content[:link_start] + filter_block + '\n              ' + new_content[link_start:]
        return final_content
        
    return content

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                original_content = content
                
                # 1. Swap icon and text for New buttons
                def swap_icon(match):
                    icon = match.group(1).replace('me-1', 'ms-2').replace('me-2', 'ms-2')
                    text = match.group(2)
                    return f'{text}\n{icon}'
                    
                content = re.sub(r'(<i className=\"ti ti-plus[^\"]*\"[^>]*>\s*</i>)\s+(New [a-zA-Z]+)', swap_icon, content, flags=re.DOTALL)
                
                # 2. Extract and Move filter
                content = extract_and_move_filter(content)
                
                if content != original_content:
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                    count += 1
                    print(f'Fixed {f}')
            except Exception as e:
                pass

print(f'Done! Fixed {count} files.')
