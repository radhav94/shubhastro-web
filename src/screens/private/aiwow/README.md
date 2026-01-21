# AI WOW Module

## Overview
The AI WOW module provides cutting-edge AI-powered astrology tools and experiences.

## Features

### Active Features
1. **AR Vastu Scanner** (New) - Augmented reality Vastu analysis
2. **Palmistry Scanner** - AI-powered palm reading
3. **Face Reading** - AI-powered facial analysis
4. **Gemstone Authenticity** (Popular) - Gemstone verification and recommendations
5. **Signature Analysis** (Popular) - Signature personality insights

### Coming Soon
1. **Clothes Colour Analysis** - Astrological color recommendations
2. **Aura Analysis** - AI-powered aura reading

## Folder Structure

```
src/screens/private/aiwow/
├── AIWow.jsx                    # Main landing page
├── AIWow.module.scss            # Main page styles
├── README.md                    # This file
└── components/
    ├── index.js                 # Component exports
    ├── FeatureCard.jsx          # Active feature card component
    ├── FeatureCard.module.scss
    ├── ComingSoonCard.jsx       # Coming soon feature card
    ├── ComingSoonCard.module.scss
    ├── PalmFaceSection.jsx      # Palm & Face reading section
    └── PalmFaceSection.module.scss

src/assets/aiwow/                # AI WOW specific assets
├── Group 1410084675.svg         # Vastu icon
├── Group 1410084718.svg         # Gemstone icon
├── Group 1410084719.svg         # Signature icon
├── Group 1410084720.svg         # Palm icon
├── Vector.svg                   # Face icon
├── Rectangle 34624973.png       # Clothes icon
└── 形状.svg                      # Aura icon
```

## Routes

- `/aiwow` - Main AI WOW landing page
- `/aiwow/ar-vastu` - AR Vastu Scanner (to be implemented)
- `/aiwow/palmistry` - Palmistry Scanner (to be implemented)
- `/aiwow/face-reading` - Face Reading (to be implemented)
- `/aiwow/gemstone` - Gemstone Authenticity (to be implemented)
- `/aiwow/signature` - Signature Analysis (to be implemented)

## Responsive Design

The module is fully responsive across:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Usage

Import and use in routes:
```javascript
import AIWow from "../../screens/private/aiwow/AIWow";

// In PATH.privateRoutes
AI_WOW: {
  path: "/aiwow",
  element: AIWow,
}
```

## Next Steps

1. Implement individual feature pages (AR Vastu, Palmistry, etc.)
2. Add API integration for AI analysis
3. Implement file upload functionality
4. Add result display components
5. Integrate with backend AI services
