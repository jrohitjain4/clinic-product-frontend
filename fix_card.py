import codecs

filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx'
with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Make the card hide overflowing table content to keep rounded corners
# and also restore the table border if the user meant that.
content = content.replace('<div className="card">', '<div className="card overflow-hidden">')
content = content.replace('<table className="table table-hover mb-0">', '<table className="table table-hover border mb-0">')

with codecs.open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Card updated")
