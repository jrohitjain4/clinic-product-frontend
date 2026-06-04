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
                
                if 'SearchInput' in content:
                    # Regex to find <div class="search-input"> or <div class="table-search ..."> containing SearchInput
                    # We can simply find <div className="table-search.*?</div>\s*</div>\s*</div>
                    # Actually, let's just use re.sub on <div className="search-input">\s*<SearchInput[^>]*/>\s*</div>
                    new_content = re.sub(r'<div className=\"search-input\">\s*<SearchInput[^>]*/>\s*</div>', '', content, flags=re.DOTALL)
                    new_content = re.sub(r'<div className=\"table-search[^\"]*\">\s*</div>', '', new_content, flags=re.DOTALL)
                    
                    # Some files might have just <SearchInput ... /> wrapped in other things
                    # Like in appointments.tsx:
                    # <div className="search-input">
                    #   <SearchInput value={searchText} onChange={setSearchText} />
                    # </div>
                    
                    if new_content != content:
                        with codecs.open(filepath, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        count += 1
                        print(f'Fixed {f}')
            except Exception as e:
                pass

print(f'Removed search input from {count} files.')
