# Home Page Refactoring

## Overview
The Home page has been refactored from a single 1700-line monolithic component into smaller, focused, reusable components following the Single Responsibility Principle.

## Structure

```
src/screens/v2/home/
├── components/
│   ├── HoroscopeCard.jsx              # Today's horoscope card
│   ├── ConsultationCarousel.jsx       # Consultation slides with auto-scroll
│   ├── QuickActions.jsx               # Quick action cards grid
│   ├── PanditAISection.jsx            # AI assistant section
│   ├── SectionHeader.jsx              # Reusable section header with divider
│   ├── AstrologerCard.jsx             # Individual astrologer card
│   ├── AstrologersSection.jsx         # Astrologers grid section
│   ├── LifeAreaSection.jsx            # Life area exploration cards
│   ├── SessionCard.jsx                # Individual session card
│   ├── MySessionsSection.jsx          # User sessions history
│   ├── CosmicInsightSection.jsx       # Daily cosmic insight card
│   ├── PanchangSection.jsx            # Panchang with timings
│   ├── DiscoverMoreSection.jsx        # Discover more services grid
│   ├── BlogsSection.jsx               # Blogs and news section
│   ├── BottomNavigation.jsx           # Bottom navigation bar
│   └── index.js                       # Component exports
├── hooks/
│   └── useAstrologerConnection.js     # Socket & connection state logic
├── Home.jsx                           # Original monolithic component
├── HomeRefactored.jsx                 # New refactored component
├── Home.module.scss                   # Styles (shared)
└── README.md                          # This file
```

## Components

### Presentational Components
These components focus purely on UI rendering:

- **HoroscopeCard**: Displays today's horoscope with decorative elements
- **SectionHeader**: Reusable header with moon divider decoration
- **AstrologerCard**: Single astrologer card with rating, specialties, and connect button
- **SessionCard**: Individual session history card
- **BottomNavigation**: Bottom navigation bar with icons

### Container Components
These components manage state and business logic:

- **ConsultationCarousel**: Auto-scrolling carousel with navigation dots
- **QuickActions**: Grid of quick action cards with navigation
- **AstrologersSection**: Grid of astrologer cards with data
- **MySessionsSection**: Session history with call again functionality
- **PanchangSection**: Panchang with tab switching
- **DiscoverMoreSection**: Service discovery grid with navigation
- **BlogsSection**: Blog cards with navigation

### Specialized Components
- **PanditAISection**: AI assistant with search functionality
- **LifeAreaSection**: Life area exploration cards
- **CosmicInsightSection**: Daily cosmic insight display

## Custom Hook

### useAstrologerConnection
Manages all socket connection logic and waiting states:

**Responsibilities:**
- Socket event listeners (chat:room, call:room, chat:accepted, call:accepted, etc.)
- Waiting state management (chat/call)
- LocalStorage persistence for waiting state
- Connection type tracking (chat/audio/video)
- Profile selection state
- Reset and cleanup functions

**Returns:**
```javascript
{
  WaitingList,              // Chat waiting state
  callWaitingList,          // Call waiting state
  connectionType,           // 'chat' | 'audio' | 'video'
  localSelectedProfile,     // Selected kundli profile
  setLocalSelectedProfile,  // Profile setter
  resetCallState,           // Reset all connection state
  setSelectedAstrologer,    // Set astrologer ref for socket events
}
```

## Benefits of Refactoring

1. **Maintainability**: Each component has a single, clear responsibility
2. **Reusability**: Components like `SectionHeader` and `AstrologerCard` can be reused
3. **Testability**: Smaller components are easier to test in isolation
4. **Readability**: Code is easier to understand and navigate
5. **Performance**: Easier to optimize individual components
6. **Collaboration**: Multiple developers can work on different components

## Migration Guide

To use the refactored version:

1. Replace the import in your route configuration:
```javascript
// Before
import Home from './screens/v2/home/Home';

// After
import Home from './screens/v2/home/HomeRefactored';
```

2. All functionality remains the same - no breaking changes
3. All styles are shared via `Home.module.scss`

## Component Props

### AstrologerCard
```javascript
{
  astrologer: {
    _id: string,
    firstName: string,
    lastName: string,
    rating: number,
    specialities: string[],
    imageUrl: string
  },
  onConnect: (astrologer) => void
}
```

### AstrologersSection
```javascript
{
  title: string,
  astrologers: Astrologer[],
  onConnect: (astrologer) => void
}
```

### BlogsSection
```javascript
{
  blogData: Array<{
    _id: string,
    title: string,
    imageUrl: string,
    publishDate: string,
    blogId: string
  }>
}
```

### SessionCard
```javascript
{
  session: {
    id: number,
    name: string,
    date: string,
    time: string,
    duration: string,
    imageUrl?: string
  },
  onCallAgain: (sessionId) => void,
  isLoading: boolean
}
```

## Future Improvements

1. Extract socket logic into a separate service
2. Add loading states for individual sections
3. Implement error boundaries for each section
4. Add skeleton loaders
5. Implement lazy loading for below-the-fold sections
6. Add analytics tracking per component
7. Create Storybook stories for each component
8. Add unit tests for each component
9. Implement virtual scrolling for large lists
10. Add accessibility improvements (ARIA labels, keyboard navigation)
