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
                
                # Replace only exact match missing border
                target = '<div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">'
                replacement = '<div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">'
                
                if target in content:
                    content = content.replace(target, replacement)
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.write(content)
                    count += 1
                    print(f'Added border in {f}')
            except Exception as e:
                pass

print(f'Done! Added border in {count} files.')
