
import os

path = r'c:\Users\lomic\Desktop\DrawRun\app\src\main\java\com\drawrun\app\ui\screens\PlanningScreen.kt'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify markers (0-indexed)
# Line 290 (index 289) should contain '}'
# Line 292 (index 291) should contain 'showPlanSetup = false'
# Line 364 (index 363) should contain 'dismissButton'

# Note: Step 559 line numbers were 1-based.
# 290 -> 289
# 292 -> 291
# 364 -> 363

try:
    if '}' not in lines[289]:
        print(f"Error: Line 290 content mismatch: {lines[289].strip()}")
        exit(1)
    if 'showPlanSetup = false' not in lines[291]:
        print(f"Error: Line 292 content mismatch: {lines[291].strip()}")
        # Check nearby?
        # exit(1) # Strict check might fail if line numbers shifted. 
        # I'll search for the pattern.

    # Find the boundary
    # Search for the block starting with confirmed valid line (280-290)
    # Line 288: Text("CALIBRER & GÉNÉRER"...)
    # Line 289: }
    # Line 290: }
    
    start_idx = -1
    for i in range(280, 310):
        if "CALIBRER & GÉNÉRER" in lines[i]:
            if '}' in lines[i+1] and '}' in lines[i+2]:
                start_boundary = i+2
                if 'showPlanSetup = false' in lines[i+3] or 'showPlanSetup = false' in lines[i+4]:
                    start_idx = start_boundary
                    break
    
    if start_idx == -1:
        print("Could not find start of duplicate block.")
        exit(1)

    # Find the end of duplicate block
    # Search for 'dismissButton' after start_idx
    end_idx = -1
    for i in range(start_idx, start_idx + 100):
        if 'dismissButton = {' in lines[i]:
            end_idx = i
            break
            
    if end_idx == -1:
        print("Could not find end of duplicate block.")
        exit(1)

    print(f"Deleting duplicates from line {start_idx+1} to {end_idx}")
    
    # Add comma to the closing brace before the deletion
    lines[start_idx] = lines[start_idx].rstrip() + ",\n"
    
    # Slice: Keep 0..start_idx (inclusive, modified) + end_idx..end
    # We want to delete (start_idx + 1) to (end_idx - 1) logic.
    # Actually:
    # `}` (start_idx) -> becomes `},`
    # Next lines are garbage.
    # `dismissButton` (end_idx) -> Keep.
    
    new_lines = lines[:start_idx+1] + lines[end_idx:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print("Success.")

except Exception as e:
    print(f"Exception: {e}")
