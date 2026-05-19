with open('src\\lib\\api\\coach-types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 127: }============================================================================
content = content.replace('}============================================================================', '}')

# Fix line 24: =====Coach - Active Plan Response
content = content.replace('=======Coach - Active Plan Response', '')

# Fix line 36: =========================================================================
content = content.replace('=========================================================================', '')

# Remove duplicate ActivePlanResponse - keep first, remove second and third
lines = content.split('\n')
new_lines = []
seen_active_plan = False
skip_next_4 = False
for i, line in enumerate(lines):
    if skip_next_4:
        skip_next_4 = False
        continue
    if 'export interface ActivePlanResponse' in line:
        if seen_active_plan:
            skip_next_4 = True  # Skip the next 4 lines (the interface body)
            continue
        seen_active_plan = True
    new_lines.append(line)

content = '\n'.join(new_lines)

with open('src\\lib\\api\\coach-types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed coach-types.ts')
