import os
import codecs
import re

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module'

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                
                # Check if it has a smaller column wrapper and isn't auth module
                if ('<div className="col-lg-10">' in content or '<div className="col-xl-8' in content) and 'auth' not in root:
                    # Replace various column wrappers with col-lg-12
                    new_content = re.sub(r'<div className=\"col-lg-10(?: mx-auto)?\">', '<div className="col-lg-12">', content)
                    new_content = re.sub(r'<div className=\"col-xl-8 col-lg-10 mx-auto\">', '<div className="col-lg-12">', new_content)
                    new_content = re.sub(r'<div className=\"col-md-10 mx-auto\">', '<div className="col-lg-12">', new_content)
                    new_content = re.sub(r'<div className=\"col-lg-8(?: mx-auto)?\">', '<div className="col-lg-12">', new_content)
                    
                    if new_content != content:
                        with codecs.open(filepath, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        count += 1
                        print(f'Fixed {f}')
            except Exception as e:
                pass

print(f'Fixed {count} files.')
