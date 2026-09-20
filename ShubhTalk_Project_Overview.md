<![CDATA[<div align="center">

# 🔮 ShubhTalk — Project Overview

### Astrology Consultation Platform

**Version:** 1.0 &nbsp;|&nbsp; **Date:** April 2026 &nbsp;|&nbsp; **Platform:** Web (Mobile-First)

---

</div>

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Module Catalog](#4-module-catalog)
   - 4.1 [Authentication & Onboarding](#41-authentication--onboarding)
   - 4.2 [Home & Navigation](#42-home--navigation)
   - 4.3 [Astrologer Consultations](#43-astrologer-consultations)
   - 4.4 [Kundli (Birth Chart)](#44-kundli-birth-chart)
   - 4.5 [Horoscope](#45-horoscope)
   - 4.6 [Tarot Readings](#46-tarot-readings)
   - 4.7 [Panchang (Hindu Calendar)](#47-panchang-hindu-calendar)
   - 4.8 [Matchmaking & Compatibility](#48-matchmaking--compatibility)
   - 4.9 [Numerology](#49-numerology)
   - 4.10 [Calculators](#410-calculators)
   - 4.11 [AI-Powered Features (AIWow)](#411-ai-powered-features-aiwow)
   - 4.12 [Live Streaming](#412-live-streaming)
   - 4.13 [E-Commerce & E-Pooja](#413-e-commerce--e-pooja)
   - 4.14 [Wallet & Payments](#414-wallet--payments)
   - 4.15 [User Profile & Settings](#415-user-profile--settings)
   - 4.16 [Notifications](#416-notifications)
   - 4.17 [Blog & Content](#417-blog--content)
   - 4.18 [Order & Session History](#418-order--session-history)
   - 4.19 [Customer Support](#419-customer-support)
5. [Real-Time Communication Layer](#5-real-time-communication-layer)
6. [State Management Architecture](#6-state-management-architecture)
7. [API Architecture](#7-api-architecture)
8. [Routing & Navigation](#8-routing--navigation)
9. [Reusable Component Library](#9-reusable-component-library)
10. [Services Layer](#10-services-layer)
11. [Project Structure](#11-project-structure)
12. [Environment & Build Configuration](#12-environment--build-configuration)

---]]>
<![CDATA[

## 1. Executive Summary

**ShubhTalk** is a full-featured astrology consultation platform that connects users with professional astrologers for personalized readings, predictions, and spiritual services. The platform delivers a rich, mobile-first web experience encompassing real-time consultations (chat, voice, video), AI-powered analysis tools, e-commerce, and a comprehensive suite of Vedic astrology services.

### Key Highlights

| Dimension | Details |
|---|---|
| **Users** | Customers seeking astrological guidance; Astrologers providing consultations |
| **Core Value** | On-demand astrologer consultations with real-time chat, voice & video calls |
| **Differentiators** | AI-powered palmistry, face reading, aura analysis; 20+ astrological calculators; Live streaming sessions |
| **Monetization** | Wallet-based per-minute billing, e-commerce marketplace, e-pooja bookings |
| **Scale** | 30+ feature modules, 100+ routes, 20+ API integrations |

---

## 2. Technology Stack

### Core Framework

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | 19.1.1 |
| **Build Tool** | Vite | 7.1.7 |
| **Language** | JavaScript (JSX) | ES2022+ |
| **Routing** | React Router DOM | v7 |
| **State Management** | Redux Toolkit + RTK Query | Latest |
| **Persistence** | Redux Persist | Latest |

### Styling

| Tool | Purpose |
|---|---|
| **SCSS Modules** | Component-scoped styles (`.module.scss`) |
| **Tailwind CSS 3.4** | Utility-first CSS classes |
| **Sass 1.93** | SCSS preprocessing |
| **PostCSS + Autoprefixer** | Vendor prefix automation |

### Key Libraries

| Category | Libraries |
|---|---|
| **Forms** | Formik + Yup validation |
| **HTTP** | Axios |
| **Real-Time** | Socket.io-client, Agora RTC SDK |
| **Payments** | React Razorpay |
| **Maps** | @react-google-maps/api, @vis.gl/react-google-maps |
| **Animations** | Framer Motion |
| **Icons** | React Icons, Lucide React |
| **Dates** | Day.js |
| **Notifications** | React Hot Toast, Firebase Cloud Messaging |
| **Auth** | Firebase Authentication |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  React 19 + React Router v7 + SCSS Modules + Tailwind CSS      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Screens  │ │Components│ │ Layouts  │ │ Context Providers│   │
│  │ (Pages)  │ │  (UI)    │ │          │ │ Call│Chat│Live    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      STATE MANAGEMENT LAYER                     │
│  Redux Toolkit + RTK Query + Redux Persist                      │
│  ┌──────────┐ ┌──────────────────────────────────────────────┐  │
│  │  Slices   │ │  RTK Query API Slices (9 base APIs)         │  │
│  │auth│form │ │  baseApi│pythonApi│vedicApi│horoscopeApi│... │  │
│  │kundli│...│ │                                              │  │
│  └──────────┘ └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        SERVICES LAYER                           │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ App Services  │ │Socket Services│ │  Firebase Services    │  │
│  │ (Business     │ │ voiceSocket  │ │  FCM │ Auth            │  │
│  │  Logic)       │ │ chatSocket   │ │                        │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       EXTERNAL SERVICES                         │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────────────┐  │
│  │Astrology│ │ Python │ │ Agora │ │Razorpay│ │ Google Maps  │  │
│  │  API    │ │Backend │ │  RTC  │ │Payment │ │              │  │
│  └────────┘ └────────┘ └───────┘ └────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Catalog

### 4.1 Authentication & Onboarding

| Component | Path | Description |
|---|---|---|
| **Onboarding** | `/onboarding` | Multi-step welcome flow: Welcome → Birth Details → Personalization → Guidance → Loading |
| **Login** | `/login` | User authentication (redirects to Onboarding) |
| **Register** | `/register` | New user registration |
| **OTP Verification** | `/otp-verification` | Phone/email OTP verification |
| **Forgot Password** | `/forgot-password` | Password recovery flow |
| **Verify Password** | `/verify-password` | Password reset confirmation |

**Key Files:**
- `src/screens/public/onboarding/Onboarding.jsx`
- `src/screens/public/Register.jsx`
- `src/redux/auth/authSlice.js`
- `src/services/appServices/authService.js`

**State:** Redux `auth` slice manages `isLoggedIn`, `token`, `isRegister`, `isVerified`.

---

### 4.2 Home & Navigation

| Component | Path | Description |
|---|---|---|
| **Home Dashboard** | `/` | Main landing with astrologer recommendations, live streams, quick actions |
| **Explore** | `/explore` | Feature discovery hub with categorized navigation |
| **Home V2** | `/` | Redesigned home with dynamic section rendering |

**Key Files:**
- `src/screens/private/home/` — Dashboard components, astrologer lists, chat list, live streams
- `src/screens/private/explore/` — Explore feature grid
- `src/screens/v2/home/` — New home implementation with hooks and dynamic rendering
- `src/layouts/HomeLayout.jsx` — Main app shell (header + footer + content)
- `src/layouts/Navbar.jsx` — Top navigation bar
- `src/layouts/Footer.jsx` — Bottom navigation

**Sub-components:**
- `AstrologersDashboard` — Astrologer recommendation grid
- `ChatList` — Active chat sessions list
- `InteractiveLiveStreaming` — Live stream discovery
- `LivePlayerPage` — Live stream viewer

---

### 4.3 Astrologer Consultations

The core revenue-generating module enabling real-time consultations.

#### Chat Consultations

| Feature | Description |
|---|---|
| **Astrologer Listing** | Browse and filter astrologers by specialty, rating, price |
| **Chat Window** | Real-time text messaging with astrologers |
| **Kundli Selection** | Select birth chart profile before consultation |
| **Waiting List** | Queue management when astrologer is busy |
| **Chat Reconnection** | Auto-reconnect on network interruption (30-min window) |

#### Voice & Video Calls

| Feature | Description |
|---|---|
| **Voice Call** | Audio-only consultation via Agora RTC |
| **Video Call** | Full video consultation via Agora RTC |
| **Call Upgrade** | Seamless audio → video upgrade during call |
| **Call Timer** | Real-time duration tracking with billing |
| **Gift Sending** | Send virtual gifts during calls |
| **Suggested Remedies** | Remedy panel during consultations |
| **Call Minimization** | Continue browsing while on call |

**Key Files:**
- `src/screens/private/talkToAstrologer/` — Main consultation hub
- `src/screens/private/astrologerProfile/` — Individual astrologer profiles
- `src/component/call/VideoCall.jsx` — Video call UI
- `src/component/call/VoiceCall.jsx` — Voice call UI
- `src/context/CallContext.jsx` — Call state management
- `src/context/ChatContext.jsx` — Chat state management
- `src/services/voiceSocketServices.js` — Socket-based call/chat management
- `src/agora/agoraClient.jsx` — Agora RTC client

**Socket Events:**
```
call:room → call:accepted → call:ended
chat:room → chat:accepted → chat:ended
call:reconnect / chat:reconnect (auto-recovery)
message:recieved, typing, activity
```

---

### 4.4 Kundli (Birth Chart)

Comprehensive Vedic birth chart generation and analysis.

| Feature | Description |
|---|---|
| **Chart Generation** | Create birth charts from date, time, and place of birth |
| **Basic Analysis** | Planetary positions, houses, aspects |
| **Dasha Analysis** | Planetary period predictions (Mahadasha, Antardasha) |
| **Ashtakvarga** | Point-based strength analysis of planets |
| **KP System** | Krishnamurti Paddhati astrology system |
| **Chart Visualization** | North/South Indian chart styles |
| **Free Kundli** | Limited free chart generation |
| **Saved Profiles** | Store multiple birth profiles |

**Key Files:**
- `src/screens/private/kundli/` — Main kundli screens
  - `BasicContent/`, `ChartsContent/`, `DashaContent/`, `AshtakvargaContent/`, `KpContent/`
  - `FreeKundli/`, `FreeReportContent/`
  - `hooks/useKundli.js`
- `src/redux/kundli/kundliSlice.js` — Kundli state
- `src/redux/kundliform/formSlice.js` — Form state
- `src/redux/api/kundli/` — API endpoints (`kundliApi`, `ashtakvargaApi`, `dashaApi`, `planetApi`)
- `src/services/appServices/kundaliServices.js` — Business logic

---

### 4.5 Horoscope

Daily, weekly, monthly, and yearly zodiac predictions.

| Feature | Path | Description |
|---|---|---|
| **Daily Horoscope** | `/horoscopes` | Today's predictions for all 12 signs |
| **Yesterday** | `/horoscopes/yesterday` | Previous day's horoscope |
| **Tomorrow** | `/horoscopes/tomorrow` | Next day's predictions |
| **Weekly** | `/horoscopes/weekly` | Weekly outlook |
| **Monthly** | `/horoscopes/monthly` | Monthly predictions |
| **Yearly** | `/horoscopes/yearly` | Annual forecast |
| **Detail View** | `/horoscopes/:sign` | In-depth sign analysis |
| **Zodiac Carousel** | — | Interactive sign selector |

**Key Files:**
- `src/screens/private/horoscope/` — All horoscope screens
  - `dailyHoroscope/`, `weeklyHoroscope/`, `monthlyHoroscope/`, `yearlyHoroscope/`
  - `tomorrowhoroscope/`, `yesterdayhoroscope/`
  - `zodiacCarousel/`, `sidebar/`
- `src/redux/api/horoscope/zodiacApi.js` — Horoscope API

---

### 4.6 Tarot Readings

15+ tarot reading types with animated card selection.

| Reading Type | Description |
|---|---|
| **One Card Tarot** | Single card daily guidance |
| **Three Card Tarot** | Past-Present-Future spread |
| **Daily Tarot** | Daily card pull |
| **Yes/No Tarot** | Binary answer readings |
| **Love Triangle** | Relationship dynamics |
| **In-Depth Love** | Detailed love analysis |
| **Flirt Tarot** | Flirtation and attraction |
| **Erotic Love** | Intimate connection reading |
| **Career Select** | Career guidance |
| **Wellness Tarot** | Health and wellness |
| **Romantic Breakup** | Relationship ending guidance |
| **Business Breakup** | Professional separation |
| **Made For Each Other** | Compatibility reading |

**Key Files:**
- `src/screens/private/tarot/` — All tarot screens
  - `oneCardTarot/`, `threeCardTarot/`, `dailyTarot/`, `yesNoTarot/`
  - `loveTriangleTarot/`, `inDepthLove/`, `flirtTarot/`, `eroticLove/`
  - `careerSelectTarot/`, `wellNessTarot/`
  - `romanticBreakupTarot/`, `buisnessBreakupTarot/`, `madeForEachOther/`
  - `resultTarot/`, `card/`
  - `v2/` — New tarot implementation
- `src/redux/api/tarot/` — Tarot API endpoints

---

### 4.7 Panchang (Hindu Calendar)

Traditional Hindu calendar with auspicious timing information.

| Feature | Path | Description |
|---|---|---|
| **Today's Panchang** | `/panchang` | Current day's panchang details |
| **Vaar** | `/panchang/vaar` | Day of the week significance |
| **Tithi** | `/panchang/tithi` | Lunar day information |

**Key Files:**
- `src/screens/private/panchang/` — `todayPanchang/`, `vaar/`, `tithi/`
- `src/redux/api/panchang/` — Panchang API

---

### 4.8 Matchmaking & Compatibility

Kundli matching and zodiac compatibility analysis.

| Feature | Path | Description |
|---|---|---|
| **Kundli Matching** | `/matchmaking` | Traditional Ashtakoot matching (36 gunas) |
| **Match Details** | `/matchmaking/details` | Detailed compatibility report |
| **Zodiac Compatibility** | `/compatibility` | Sign-based compatibility |
| **Partner Selection** | `/compatibility/select` | Choose partner sign |
| **Compatibility Result** | `/compatibility/result` | Detailed compatibility analysis |

**Key Files:**
- `src/screens/private/matchmaking/` — `MatchMakingV2.jsx`, `details/MatchDetailsV2.jsx`
- `src/screens/private/compatibility/` — `CompatibilityLanding.jsx`, `SelectPartner.jsx`, `CompatibilityResult.jsx`

---

### 4.9 Numerology

Name and number-based numerological analysis.

| Feature | Description |
|---|---|
| **Numerology Landing** | Main numerology hub |
| **Life Path Number** | Calculate and interpret life path number |
| **Life Path Form** | Birth date input for calculation |
| **Life Path Details** | Detailed life path interpretation |

**Key Files:**
- `src/screens/private/numerology/` — `Numerology.jsx`, `lifepath/`
- `src/redux/api/numerology/` — Numerology API
- `src/services/appServices/numerologyServices.js`

---

### 4.10 Calculators

20+ specialized astrological and numerological calculators.

| Calculator | Description |
|---|---|
| **Age Calculator** | Precise age calculation with astrological context |
| **Atmakaraka** | Soul significator planet calculator |
| **Birth Calculator** | Birth chart quick calculator |
| **Dasha Calculator** | Planetary period calculator |
| **Destiny Number** | Destiny/expression number |
| **FLAMES** | Fun relationship compatibility game |
| **Friendship** | Friendship compatibility score |
| **Kaal Sarp Dosha** | Kaal Sarp Yoga detection |
| **Love Calculator** | Love compatibility percentage |
| **Mangal Dosha** | Mars affliction checker |
| **Mobile Number** | Mobile number numerology |
| **Numerology** | Name numerology calculator |
| **Rashi (Moon Sign)** | Moon sign determination |
| **Rising Sign** | Ascendant/Lagna calculator |
| **Shani Sade Sati** | Saturn transit period checker |
| **Sun Sign** | Sun sign calculator |
| **Vehicle Number** | Vehicle number numerology |

Each calculator follows a consistent pattern: **Input Form → Calculation → Report Display**

**Key Files:**
- `src/screens/private/calculator/` — 17 subdirectories, each with `Calc` + `Report` components
- `src/redux/api/calculator/` — Calculator API endpoints
- `src/redux/api/baseApi/calculatorApi.js` — Calculator base API

---

### 4.11 AI-Powered Features (AIWow)

Computer vision and AI-driven astrological analysis tools.

| Feature | Flow | Description |
|---|---|---|
| **Palmistry** | Landing → Hand Selection → Instructions → Camera → Analysis → Result | AI palm line reading |
| **Face Reading** | Landing → Instructions → Camera → Analysis → Result | Facial feature analysis |
| **Signature Analysis** | Landing → Instructions → Camera → Analysis → Result | Handwriting/signature interpretation |
| **Gemstone Verification** | Landing → Instructions → Camera → Analysis → Result | Gemstone authenticity check |
| **Cloth Color Analysis** | Form → Instructions → Camera → Analysis → Result | Color-based personality reading |
| **Aura Photography** | Landing → Instructions → Camera → Analysis → Result | Aura energy visualization |
| **Talk to Kundli** | Chat interface | AI-powered kundli Q&A |
| **Cosmic Chat** | Chat interface | General astrology AI assistant |
| **Daily Cosmic Briefing** | Dashboard | AI-generated daily insights |
| **Dream Interpreter** | Input → Result | AI dream analysis |
| **Agentic Calendar** | Calendar view | AI-powered auspicious date finder |
| **Smart Matchmaking** | Input → Result | AI-enhanced compatibility analysis |

**Key Files:**
- `src/screens/private/aiwow/` — All AI feature screens
  - `palmistry/`, `facereading/`, `signature/`, `gemstone/`, `clothcolor/`, `aura/`
  - `talktokundli/`, `cosmicchat/`, `dailycosmicbriefing/`, `dreaminterpreter/`
  - `agenticcalendar/`, `smartmatchmaking/`
  - `components/` — Shared AIWow components
  - `hooks/` — AI feature hooks
- `src/redux/aiwow/aiwowSlice.js` — AIWow state
- `src/redux/api/aiwow/` — AIWow API endpoints
- `src/services/appServices/aiWowService.js` — AI service layer
- `src/utils/hooks/useFaceDetection.js`, `useHandDetection.js`, `useObjectDetection.js`

---

### 4.12 Live Streaming

Real-time astrology sessions with interactive features.

| Feature | Description |
|---|---|
| **Live Discovery** | Browse active live sessions |
| **Live Player** | Watch live astrology sessions |
| **Interactive Streaming** | Participate in live sessions |
| **Gift Support** | Send gifts to live astrologers |
| **Astrologer Status** | Real-time online/offline status |

**Key Files:**
- `src/screens/private/astroLive/` — `AstroLive.jsx`, `streaming/Streaming.jsx`
- `src/screens/private/home/components/livestream/` — `InteractiveLiveStreaming.jsx`, `LivePlayerPage.jsx`
- `src/context/LiveListContext.jsx` — Live streaming state

---

### 4.13 E-Commerce & E-Pooja

Marketplace for astrology products and spiritual services.

#### ShubhMall (Product Marketplace)

| Feature | Description |
|---|---|
| **Product Listing** | Browse astrology products |
| **Consultant Services** | Book consultant services |
| **Product Details** | Detailed product view with media |
| **Shopping Cart** | Cart management |

#### E-Pooja (Spiritual Services)

| Feature | Description |
|---|---|
| **Category Browse** | Browse pooja categories |
| **Purpose Filter** | Filter by purpose/occasion |
| **Service Details** | Detailed pooja information |
| **Booking Flow** | Book pooja services |
| **Cart & Checkout** | Multi-item cart with checkout |
| **Payment** | Integrated payment processing |

**Key Files:**
- `src/screens/private/shop/` — `Shop.jsx`, `consultant/`, `product/`, `detail/`
- `src/screens/private/epooja/` — `booking/`, `cart/`, `category/`, `checkout/`, `detail/`, `payment/`, `purpose/`
- `src/redux/api/astromall/` — E-commerce API endpoints

---

### 4.14 Wallet & Payments

In-app wallet system with Razorpay integration.

| Feature | Description |
|---|---|
| **Wallet Balance** | View current balance |
| **Recharge** | Add funds via Razorpay |
| **Transaction History** | View all transactions |
| **Auto-Deduction** | Per-minute billing for consultations |
| **Low Balance Alert** | Warning when balance is low |
| **Recharge Prompts** | Contextual recharge suggestions |

**Key Files:**
- `src/screens/private/wallet/WalletTranscations.jsx`
- `src/screens/private/payment/` — `Payment.jsx`, `FinalPay.jsx`, `PaymentWebhook.jsx`
- `src/redux/api/wallet/` — Wallet API
- `src/redux/api/payment/` — Payment API
- `src/utils/hooks/useRazorpay.js` — Razorpay integration hook
- `src/utils/hooks/useWalletBalanceCheck.js` — Balance validation
- `src/component/UI/modal/RechargeModal/`, `LowBalanceModal/`

---

### 4.15 User Profile & Settings

| Feature | Description |
|---|---|
| **Profile View** | User profile dashboard |
| **Add Profile** | Create new birth profiles |
| **Edit Profile** | Modify existing profiles |
| **Profile Manager** | Multi-profile management |
| **Followed Astrologers** | List of followed astrologers |
| **Privacy & Security** | Privacy settings |

**Key Files:**
- `src/screens/v2/user/` — `Profile.jsx`, `AddProfile.jsx`, `EditProfile.jsx`
- `src/screens/private/profile/` — Legacy profile screens
- `src/component/UI/Profile/` — `ProfileManager.jsx`, `ProfileSelector.jsx`, `AddProfileModal.jsx`, `EditProfileModal.jsx`

---

### 4.16 Notifications

| Feature | Description |
|---|---|
| **Notification Center** | View all notifications |
| **Push Notifications** | Firebase Cloud Messaging |
| **Chat Notifications** | Real-time chat alerts |
| **Call Notifications** | Incoming call alerts |

**Key Files:**
- `src/screens/private/notification/Notification.jsx`
- `src/services/fcmService.jsx` — FCM setup
- `src/services/firebase.js` — Firebase config
- `src/component/UI/ChatNotificationBanner/`

---

### 4.17 Blog & Content

| Feature | Description |
|---|---|
| **Blog Listing** | Browse astrology articles |
| **Single Blog** | Full article view |
| **Blog Cards** | Article preview cards |
| **Trending/Popular** | Curated blog sections |
| **Video Content** | Astrology video library |

**Key Files:**
- `src/screens/private/blog/` — `Blog.jsx`, `blogHeader/SingleBlog.jsx`
- `src/screens/private/video/` — `Video.jsx`, `videoHeader/`
- `src/services/appServices/blogService.js`

---

### 4.18 Order & Session History

| Feature | Description |
|---|---|
| **Session Details** | View past consultation details |
| **Call History** | Voice/video call records |
| **Chat History** | Text chat records |
| **Order History** | E-commerce order tracking |
| **AstroMall History** | Product purchase history |

**Key Files:**
- `src/screens/private/sessionDetails/SessionDetails.jsx`
- `src/screens/private/orderHistory/` — `components/` (CallHistory, ChatHistory)
- `src/screens/private/shubhAstroMallHistory/`
- `src/redux/api/callHistory/`, `src/redux/api/chatHistory/`

---

### 4.19 Customer Support

| Feature | Description |
|---|---|
| **FAQ** | Frequently asked questions |
| **Customer Support** | Support contact page |
| **Support Tickets** | Create and track tickets |
| **Ticket Details** | View ticket status and responses |

**Key Files:**
- `src/screens/v2/user/FAQ.jsx`, `CustomerSupport.jsx`
- `src/screens/v2/user/RecentTickets.jsx`, `TicketDetails.jsx`
- `src/redux/api/supportApi/supportApi.js`

---]]>
<![CDATA[

## 5. Real-Time Communication Layer

### Socket.io Architecture

ShubhTalk uses a unified Socket.io connection for all real-time features.

```
┌──────────────────────────────────────────────────────┐
│                   voiceSocket (Socket.io)             │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Call Events │  │ Chat Events │  │ Live Events │  │
│  │             │  │             │  │             │  │
│  │ call:room   │  │ chat:room   │  │ live:status │  │
│  │ call:accept │  │ chat:accept │  │ activity    │  │
│  │ call:reject │  │ chat:reject │  │ warning     │  │
│  │ call:end    │  │ chat:end    │  │ error       │  │
│  │ call:cancel │  │ message:recv│  │             │  │
│  │ call:reconn │  │ chat:reconn │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Auto-Reconnection System

The platform implements robust session recovery:

1. **Session Persistence** — Active call/chat sessions are saved to `localStorage` with a 30-minute expiry
2. **Socket Reconnect** — On socket reconnection, the client emits `call:reconnect` or `chat:reconnect`
3. **Server Recovery** — Backend responds with `call:reconnected` or `chat:reconnected` if session is still active
4. **State Restoration** — Call/chat UI is restored with timer continuation
5. **Graceful Cleanup** — Expired or ended sessions are cleared automatically

### Agora RTC Integration

| Feature | Implementation |
|---|---|
| **Voice Calls** | Audio-only RTC channel |
| **Video Calls** | Audio + Video RTC channel |
| **Call Upgrade** | Dynamic audio → video switch |
| **Token Management** | Server-generated Agora tokens via `useAgoraToken` hook |
| **Client Setup** | `agoraClient.jsx` — RTC client initialization |

---

## 6. State Management Architecture

### Redux Store Structure

```
Redux Store (Persisted)
│
├── auth                    ← Authentication state (persisted)
│   ├── isLoggedIn
│   ├── token
│   ├── isRegister
│   └── isVerified
│
├── form                    ← Kundli form state
│   └── birth details, location, etc.
│
├── kundli                  ← Kundli data (persisted)
│   └── chart data, profiles, etc.
│
├── aiwow                   ← AIWow features state
│   └── analysis results, camera state, etc.
│
├── remedy                  ← Remedy suggestions state
│
├── astrologyApi            ← baseApi (3rd-party astrology)
├── privateRequestNew       ← Internal backend API cache
├── localReuqqestApi        ← Local API cache
├── pythonApi               ← Python backend cache
├── horoscopeApi            ← Horoscope data cache
├── vedicApi                ← Vedic calculations cache
├── astroTarotApi           ← Tarot readings cache
├── geoApi                  ← Geolocation cache
└── calculatorApi           ← Calculator results cache
```

### Context Providers

| Context | Purpose | Key State |
|---|---|---|
| **CallProvider** | Voice/video call management | `activeCall`, `callSeconds`, `isCallMinimized`, `isMicOn`, `isSpeakerOn`, reconnection state |
| **ChatProvider** | Text chat management | `activeChat`, `chatSeconds`, `waitingList`, `chatApproval`, reconnection state |
| **LiveListProvider** | Live streaming state | Active streams, viewer counts |

---

## 7. API Architecture

### API Layer Overview

ShubhTalk integrates with 9 distinct API bases through RTK Query:

| API Base | Purpose | Auth Method |
|---|---|---|
| **baseApi** | Third-party astrology API (astrologyapi.com) | Basic Auth |
| **privateRequestNew** | Internal backend (primary) | Bearer Token |
| **localReuqqestApi** | Local/internal API | Bearer Token |
| **pythonApi** | Python backend services | Bearer Token |
| **horoscopeApi** | Horoscope data service | Basic Auth |
| **vedicApi** | Vedic astrology calculations | Basic Auth |
| **calculatorApi** | Calculator endpoints | Basic Auth |
| **astroTarotApi** | Tarot reading service | Basic Auth |
| **geoApi** | Geolocation services | API Key |

### Feature API Endpoints

| Domain | API File | Endpoints |
|---|---|---|
| **Astrologer** | `astrologerApi.js` | List, profile, search, filter |
| **Follow** | `followAstrologerApi.js` | Follow/unfollow astrologers |
| **Kundli** | `kundliApi.js` | Create, read, update charts |
| **Ashtakvarga** | `ashtakvargaApi.js` | Ashtakvarga calculations |
| **Dasha** | `dashaApi.js` | Dasha period data |
| **Horoscope** | `zodiacApi.js` | Daily/weekly/monthly/yearly |
| **Tarot** | `tarotApi.js` | Card readings |
| **Panchang** | `panchangApi.js` | Calendar data |
| **Numerology** | `numerologyApi.js` | Number calculations |
| **Compatibility** | `compatibilityApi.js` | Sign matching |
| **Calculator** | `calculatorApi.js` | All calculator endpoints |
| **AIWow** | `aiwowApi.js` | AI analysis endpoints |
| **Wallet** | `walletApi.js` | Balance, transactions |
| **Payment** | `paymentApi.js` | Razorpay integration |
| **Gift** | `giftApi.js` | Virtual gifts |
| **Review** | `reviewApi.js` | Astrologer reviews |
| **Support** | `supportApi.js` | Customer support tickets |
| **Plans** | `plansApi.js` | Subscription plans |
| **S3** | `s3SignedApi.js` | File upload URLs |

---

## 8. Routing & Navigation

### Route Categories

| Category | Guard | Description |
|---|---|---|
| **Public Routes** | `PublicRoute` | Accessible without login (auth pages, static pages) |
| **Private Routes** | `PrivateRoute` | Require authentication |
| **Mixed Routes** | `MixedRoute` | Accessible to all, some features limited |

### Route Map (100+ Routes)

#### Public Routes
```
/login                          → Login/Onboarding
/register                       → Registration
/forgot-password                → Password Recovery
/otp-verification               → OTP Verification
/aboutus                        → About Us
/privacy-policy                 → Privacy Policy
/terms-conditions               → Terms & Conditions
/disclaimer                     → Disclaimer
/pricing-policy                 → Pricing Policy
/refund-policy                  → Refund Policy
```

#### Core Feature Routes
```
/                               → Home Dashboard
/explore                        → Feature Explorer
/horoscopes                     → Horoscope Hub
/horoscopes/:sign               → Sign Detail
/horoscopes/yesterday           → Yesterday's Horoscope
/horoscopes/tomorrow            → Tomorrow's Horoscope
/horoscopes/weekly              → Weekly Horoscope
/horoscopes/monthly             → Monthly Horoscope
/kundli                         → Kundli Generator
/kundli/:kundliId               → Saved Kundli View
/tarot/*                        → Tarot Readings (15+ sub-routes)
/panchang                       → Today's Panchang
/matchmaking                    → Kundli Matching
/compatibility                  → Zodiac Compatibility
/numerology                     → Numerology Hub
```

#### Consultation Routes
```
/talk-to-astrologers            → Astrologer Listing
/chat-with-astrologers          → Chat Listing
/chat-with-astrologers/:id      → Chat Window
/talk-to-astrologers/voice-call/:roomId    → Voice Call
/talk-to-astrologers/video-call/:channel   → Video Call
/astrologer/:id                 → Astrologer Profile
```

#### Calculator Routes
```
/calculator/age                 → Age Calculator
/calculator/atmakaraka          → Atmakaraka Calculator
/calculator/birth               → Birth Calculator
/calculator/dasha               → Dasha Calculator
/calculator/destiny             → Destiny Number
/calculator/flames              → FLAMES Calculator
/calculator/friendship          → Friendship Calculator
/calculator/kaalsarp            → Kaal Sarp Dosha
/calculator/love                → Love Calculator
/calculator/mangaldosha         → Mangal Dosha
/calculator/mobile              → Mobile Number
/calculator/numerology          → Numerology Calculator
/calculator/rashi               → Rashi Calculator
/calculator/risingsign          → Rising Sign
/calculator/shanisadesati       → Shani Sade Sati
/calculator/sunsign             → Sun Sign
/calculator/vehicle             → Vehicle Number
```

#### AI Features Routes
```
/aiwow                          → AI Features Hub
/aiwow/palmistry/*              → Palm Reading Flow
/aiwow/facereading/*            → Face Reading Flow
/aiwow/signature/*              → Signature Analysis Flow
/aiwow/gemstone/*               → Gemstone Verification Flow
/aiwow/clothcolor/*             → Cloth Color Analysis Flow
/aiwow/aura/*                   → Aura Photography Flow
/aiwow/talktokundli             → AI Kundli Chat
/aiwow/cosmicchat               → Cosmic AI Chat
/aiwow/dreaminterpreter         → Dream Interpretation
/aiwow/agenticcalendar          → AI Calendar
/aiwow/smartmatchmaking         → AI Matchmaking
```

#### Commerce & User Routes
```
/shop                           → Product Marketplace
/epooja/*                       → E-Pooja Services
/wallet-transactions            → Wallet & Transactions
/payment                        → Payment Processing
/profile                        → User Profile
/notifications                  → Notification Center
/order-history                  → Order History
/session-details                → Session Details
/blog                           → Blog Listing
/blog/:slug                     → Blog Article
```

---

## 9. Reusable Component Library

### Component Categories

#### Cards (`src/component/UI/cards/`)

| Component | Purpose |
|---|---|
| `AstrologersCard` | Astrologer profile card with status, rating, price |
| `ChatAstrologerCard` | Astrologer card optimized for chat listing |
| `LiveAstroCard` | Live streaming astrologer card |
| `RecommendedAstrologerCard` | AI-recommended astrologer card |
| `TopAstrologerCard` | Top-rated astrologer card |
| `BlogCard` | Blog article preview card |
| `NewsCard` | News article card |
| `ContentCard` | Generic content display card |
| `ImageTextCard` | Image + text layout card |
| `PanchangCards` | Panchang information display |
| `WorkInProgressCard` | Coming soon placeholder |
| `TrendingBlogsCarousel` | Horizontal blog carousel |
| `connectCard/` | Consultation connection cards |
| `newAstrologerCard/` | Redesigned astrologer cards |
| `tarotReadingCard/` | Tarot reading type cards |

#### Modals (`src/component/UI/modal/`)

| Component | Purpose |
|---|---|
| `Modal` | Base modal wrapper |
| `RechargeModal` | Wallet recharge flow |
| `LowBalanceModal` | Low balance warning |
| `EmergencySessionModal` | Emergency session handling |
| `waitingModal` | Astrologer waiting state |
| `waitlistModal` | Queue position display |
| `tarotCardModal` | Tarot card reveal |
| `deleteModal` | Delete confirmation |
| `detailsModal` | Detail information display |
| `inActivity` | Inactivity timeout warning |
| `liveModal` | Live session modals |
| `RecommendModal` | Astrologer recommendation |

#### Form Controls (`src/component/formikcontrols/`)

| Component | Purpose |
|---|---|
| `FormikControl` | Universal form control wrapper |
| `input/` | Text input with validation |
| `password/` | Password input with visibility toggle |
| `date/` | Date picker with validation |
| `checkbox/` | Checkbox with label |

#### Profile Management (`src/component/UI/Profile/`)

| Component | Purpose |
|---|---|
| `ProfileManager` | Multi-profile management interface |
| `ProfileSelector` | Profile selection dropdown |
| `AddProfileModal` | New profile creation |
| `EditProfileModal` | Profile editing |
| `ProfileListingModal` | Profile list display |
| `useProfileManager` | Profile management hook |

#### Other UI Components

| Component | Purpose |
|---|---|
| `PrimaryLoader` | Full-screen loading indicator |
| `CircleSpinner` | Inline loading spinner |
| `AccordionSection` | Expandable content sections |
| `ChatNotificationBanner` | Real-time chat notification |
| `PrimaryTabs` | Tab navigation |
| `PieChart` | Data visualization |
| `WheelDatePicker` | Mobile-friendly date picker |
| `KundliSummary` | Kundli overview display |
| `EmptyState` | Empty state placeholder |
| `Pagination` | Page navigation |

#### Pandit AI (`src/component/panditAI/`)

| Component | Purpose |
|---|---|
| `PanditAIBubble` | Floating AI chat bubble |
| `usePanditAI` | AI interaction hook |
| `useSpeechToText` | Voice input for AI |
| `translateText` | Multi-language support |

---

## 10. Services Layer

### Request Handlers

| Service | Purpose |
|---|---|
| `privateRequest.js` | Authenticated Axios instance with token injection, error interceptors, and auto-logout |
| `publicRequest.js` | Public Axios instance for unauthenticated endpoints |
| `privateRequestNew.js` | RTK Query base API for internal backend |

### App Services (`src/services/appServices/`)

| Service | Purpose |
|---|---|
| `authService.js` | Login, register, OTP, password reset |
| `homeServices.js` | Home page data fetching |
| `kundaliServices.js` | Kundli CRUD operations |
| `kundliServicesNew.js` | Updated kundli service |
| `numerologyServices.js` | Numerology calculations |
| `blogService.js` | Blog article fetching |
| `AshtakVargaServices.js` | Ashtakvarga calculations |
| `aiWowService.js` | AI feature API calls |
| `transactionService.js` | Payment transaction handling |

### Real-Time Services

| Service | Purpose |
|---|---|
| `socketService.js` | Chat message socket management |
| `voiceSocketServices.js` | Call/chat socket with auto-reconnection |
| `firebase.js` | Firebase app configuration |
| `fcmService.jsx` | Push notification setup and handling |

---

## 11. Project Structure

```
shubhtalk/
├── public/
│   ├── css/                    # 268 pre-minified CSS modules
│   ├── images/                 # Static images (tarot cards, etc.)
│   ├── models/                 # Face detection ML models
│   ├── firebase-messaging-sw.js
│   └── notification.mp3
│
├── src/
│   ├── App.jsx                 # Root component with router setup
│   ├── App.module.scss         # Root styles
│   ├── SocketConnector.jsx     # Socket initialization
│   │
│   ├── screens/
│   │   ├── public/             # 10+ public pages
│   │   │   ├── onboarding/
│   │   │   ├── static-pages/   # About, Privacy, Terms, etc.
│   │   │   └── Login, Register, OTP, etc.
│   │   │
│   │   ├── private/            # 30+ feature modules
│   │   │   ├── home/           # Dashboard
│   │   │   ├── explore/        # Feature discovery
│   │   │   ├── talkToAstrologer/  # Consultations
│   │   │   ├── astrologerProfile/ # Astrologer profiles
│   │   │   ├── kundli/         # Birth charts (8 sub-modules)
│   │   │   ├── horoscope/      # Predictions (8 sub-modules)
│   │   │   ├── tarot/          # Tarot readings (15+ types)
│   │   │   ├── panchang/       # Hindu calendar
│   │   │   ├── matchmaking/    # Kundli matching
│   │   │   ├── compatibility/  # Zodiac compatibility
│   │   │   ├── numerology/     # Numerology
│   │   │   ├── calculator/     # 17 calculators
│   │   │   ├── aiwow/          # 12 AI features
│   │   │   ├── astroLive/      # Live streaming
│   │   │   ├── shop/           # E-commerce
│   │   │   ├── epooja/         # E-Pooja services
│   │   │   ├── wallet/         # Wallet management
│   │   │   ├── payment/        # Payment processing
│   │   │   ├── profile/        # User profile
│   │   │   ├── notification/   # Notifications
│   │   │   ├── blog/           # Blog content
│   │   │   ├── orderHistory/   # Order tracking
│   │   │   └── ...
│   │   │
│   │   ├── v2/                 # Redesigned screens
│   │   │   ├── home/           # New home page
│   │   │   └── user/           # New user management
│   │   │
│   │   └── landing-v2/         # New landing pages
│   │
│   ├── component/
│   │   ├── UI/                 # UI component library
│   │   │   ├── cards/          # 15+ card types
│   │   │   ├── modal/          # 12+ modal types
│   │   │   ├── tabs/           # Tab components
│   │   │   ├── charts/         # Chart visualizations
│   │   │   ├── table/          # Data tables
│   │   │   ├── Profile/        # Profile management
│   │   │   └── ...
│   │   ├── formikcontrols/     # Form inputs
│   │   ├── call/               # Call UI components
│   │   ├── panditAI/           # AI assistant
│   │   └── emptyState/         # Empty states
│   │
│   ├── redux/
│   │   ├── auth/               # Auth slice
│   │   ├── kundli/             # Kundli slice
│   │   ├── kundliform/         # Form slice
│   │   ├── aiwow/              # AIWow slice
│   │   ├── remedy/             # Remedy slice
│   │   └── api/                # 20+ API definitions
│   │       ├── baseApi/        # 5 base API configs
│   │       ├── astrologer/     # Astrologer APIs
│   │       ├── kundli/         # Kundli APIs
│   │       ├── horoscope/      # Horoscope APIs
│   │       ├── tarot/          # Tarot APIs
│   │       ├── calculator/     # Calculator APIs
│   │       ├── aiwow/          # AIWow APIs
│   │       ├── wallet/         # Wallet APIs
│   │       ├── payment/        # Payment APIs
│   │       └── ...
│   │
│   ├── services/
│   │   ├── appServices/        # 10+ business services
│   │   ├── privateRequest.js   # Auth HTTP client
│   │   ├── publicRequest.js    # Public HTTP client
│   │   ├── socketService.js    # Chat socket
│   │   ├── voiceSocketServices.js  # Call socket
│   │   ├── firebase.js         # Firebase config
│   │   └── fcmService.jsx      # Push notifications
│   │
│   ├── context/
│   │   ├── CallContext.jsx     # Call state provider
│   │   ├── ChatContext.jsx     # Chat state provider
│   │   └── LiveListContext.jsx # Live stream provider
│   │
│   ├── layouts/
│   │   ├── HomeLayout.jsx      # Main app layout
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── Footer.jsx          # Footer
│   │   └── NavigationSetup.jsx # Route config
│   │
│   ├── utils/
│   │   ├── routes/             # Route definitions & guards
│   │   ├── hooks/              # 13+ custom hooks
│   │   ├── helper/             # Utility functions
│   │   ├── constanats/         # Constants & metadata
│   │   ├── dateFormat/         # Date utilities
│   │   ├── location/           # Location search
│   │   ├── theme.js            # Theme colors
│   │   ├── appImages.js        # Image imports
│   │   └── ...
│   │
│   ├── agora/                  # Agora RTC integration
│   ├── socket/                 # Socket.io config
│   ├── store/                  # Redux store setup
│   └── assets/                 # Static assets
│       ├── aiwow/              # AI feature assets
│       ├── chat/               # Chat UI assets
│       ├── default-img/        # Default images
│       ├── explore/            # Explore assets
│       ├── gif/                # Loading animations
│       ├── icons/              # Icon assets
│       ├── images/             # General images
│       ├── svg/                # SVG assets
│       └── variables/          # SCSS variables
│
├── .env-cmdrc                  # Environment configs
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint configuration
├── postcss.config.js           # PostCSS configuration
└── tailwind.config.js          # Tailwind configuration
```

---

## 12. Environment & Build Configuration

### Environment Management

Uses `env-cmd` with `.env-cmdrc` for multi-environment support:

| Environment | Command | Purpose |
|---|---|---|
| **Development** | `npm run start` | Local development |
| **Staging** | `npm run start-stage` | Pre-production testing |
| **Production** | `npm run start-prod` | Production environment |

### Build Commands

| Command | Purpose |
|---|---|
| `npm run start` | Start dev server (development) |
| `npm run start-stage` | Start dev server (staging) |
| `npm run start-prod` | Start dev server (production) |
| `npm run build` | Build for development |
| `npm run build-stage` | Build for staging |
| `npm run build-prod` | Build for production |
| `npm run preview` | Preview production build |

### Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_APP_API_BASE_URL` | Backend API base URL |
| `VITE_VEDIC_API_USER_ID` | Vedic API credentials |
| `VITE_VEDIC_API_KEY` | Vedic API key |
| `VITE_FIREBASE_*` | Firebase configuration |
| `VITE_AGORA_APP_ID` | Agora RTC app ID |
| `VITE_RAZORPAY_KEY` | Razorpay payment key |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps API key |

### Code Quality

| Tool | Configuration |
|---|---|
| **ESLint 9** | Flat config with React Hooks and React Refresh rules |
| **Ignored Patterns** | Unused vars starting with uppercase or underscore |
| **SCSS Modules** | Component-scoped styling convention |
| **Tailwind CSS** | Utility classes alongside SCSS modules |

---

<div align="center">

---

**ShubhTalk** — Connecting Stars to Lives ✨

*Built with React 19 • Vite 7 • Redux Toolkit • Socket.io • Agora RTC*

---

</div>]]>