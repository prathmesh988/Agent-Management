import re

with open('generated_schema.txt', 'r', encoding='utf-16-le') as f:
    text = f.read()

parts = text.split('--- MAPPING ---')
cols = parts[0].replace('--- COLUMNS ---\n', '').strip()
mapping = parts[1].strip()

with open('src/lib/types.ts', 'r', encoding='utf-8') as f:
    types_content = f.read()

col_lines = cols.split('\n')
keys_str = []
for line in col_lines:
    match = re.search(r'key:\s*"([^"]+)".+?type:\s*"([^"]+)".+?required:\s*([a-z]+)', line)
    if match:
        k = match.group(1)
        t = 'string' if match.group(2) == 'string' else 'number'
        req = '' if match.group(3) == 'true' else '?'
        keys_str.append(f'  {k}{req}: {t};')

replacement = 'export interface Employee {\n  id: string;\n  status?: "active" | "inactive" | "on-leave";\n  email: string;\n  department?: string;\n' + '\n'.join(keys_str) + '\n}'
types_content = re.sub(r'export interface Employee \{.*?\}', replacement, types_content, flags=re.DOTALL)

with open('src/lib/types.ts', 'w', encoding='utf-8') as f:
    f.write(types_content)

print(f'Replaced {len(keys_str)} fields in types.ts')
