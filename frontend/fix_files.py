#!/usr/bin/env python3
import re

# Fix coach-types.ts
print("Fixing coach-types.ts...")
with open('src\\lib\\api\\coach-types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: remove the conflict marker at line 24 and the duplicate ActivePlanResponse
# The pattern is: }\n=======\n// ...duplicate interface...\n}============================================================================
content = re.sub(
    r'}\s*=======.*?export interface ActivePlanResponse.*?\n.*?}\s*============================================================================',
    '}',
    content,
    flags=re.DOTALL
)

# Also remove the duplicate at the end of the file
content = re.sub(
    r'// ============================================================================\n// Coach - Active Plan Response\n// ============================================================================\n\n/\*\*\n \* Response from getActivePlan endpoint\n \*/\nexport interface ActivePlanResponse \{[^}]+\}\s*$',
    '',
    content,
    flags=re.MULTILINE
)

with open('src\\lib\\api\\coach-types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed coach-types.ts")

# Fix types.ts
print("Fixing types.ts...")
with open('src\\lib\\api\\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: remove the conflict marker and duplicate CreateSegmentParams
# Pattern: export interface CreateSegmentParams {\n=======\n// ...\nexport interface CreateSegmentParams {============================================================================
content = re.sub(
    r'export interface CreateSegmentParams \{[^}]*\}\s*=======.*?export interface CreateSegmentParams \{[^}]*\}\s*============================================================================',
    'export interface CreateSegmentParams {\n  name: string;\n  description?: string;\n  start_lat: number;\n  start_lng: number;\n  end_lat: number;\n  end_lng: number;\n  distance: number;\n  elevation_gain?: number;\n  elevation_loss?: number;\n  avg_grade?: number;\n  max_grade?: number;\n  polyline?: string;\n  activity_type?: string;\n}',
    content,
    flags=re.DOTALL
)

with open('src\\lib\\api\\types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed types.ts")

print("All fixes applied!")
