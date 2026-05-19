with open('src\\lib\\api\\types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the incomplete CreateSegmentParams with the complete one
old_incomplete = """export interface CreateSegmentParams {
// Types de base
// 

export interface SyncResult {"""

new_complete = """export interface CreateSegmentParams {
  name: string;
  description?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance: number;
  elevation_gain?: number;
  elevation_loss?: number;
  avg_grade?: number;
  max_grade?: number;
  polyline?: string;
  activity_type?: string;
}

// Types de base
// ============================================================================

export interface SyncResult {"""

content = content.replace(old_incomplete, new_complete)

# Remove the duplicate CreateSegmentParams at the end (around line 480)
lines = content.split('\n')
new_lines = []
seen_create_segment = False
for line in lines:
    if 'export interface CreateSegmentParams' in line:
        if seen_create_segment:
            # Skip the next ~13 lines (the duplicate interface body)
            continue
        seen_create_segment = True
    new_lines.append(line)

content = '\n'.join(new_lines)

with open('src\\lib\\api\\types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed types.ts v2')
