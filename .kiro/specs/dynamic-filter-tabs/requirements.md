# Requirements Document

## Introduction

This feature replaces the static filter data in the FilterChips component with dynamic data from the API. The TalkToAstrologer screen already fetches filter tab data from the `useGetAstrologerFilterCategoryTabQuery` API, but the FilterChips component currently uses hardcoded arrays for skills, genders, and sorting options. This feature will make the filter modal render dynamically based on the API response, allowing the backend to control filter options without frontend code changes.

## Glossary

- **FilterChips**: The component that displays filter chips and the filter modal in the TalkToAstrologer screen
- **TalkToAstrologer**: The parent screen component that displays astrologers and manages filtering
- **Filter_API**: The API endpoint that returns dynamic filter tab data (`useGetAstrologerFilterCategoryTabQuery`)
- **Filter_Modal**: The modal dialog that displays filter options organized by category
- **Filter_Category**: A grouping of filter options (e.g., "Skill", "Gender", "Sorting")
- **Filter_Tab_Data**: The API response containing an array of filter categories with their options

## Requirements

### Requirement 1: Pass Dynamic Filter Data to FilterChips

**User Story:** As a developer, I want the TalkToAstrologer component to pass API filter data to FilterChips, so that the filter modal can render dynamically.

#### Acceptance Criteria

1. WHEN the Filter_API returns data, THE TalkToAstrologer SHALL pass the filter tab data to FilterChips as a prop named `filterTabData`
2. WHEN the Filter_API is loading, THE TalkToAstrologer SHALL pass the loading state to FilterChips as a prop named `isLoadingFilterTab`
3. THE TalkToAstrologer SHALL maintain all existing props passed to FilterChips

### Requirement 2: Render Filter Modal Dynamically

**User Story:** As a user, I want the filter modal to display categories and options from the backend, so that I can filter astrologers using the latest available options.

#### Acceptance Criteria

1. WHEN Filter_Tab_Data is available, THE FilterChips SHALL render filter modal sections based on the API response
2. WHEN rendering a filter category, THE FilterChips SHALL use the `title` field as the section name in the left sidebar
3. WHEN rendering filter options, THE FilterChips SHALL use the `list` field as the array of selectable options
4. WHEN Filter_Tab_Data is not available or empty, THE FilterChips SHALL fall back to the static data arrays
5. WHEN the user selects a filter option from a dynamic category, THE FilterChips SHALL maintain the same selection behavior as the static implementation

### Requirement 3: Preserve Existing Functionality

**User Story:** As a user, I want all existing filter features to continue working, so that my experience is not disrupted.

#### Acceptance Criteria

1. WHEN filters are applied, THE FilterChips SHALL trigger the same API calls with the same parameters as before
2. WHEN the user clicks "Reset", THE FilterChips SHALL clear all selections and reset to the "All" state
3. WHEN the user clicks "Apply", THE FilterChips SHALL call the `applyFiltersClick` function with the selected values
4. THE FilterChips SHALL maintain the existing infinite scroll behavior for filtered results
5. THE FilterChips SHALL maintain the existing search functionality

### Requirement 4: Maintain Code Quality

**User Story:** As a developer, I want the old static implementation preserved as comments, so that I can reference it if needed.

#### Acceptance Criteria

1. WHEN replacing static data with dynamic logic, THE implementation SHALL comment out the old static arrays
2. THE implementation SHALL add clear comments indicating what was replaced and why
3. THE implementation SHALL maintain clean and readable code structure
4. THE implementation SHALL not introduce unnecessary refactoring or changes to unrelated code

### Requirement 5: Handle API Response Structure

**User Story:** As a developer, I want the implementation to handle the API response structure correctly, so that filter data is mapped properly.

#### Acceptance Criteria

1. WHEN the API response contains a `title` field, THE FilterChips SHALL use it as the category name
2. WHEN the API response contains a `list` field, THE FilterChips SHALL use it as the array of filter options
3. IF the API response contains a `slug` field, THE FilterChips SHALL store it for potential future use
4. IF the API response contains a `type` field, THE FilterChips SHALL store it for potential categorization
5. WHEN mapping filter options to state variables, THE FilterChips SHALL maintain compatibility with existing filter API parameters
