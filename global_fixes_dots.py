import os
import codecs

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module'
new_class = 'avatar avatar-xs border border-primary text-primary rounded-2 d-inline-flex align-items-center justify-content-center bg-transparent'

count = 0
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            try:
                with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    lines = file.readlines()
                
                changed = False
                for i in range(len(lines)):
                    if 'ti-dots-vertical' in lines[i]:
                        # Look upwards for the Link or button that has data-bs-toggle
                        for j in range(i-1, max(-1, i-6), -1):
                            if 'className=' in lines[j] and ('<Link' in lines[j] or '<button' in lines[j] or 'data-bs-toggle="dropdown"' in lines[j] or 'className=' in lines[j]):
                                # We replace the className value
                                import re
                                new_line = re.sub(r'className="[^"]*"', f'className="{new_class}"', lines[j])
                                if new_line != lines[j]:
                                    lines[j] = new_line
                                    changed = True
                                    count += 1
                                break
                
                if changed:
                    with codecs.open(filepath, 'w', encoding='utf-8') as file:
                        file.writelines(lines)
            except Exception as e:
                print(e)

print(f'Replaced 3-dots in {count} places.')
