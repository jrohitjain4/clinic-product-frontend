import os
import re
from collections import Counter

base_dir = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module'
patterns = []

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.tsx'):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    content = file.read()
                    matches = re.findall(r'className="([^"]*)"[^>]*data-bs-toggle="dropdown"', content)
                    for m in matches:
                        patterns.append(m)
            except:
                pass

for k, v in Counter(patterns).most_common(20):
    print(f"{v}: {k}")
