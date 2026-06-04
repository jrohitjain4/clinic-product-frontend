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
                
                # Check if it has stats cards (like col-md-3, col-lg-3, col-xl-3)
                if 'col-lg-3' in content or 'col-md-3' in content or 'col-xl-3' in content or 'col-sm-6' in content:
                    
                    # We want to replace <div className="row"> with <div className="row g-2">
                    # and <div className="row mb-3"> with <div className="row g-2 mb-3">
                    # But we must be careful not to match rows that already have g-2 or g-something.
                    
                    def add_g2(match):
                        class_str = match.group(1)
                        if 'g-' not in class_str:
                            return f'<div className="{class_str.replace("row", "row g-2", 1)}">'
                        return match.group(0)
                        
                    new_content = re.sub(r'<div className=\"([^\"]*row[^\"]*)\">', add_g2, content)
                    
                    if new_content != content:
                        with codecs.open(filepath, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        count += 1
            except Exception as e:
                pass

print(f'Added g-2 to rows in {count} files.')
