import codecs

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/notes/notes.tsx'
with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Add g-2 (smaller gap) to rows to reduce gaps between columns and cards
new_content = content.replace('<div className="row">', '<div className="row g-2">')

with codecs.open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated gaps')
