import codecs
import re

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/appointments/appointments.tsx'
with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

if 'ti-dots-vertical' in content:
    print('appointments.tsx HAS ti-dots-vertical')
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'ti-dots-vertical' in line:
            start = max(0, i - 4)
            end = min(len(lines), i + 2)
            for j in range(start, end):
                print(f'{j}: {lines[j]}')
            break
else:
    print('NO ti-dots-vertical in appointments.tsx')

# Also check dataTable/index.tsx
dt_filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/dataTable/index.tsx'
with codecs.open(dt_filepath, 'r', encoding='utf-8', errors='ignore') as f:
    dt_content = f.read()

if 'card overflow-hidden' in dt_content:
    print('DataTable has card wrapper!')
else:
    print('DataTable DOES NOT have card wrapper!')
