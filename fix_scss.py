import re

with open('conflicts_output.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# find index.scss STASH (Design): content
stash_start = text.find("--- FILE: src\\index.scss | CONFLICT 1 ---")
stash_marker = text.find("STASH (Design):\n", stash_start) + len("STASH (Design):\n")
stash_end = text.find("\n----------------------------------------", stash_marker)

scss_content = text[stash_marker:stash_end]

with open('src/index.scss', 'w', encoding='utf-8') as f:
    f.write(scss_content)

print("Wrote index.scss from STASH")
