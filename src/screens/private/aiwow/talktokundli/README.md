# Talk to Your Kundli Feature

AI-powered chat assistant that provides personalized astrological insights based on the user's birth chart.

## Flow

1. **Landing Page** (`TalkToKundliLanding.jsx`)
   - Introduction to the feature
   - What you can ask (Career, Relationships, Life Purpose, Future)
   - How it works (3 steps)
   - "Start Chatting" button

2. **Profile Selection** (Modal)
   - User selects their Kundli profile
   - Uses existing `KundliProfileModal` component
   - Profile data stored in localStorage

3. **Chat Interface** (`TalkToKundliChat.jsx`)
   - Real-time chat with AI
   - Session-based conversation
   - Suggested questions for first-time users
   - Message history with timestamps

## API Integration

### Base URL
```
https://devapi-shubhtalk.epicon.in/api/companion-suite/kundli-chat
```

### Endpoints

#### 1. Start Session
**POST** `/start`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "kundliData": {
    "name": "string",
    "day": number,
    "month": number,
    "year": number,
    "hour": number,
    "min": number,
    "place": "string",
    "sunSign": "string",
    "moonSign": "string",
    "ascendant": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "KCHAT_1769165597955_03c94174",
    "isGuestSession": true,
    "kundliDetails": {
      "name": "test",
      "birthDate": "2/4/2020",
      "birthTime": "3:0",
      "birthPlace": "Texas",
      "sunSign": null,
      "moonSign": null,
      "ascendant": null
    },
    "welcomeMessage": "Namaste! I am your personalized Kundli AI...",
    "popularQuestions": [
      "When will I get married?",
      "What does my career future look like?",
      "How is my health according to my chart?",
      "When will my financial situation improve?",
      "What are my lucky colors and numbers?"
    ]
  }
}
```

#### 2. Send Message
**POST** `/message`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "sessionId": "string",
  "message": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "role": "user",
      "content": "When will I get married?",
      "timestamp": "2026-01-23T10:56:21.468Z"
    },
    "assistantMessage": {
      "role": "assistant",
      "content": "Namaste! Thank you for sharing your question...",
      "timestamp": "2026-01-23T10:56:21.468Z"
    },
    "category": "marriage",
    "processingTime": 10111
  }
}
```

## Components

### TalkToKundliLanding
- Hero section with feature introduction
- Features list (Career, Relationships, Life Purpose, Future)
- How it works steps
- Start button that opens profile selection modal

### TalkToKundliChat
- Header with back button and profile info
- Scrollable messages container
- User messages (right-aligned, orange gradient)
- AI messages (left-aligned, white background)
- Typing indicator during AI response
- Suggested questions (shown after welcome message)
- Input field with send button
- Auto-scroll to latest message

## Routes

```javascript
TALK_TO_KUNDLI_LANDING: {
  path: "/aiwow/talk-to-kundli",
  element: TalkToKundliLanding,
  header: false,
  footer: false,
},
TALK_TO_KUNDLI_CHAT: {
  path: "/aiwow/talk-to-kundli/chat",
  element: TalkToKundliChat,
  header: false,
  footer: false,
}
```

## Features

- ✅ Session-based chat with AI
- ✅ Personalized responses based on birth chart
- ✅ Real-time message updates
- ✅ Typing indicator
- ✅ Suggested questions
- ✅ Message timestamps
- ✅ Auto-scroll to latest message
- ✅ Error handling with user-friendly messages
- ✅ Profile selection integration
- ✅ Responsive design

## Styling

- Uses SCSS Modules for styling
- Orange gradient theme matching AI Wow branding
- Smooth animations and transitions
- Mobile-first responsive design
- Chat bubble design with proper alignment
- Fixed header and input container

## Error Handling

- Session start failure → Redirects to landing page
- Message send failure → Shows error message in chat
- No profile selected → Redirects to landing page
- Network errors → User-friendly error messages via Toast

## Dependencies

- React Router DOM (navigation)
- Axios (API calls)
- Toast component (error notifications)
- KundliProfileModal (profile selection)
- useGetAllKundlisQuery (fetch kundli profiles)

## Usage

From AI Wow main page:
```javascript
handleFeatureClick('/aiwow/talk-to-kundli')
```

This will:
1. Navigate to landing page
2. User clicks "Start Chatting"
3. Profile selection modal opens
4. User selects profile
5. Navigates to chat page
6. Session starts automatically
7. User can start chatting
