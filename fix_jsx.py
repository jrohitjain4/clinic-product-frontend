import os
import codecs

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages'

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                bad_style1 = "style={ width: '38px', height: '38px', borderRadius: '8px' }"
                good_style1 = "style={{ width: '38px', height: '38px', borderRadius: '8px' }}"
                
                if bad_style1 in content:
                    new_content = content.replace(bad_style1, good_style1)
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    count += 1
            except Exception as e:
                pass

print(f'Fixed JSX in {count} files.')
