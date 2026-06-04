import codecs
import re

def fix_file(filepath):
    try:
        with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Move Create New to the right
        # Find the whole div block
        pattern = r'(<div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">)\s*(<Link[^>]*?data-bs-target="#add_todo"[^>]*?>.*?Create New\s*</Link>)\s*(<ul.*?</ul>)\s*(</div>)'
        
        match = re.search(pattern, content, re.DOTALL)
        if match:
            div_start = '<div className="d-flex align-items-center justify-content-end flex-wrap gap-3 mb-3">'
            create_link = match.group(2)
            ul_block = match.group(3)
            
            # Apply border theme to ul block
            ul_block = ul_block.replace('bg-white text-dark me-2', 'bg-white text-dark border me-2')
            ul_block = ul_block.replace('bg-primary text-white active me-2', 'bg-primary-subtle text-primary border border-primary active me-2')
            
            # Reconstruct with UL first, then Create New
            new_block = f"{div_start}\n            {ul_block}\n            {create_link}\n          </div>"
            
            content = content[:match.start()] + new_block + content[match.end():]
            
            with codecs.open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully updated {filepath}")
        else:
            print(f"Pattern not found in {filepath}")

    except Exception as e:
        print(f"Error: {e}")

fix_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx')
fix_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todo.tsx')

# For sidebarData.tsx
try:
    filepath = 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/sidebar/sidebarData.tsx'
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to change the route for "To Do" to routes.todoList
    pattern = r'(menuValue:\s*"To Do",\s*hasSubRoute:\s*false,\s*showSubRoute:\s*false,\s*route:\s*routes\.)todo(,\s*link:\s*routes\.)todo(,\s*base:\s*"todo",)'
    
    if re.search(pattern, content):
        content = re.sub(pattern, r'\g<1>todoList\g<2>todoList\g<3>', content)
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated sidebarData.tsx")
    else:
        print("Sidebar pattern not found")
except Exception as e:
    print(f"Sidebar error: {e}")
