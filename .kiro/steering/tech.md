# Technology Stack

## Core Technologies

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Language**: JavaScript (JSX)
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router DOM v7

## Styling

- **Primary**: SCSS Modules (`.module.scss` files)
- **Utility**: Tailwind CSS 3.4.17
- **Preprocessor**: Sass 1.93.0
- **PostCSS**: Autoprefixer for vendor prefixes

## Key Libraries

- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios
- **Real-time Communication**: 
  - Socket.io-client for chat/messaging
  - Agora RTC SDK for voice/video calls
- **UI Components**: 
  - React Icons, Lucide React
  - Framer Motion for animations
- **Maps**: @react-google-maps/api, @vis.gl/react-google-maps
- **Payments**: React Razorpay
- **Notifications**: React Hot Toast
- **Date Handling**: Day.js
- **Firebase**: Authentication and push notifications

## Environment Management

Uses `env-cmd` with `.env-cmdrc` for environment-specific configurations:
- `dev`: Development environment
- `stage`: Staging environment  
- `prod`: Production environment

## Common Commands

```bash
# Development
npm run start              # Start dev server (dev env)
npm run start-dev          # Start dev server (dev env)
npm run start-stage        # Start dev server (stage env)
npm run start-prod         # Start dev server (prod env)

# Build
npm run build              # Build for dev
npm run build-dev          # Build for dev
npm run build-stage        # Build for staging
npm run build-prod         # Build for production

# Preview
npm run preview            # Preview production build
```

## Code Quality

- **Linter**: ESLint 9 with flat config
- **Rules**: React Hooks recommended, React Refresh for HMR
- **Ignored Patterns**: Unused vars starting with uppercase or underscore

## API Architecture

- **RTK Query**: Multiple API slices for different services
- **Base APIs**: 
  - `baseApi`: Third-party astrology API
  - `pythonApi`: Python backend services
  - `horoscopeApi`: Horoscope data
  - `vedicApi`: Vedic astrology calculations
  - `calculatorApi`: Astrological calculators
  - `privateRequestNew`: Internal backend API
- **Authentication**: Basic auth for external APIs, token-based for internal
