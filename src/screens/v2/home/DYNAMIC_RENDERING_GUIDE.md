# Dynamic Home Page Rendering System

## Overview
The home page now dynamically renders sections based on the API response's `display_type` and `list_order` fields. This allows the backend to control the order and type of content displayed without requiring frontend code changes.

## Architecture

### 1. Section Mapper (`utils/sectionMapper.jsx`)
Central mapping system that:
- Maps `display_type` to corresponding React components
- Sorts sections by `list_order`
- Passes dynamic data to each component

### 2. Supported Display Types

| Display Type | Component | Description |
|-------------|-----------|-------------|
| `todays-horoscope` | HoroscopeCard | Today's horoscope banner |
| `consult-to-expert-astrologer` | ConsultationCarousel | Consultation carousel slides |
| `complementary-services` | QuickActions | Quick action cards |
| `pandit-ai` | PanditAISection | AI assistant section |
| `our-astrologers` | AstrologersSection | Astrologer list (horizontal scroll) |
| `astrologer-grid` | AstrologersSection | Top rated astrologers |
| `astrologers-by-category` | AstrologersByCategorySection | Category filter cards |
| `my-sessions` | MySessionsSection | Recent user sessions |
| `daily-cosmic-insight` | CosmicInsightSection | Cosmic insight card |
| `explore-panchang` | PanchangSection | Panchang information |
| `connect-again` | ConnectAgainSection | Recent connections |
| `discover-more` | DiscoverMoreSection | Feature discovery cards |
| `blog` | BlogsSection | Blog articles |
| `news` | NewsSection | News articles |

### 3. Component Updates

All section components now accept dynamic props:
- `data`: Section content from API
- `title`: Display title from API
- `showMore`: Whether to show "View All" link
- `onConnect`: Handler for astrologer connections

## API Response Structure

```json
{
  "data": {
    "list": [
      {
        "_id": "unique-id",
        "ID": 1,
        "title": "Section Title",
        "slug": "section-slug",
        "display_title": "Display Title",
        "display_type": "todays-horoscope",
        "show_more": true,
        "content": [],
        "image_url": "https://...",
        "list_order": 1
      }
    ]
  }
}
```

## Key Features

### 1. Order Management
Sections are automatically sorted by `list_order` field, ensuring consistent display order.

### 2. Dynamic Content
Each section receives its `content` array and can render different data without code changes.

### 3. Conditional Rendering
Sections only render if:
- They have a valid `display_type`
- They have content (for content-dependent sections)
- User is logged in (for auth-required sections like My Sessions)

### 4. Fallback Handling
- Unknown `display_type` values are logged as warnings
- Components have default data if API data is missing
- Empty states are shown when no content is available

## Usage Example

```jsx
// Home.jsx automatically handles rendering
const sortedSections = sortSectionsByOrder(homeList);

sortedSections.map((section) => {
  return renderSection(section.display_type, section, {
    onConnect: handleConnectClick,
  });
});
```

## Adding New Section Types

1. Create the component in `components/`
2. Add mapping in `utils/sectionMapper.jsx`:
```jsx
case "new-display-type":
  return (
    <NewComponent
      key={sectionData._id}
      data={sectionData.content}
      title={sectionData.display_title}
    />
  );
```

## Session Card Enhancement

The Session Card now displays:
- Astrologer name
- Session date (formatted)
- Session time (12-hour format)
- Duration (minutes and seconds)
- "Call Again" button with phone icon

Data source: `getAllUserSessions` API endpoint

## Benefits

1. **Backend Control**: Content order and types managed via API
2. **Flexibility**: Easy to add/remove/reorder sections
3. **Maintainability**: Single source of truth for section rendering
4. **Scalability**: New section types added without major refactoring
5. **Consistency**: All sections follow same data flow pattern

## Testing

To test different configurations:
1. Modify the API response `list_order` values
2. Add/remove sections from the API response
3. Change `display_type` values to show different components
4. Verify sections render in correct order
