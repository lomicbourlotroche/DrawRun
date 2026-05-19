import re

# Fix 1: PerformanceContent.tsx - remove duplicate Activity import
print("Fixing PerformanceContent.tsx...")
with open('app\\app\\performance\\PerformanceContent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import type { Activity } from '@/types';\n",
    ""
)

with open('app\\app\\performance\\PerformanceContent.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed PerformanceContent.tsx")

# Fix 2: types/index.ts - remove duplicate NutritionStrategy
print("Fixing types/index.ts...")
with open('src\\types\\index.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
seen_nutrition_strategy = False
for line in lines:
    if 'export interface NutritionStrategy' in line:
        if seen_nutrition_strategy:
            continue  # Skip duplicate
        seen_nutrition_strategy = True
    new_lines.append(line)

with open('src\\types\\index.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Fixed types/index.ts")

# Fix 3: RideAnalysisCards.tsx - escape apostrophe in W'
print("Fixing RideAnalysisCards.tsx...")
with open('components\\features\\activities\\analysis\\RideAnalysisCards.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace W' with W&apos;
content = content.replace("W' (R\u00e9serve ana\u00e9robie)", "W&apos; (R\u00e9serve ana\u00e9robie)")

with open('components\\features\\activities\\analysis\\RideAnalysisCards.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed RideAnalysisCards.tsx")

# Fix 4: OnboardingWizard.tsx - escape apostrophe
print("Fixing OnboardingWizard.tsx...")
with open('components\\features\\onboarding\\OnboardingWizard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace formulaire d'onboarding with formulaire d&apos;onboarding
content = content.replace("formulaire d'onboarding", "formulaire d&apos;onboarding")

with open('components\\features\\onboarding\\OnboardingWizard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed OnboardingWizard.tsx")

print("All fixes applied!")
