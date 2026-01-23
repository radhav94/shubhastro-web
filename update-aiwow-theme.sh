#!/bin/bash

# Script to update all AI WOW module SCSS files with orange theme
# This replaces common color patterns across all modules

echo "Updating AI WOW modules with orange theme..."

# Define the files to update
FILES=(
  "src/screens/private/aiwow/clothcolor/ClothColorCamera.module.scss"
  "src/screens/private/aiwow/clothcolor/ClothColorAnalysis.module.scss"
  "src/screens/private/aiwow/clothcolor/ClothColorResult.module.scss"
  "src/screens/private/aiwow/facereading/FaceReadingLanding.module.scss"
  "src/screens/private/aiwow/facereading/FaceReadingInstructions.module.scss"
  "src/screens/private/aiwow/facereading/FaceReadingCamera.module.scss"
  "src/screens/private/aiwow/facereading/FaceReadingAnalysis.module.scss"
  "src/screens/private/aiwow/facereading/FaceReadingResult.module.scss"
  "src/screens/private/aiwow/gemstone/GemstoneLanding.module.scss"
  "src/screens/private/aiwow/gemstone/GemstoneInstructions.module.scss"
  "src/screens/private/aiwow/gemstone/GemstoneCamera.module.scss"
  "src/screens/private/aiwow/gemstone/GemstoneAnalysis.module.scss"
  "src/screens/private/aiwow/gemstone/GemstoneResult.module.scss"
  "src/screens/private/aiwow/signature/SignatureLanding.module.scss"
  "src/screens/private/aiwow/signature/SignatureInstructions.module.scss"
  "src/screens/private/aiwow/signature/SignatureCamera.module.scss"
  "src/screens/private/aiwow/signature/SignatureAnalysis.module.scss"
  "src/screens/private/aiwow/signature/SignatureResult.module.scss"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace green colors with orange
    sed -i '' 's/#10b981/#F75801/g' "$file"
    sed -i '' 's/#059669/#D43400/g' "$file"
    
    # Replace dark gray/black with orange gradient
    sed -i '' 's/background: #1f2937;/background: linear-gradient(90deg, #F75801 0%, #D43400 100%);/g' "$file"
    sed -i '' 's/background: #111827;/background: linear-gradient(90deg, #E54D00 0%, #C22F00 100%);/g' "$file"
    sed -i '' 's/color: #1f2937;/background: linear-gradient(90deg, #F75801 0%, #D43400 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;/g' "$file"
    
    # Replace border colors
    sed -i '' 's/border: 1px solid #e5e7eb;/border: 2px solid rgba(247, 88, 1, 0.2);/g' "$file"
    sed -i '' 's/border: 2px solid #e5e7eb;/border: 2px solid rgba(247, 88, 1, 0.2);/g' "$file"
    
    # Replace backgrounds
    sed -i '' 's/background: #f5f5f5;/background: #fff;/g' "$file"
    sed -i '' 's/background: #e5e7eb;/background: #fff;/g' "$file"
    sed -i '' 's/background: #f3f4f6;/background: white;/g' "$file"
    
  else
    echo "File not found: $file"
  fi
done

echo "Theme update complete!"
