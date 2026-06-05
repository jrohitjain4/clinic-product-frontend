import re

with open('src/feature-module/components/pages/application-modules/application/todo/todoList.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    return match.group(1) # Group 1 is UPSTREAM

resolved = re.sub(r'<<<<<<< Updated upstream\n(.*?)\n=======\n.*?\n>>>>>>> Stashed changes\n', replacer, content, flags=re.DOTALL)

with open('src/feature-module/components/pages/application-modules/application/todo/todoList.tsx', 'w', encoding='utf-8') as f:
    f.write(resolved)

print("Resolved todoList.tsx with UPSTREAM")
