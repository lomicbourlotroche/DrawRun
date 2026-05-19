with open('src\\lib\\api\\types.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Skip the incomplete CreateSegmentParams at line 16 (0-indexed: 15)
    if i == 15 and 'export interface CreateSegmentParams' in line:
        continue
    # Skip the conflict marker at line 17 (0-indexed: 16)
    if i == 16 and line.strip() == '=======':
        continue
    # Fix the duplicate CreateSegmentParams {============================================================================ line
    if '============================================================================' in line:
        # Replace with just '{' 
        line = line.replace('============================================================================', '')
    new_lines.append(line)

with open('src\\lib\\api\\types.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Fixed types.ts')
