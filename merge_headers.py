import os
import codecs
import re

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                # Check if it has the table-dropdown
                if 'table-dropdown' in content and 'text-end d-flex' in content:
                    
                    # Boundary regex:
                    # We want to match from the end of the text-end block to the start of the table-dropdown block.
                    # Since we want them merged, we can replace:
                    # </div> (closes text-end)
                    # </div> (closes header row)
                    # {/* End Page Header */}
                    # <div className=" d-flex ... row-gap-3">
                    # <div className="search-set mb-3"> ... </div> (this might be empty or have search input, but we removed it)
                    # <div className="d-flex table-dropdown ...">
                    
                    # Let's write a regex that grabs:
                    # </div>\s*</div>\s*(?:<!--.*?-->|\{/\*.*?\*/\})?\s*<div className=\"\s*d-flex align-items-center justify-content-between flex-wrap row-gap-3\">\s*<div className=\"search-set mb-3\">\s*<div className=\"d-flex align-items-center flex-wrap gap-2\">\s*</div>\s*</div>\s*(<div className=\"d-flex table-dropdown)
                    
                    # Alternatively, since we want to move table-dropdown up, we can find the `table-dropdown` block and move it.
                    # But it's easier to just strip the boundary!
                    
                    boundary_regex = re.compile(
                        r'(<div className=\"text-end d-flex[^\"]*\">.*?)\s*</div>\s*</div>\s*(?:\{/\* End Page Header \*/\})?\s*<div className=\"\s*d-flex align-items-center justify-content-between flex-wrap row-gap-3\">\s*<div className=\"search-set[^\"]*\">\s*<div className=\"d-flex[^\"]*\">\s*</div>\s*</div>\s*(<div className=\"d-flex table-dropdown)',
                        re.DOTALL
                    )
                    
                    def repl(match):
                        # match.group(1) is the <div className="text-end d-flex">...
                        # We want to append match.group(2) which is `<div className="d-flex table-dropdown`
                        # But wait, if we merge them, the table-dropdown will be INSIDE text-end? Yes, that's what the user wants! They want them in the same row.
                        # Wait, we need to CLOSE the text-end div AFTER the table-dropdown.
                        # If we just replace the boundary with a space, the table-dropdown becomes part of the `text-end d-flex` container!
                        # BUT wait, the `text-end d-flex` container has a closing `</div>`. We removed it in the regex! So now the `table-dropdown` is INSIDE `text-end d-flex`.
                        # But what about the closing tags at the very end of `table-dropdown`?
                        # The original structure had:
                        # </div> (closes text-end) -> WE REMOVED THIS
                        # </div> (closes header row) -> WE MOVED THIS
                        # <div class="row-gap-3"> -> WE REMOVED THIS
                        #   ... empty search ... -> WE REMOVED THIS
                        #   <div class="table-dropdown">...</div> -> NOW INSIDE text-end!
                        # </div> (closes row-gap-3) -> THIS IS STILL THERE! It will now close the header row!
                        # PERFECT! This matches the tag counts exactly!
                        
                        return f"{match.group(1)}\n{match.group(2)}"
                        
                    new_content = boundary_regex.sub(repl, content)
                    
                    # Another possible boundary if search-set is completely missing:
                    boundary_regex2 = re.compile(
                        r'(<div className=\"text-end d-flex[^\"]*\">.*?)\s*</div>\s*</div>\s*(?:\{/\* End Page Header \*/\})?\s*<div className=\"\s*d-flex align-items-center justify-content-between flex-wrap row-gap-3\">\s*(<div className=\"d-flex table-dropdown)',
                        re.DOTALL
                    )
                    new_content = boundary_regex2.sub(repl, new_content)
                    
                    if new_content != content:
                        with codecs.open(filepath, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        count += 1
                        print(f'Fixed {f}')
            except Exception as e:
                pass

print(f'Merged headers in {count} files.')
