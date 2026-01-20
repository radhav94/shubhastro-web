# Project Structure

## Root Organization

```
src/
├── screens/          # Page components (public/private routes)
├── component/        # Reusable UI components
├── layouts/          # Layout wrappers (HomeLayout)
├── redux/            # State management (slices, API definitions)
├── services/         # API service layer
├── context/          # React Context providers
├── utils/            # Utilities, helpers, constants
├── assets/           # Static assets (images, icons, SVG)
├── agora/            # Agora SDK integration
├── socket/           # Socket.io configuration
└── hooks/            # Custom React hooks
```

## Key Conventions

### Screens Organization

- **Public Routes** (`src/screens/public/`): Login, Register, OTP, static pages
- **Private Routes** (`src/screens/private/`): Feature-specific screens
  - Each feature has its own folder (e.g., `kundli/`, `horoscope/`, `tarot/`)
  - Complex features have subfolders for components and logic
  - Custom hooks prefixed with `use` (e.g., `useKundli.js`, `useTarot.js`)

### Component Structure

- **UI Components** (`src/component/UI/`): Organized by type
  - `cards/`: Various card components with subfolders for complex cards
  - `modal/`: Modal dialogs with specific purposes
  - `tabs/`: Tab navigation components
  - `charts/`: Data visualization components
  - `table/`: Table components
  - `chips/`: Chip/tag components
  
- **Form Controls** (`src/component/formikcontrols/`): Formik-integrated inputs
  - Each control type in its own folder (input, password, date, checkbox)
  - Includes validation and error handling

### Styling Patterns

- **SCSS Modules**: Primary styling method
  - File naming: `ComponentName.module.scss`
  - Import as: `import styles from './Component.module.scss'`
  - Usage: `className={styles.className}`
  
- **Tailwind**: Used for utility classes alongside SCSS modules
- **Theme**: Centralized colors in `src/utils/theme.js`
- **Variables**: SCSS variables in `src/assets/variables/_variables.scss`

### Redux Architecture

- **Slices** (`src/redux/`):
  - `auth/authSlice.js`: Authentication state
  - `kundliform/formSlice.js`: Form state management
  
- **API Layer** (`src/redux/api/`):
  - Organized by feature domain (astrologer, kundli, horoscope, etc.)
  - Base API configurations in `baseApi/`
  - RTK Query endpoints defined per feature

### Services Layer

- **App Services** (`src/services/appServices/`): Business logic and API calls
- **Request Handlers**: 
  - `privateRequest.js`: Authenticated requests
  - `publicRequest.js`: Public API requests
- **Socket Services**: Real-time communication handlers

### Utilities

- **Routes** (`src/utils/routes/`): Route definitions and guards
- **Helper Functions** (`src/utils/helper/`): String utils, converters, sanitizers
- **Constants** (`src/utils/constanats/`): App data, metadata
- **Hooks** (`src/utils/hooks/`): Shared custom hooks
- **Location** (`src/utils/location/`): Location search components

### Assets Organization

```
src/assets/
├── gif/          # Loading animations
├── icons/        # PNG icons
├── images/       # JPG/PNG images
├── svg/          # SVG files (zodiac signs)
└── variables/    # SCSS variables
```

## Naming Conventions

- **Components**: PascalCase (e.g., `AstrologerCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useKundli.js`)
- **Utilities**: camelCase (e.g., `capitalize.js`)
- **Constants**: camelCase or UPPER_SNAKE_CASE
- **SCSS Classes**: camelCase in modules
- **API Files**: camelCase with `Api` suffix (e.g., `kundliApi.js`)

## Import Patterns

- Relative imports for local files
- Named exports from index files (e.g., `src/component/index.js`)
- Asset imports through `src/utils/appImages.js` centralized file
- Route paths through `src/utils/routes/Paths.js`

## Context Providers

- `CallContext`: Manages call state (voice/video)
- `ChatContext`: Manages chat state
- `LiveListContext`: Manages live streaming state
- Providers wrap the app in `App.jsx`

## Build Output

- `dist/`: Production build output
- `public/`: Static assets served directly
  - Pre-minified CSS modules in `public/css/`
