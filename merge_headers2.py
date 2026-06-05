import os
import codecs
import re

directories = [
    'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'
]

files_to_fix = []
for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx'):
                files_to_fix.append(os.path.join(root, file))

def move_sortby_and_fix_icons(filepath):
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Fix "Add New" button icons
    # Find <i className="ti ti-plus me-1" /> followed by text, or text followed by <i className="ti ti-plus ... />
    # Actually, we want to ensure any "Add ..." button has the icon on the right.
    # Let's target the exact strings: <i className="ti ti-plus me-1" /> Add New ... 
    # Or <i className="ti ti-plus me-2" />
    
    # Replace `<i className="ti ti-plus me-1" />\s*([a-zA-Z0-eng ]+)` with `\1 <i className="ti ti-plus ms-2" />`
    # ONLY if it's inside a button or Link.
    # A simple regex for the inner text:
    pattern_icon_left = r'<i className="ti ti-plus me-1"\s*/>\s*([^<]+?)\s*</(Link|button)>'
    content = re.sub(pattern_icon_left, r'\1 <i className="ti ti-plus ms-2" /></\2>', content)

    pattern_icon_left2 = r'<i className="ti ti-plus"\s*/>\s*([^<]+?)\s*</(Link|button)>'
    content = re.sub(pattern_icon_left2, r'\1 <i className="ti ti-plus ms-2" /></\2>', content)
    
    # 2. Merge headers
    # The top header ends at `</div>\s*</div>\s*{/\* End Page Header \*/}` or `</div>\s*</div>`
    # And then we have `div className=" d-flex align-items-center justify-content-between...`
    # Let's find the `table-dropdown` div contents and move it to the `text-end d-flex` div.
    
    # Let's find the Sort By dropdown specifically
    sort_by_pattern = r'(<div className="dropdown">\s*<Link\s+to="#"\s+className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"\s+data-bs-toggle="dropdown"\s*>\s*<span className="me-1">\s*Sort By\s*:\s*</span>\s*Recent\s*</Link>.*?</ul>\s*</div>)'
    
    sort_by_match = re.search(sort_by_pattern, content, flags=re.DOTALL)
    if sort_by_match:
        sort_by_block = sort_by_match.group(1)
        # remove it from its original place
        content = content.replace(sort_by_block, '')
        
        # Now find the top header right container `text-end d-flex`
        # usually: `<div className="text-end d-flex">`
        # We want to insert `sort_by_block` just inside it.
        top_header_end_pattern = r'(<div className="text-end d-flex[^"]*">)'
        if re.search(top_header_end_pattern, content):
            content = re.sub(top_header_end_pattern, r'\1\n              ' + sort_by_block.replace('\\', '\\\\'), content, count=1)

    # 3. If the second header row is now empty or only has an empty `search-set`, remove it
    # But wait, removing `border-bottom` from the top header is also requested by the user, right?
    # "is header ke niche line bhi nhi he grid wale har page pr check karo" -> Oh, wait, the user COMPLAINED that there is NO line below the header in the grid pages!
    # Ah! In the grid pages, the `border-bottom` is MISSING! "is header ke niche line bhi nhi he grid wale har page pr check karo".
    # Wait, in the first screenshot, `Specializations` DOES have a line.
    # And the user said "ye dono header yaha merge kyu nhi hue he" about Specializations, Income, Tickets.
    # And then "or is header ke niche line bhi nhi he grid wale har page pr check karo". So for Grid pages, they want the line back! (which I fixed in fix_grid_headers.py!).
    
    # 4. Remove empty filter rows
    empty_filter_pattern = r'<div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">\s*<div className="d-flex align-items-center gap-2">\s*<div className="search-set mb-3">\s*<div className="d-flex align-items-center flex-wrap gap-2">\s*</div>\s*</div>\s*</div>\s*<div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">\s*</div>\s*</div>'
    content = re.sub(empty_filter_pattern, '', content, flags=re.DOTALL)
    
    empty_filter_pattern2 = r'<div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">\s*<div className="search-set mb-3">\s*<div className="d-flex align-items-center flex-wrap gap-2">\s*</div>\s*</div>\s*<div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">\s*</div>\s*</div>'
    content = re.sub(empty_filter_pattern2, '', content, flags=re.DOTALL)

    if content != original:
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filepath}')

for filepath in files_to_fix:
    try:
        move_sortby_and_fix_icons(filepath)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
