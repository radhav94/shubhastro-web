# Cosmic Chat Feature

AI-powered cosmic guidance assistant that provides insights based on the user's birth chart, planetary transits, and universal energies.

## Flow

1. **Profile Selection** (Modal on AI Wow page)
   - User selects their Kundli profile
   - Profile data stored in localStorage as `selectedKundliProfile`

2. **Chat Interface** (`CosmicChat.jsx`)
   - Real-time chat with Cosmic AI
   - Session-based conversation
   - Suggested cosmic questions for first-time users
   - Message history with timestamps
   - Focus on cosmic energies, planetary transits, and spiritual guidance

## API Integration

### Base URL
```
https://devapi-shubhtalk.epicon.in/api/wow-suite/cosmic-chat
```

### Endpoints

#### 1. Start Session
**POST** `/session`

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
  "userId": "",
  "kundliData": {
    "name": "John Doe",
    "gender": "Male",
    "day": 15,
    "month": 8,
    "year": 1990,
    "hour": 14,
    "min": 30,
    "second": 0,
    "place": "Mumbai, Maharashtra, India",
    "lat": "19.0760",
    "lon": "72.8777",
    "tzone": 5.5,
    "sunSign": "Leo",
    "moonSign": "Taurus",
    "ascendant": "Virgo"
  },
  "isGuestSession": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "773e8dd1-adf8-4328-bb6d-c566fab15536",
    "welcomeMessage": "Namaste! I am your Cosmic Chat AI...",
    "suggestedQuestions": [
      "What cosmic energies are influencing me today?",
      "How can I align with the universe's flow?",
      "What spiritual lessons should I focus on?",
      "How do planetary transits affect my life?"
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
  "sessionId": "773e8dd1-adf8-4328-bb6d-c566fab15536",
  "message": "What does my birth chart say about my career prospects?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on your birth chart and current planetary transits...",
    "timestamp": "2026-01-23T10:56:21.468Z"
  }
}
```

## Components

### CosmicChat
- Header with back button and profile info
- Scrollable messages container
- User messages (right-aligned, orange gradient)
- AI messages (left-aligned, white background)
- Typing indicator during AI response
- Suggested cosmic questions (shown after welcome message)
- Input field with send button
- Auto-scroll to latest message

## Routes

```javascript
COSMIC_CHAT: {
  path: "/aiwow/cosmic-chat",
  element: CosmicChat,
  header: false,
  footer: false,
}
```

## Features

- ✅ Session-based chat with Cosmic AI
- ✅ Personalized cosmic guidance based on birth chart
- ✅ Real-time message updates
- ✅ Typing indicator
- ✅ Suggested cosmic questions
- ✅ Message timestamps
- ✅ Auto-scroll to latest message
- ✅ Error handling with user-friendly messages
- ✅ Profile selection integration
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Focus on cosmic energies and spiritual guidance

## Styling

- Uses SCSS Modules for styling
- Orange gradient theme matching AI Wow branding
- Smooth animations and transitions
- Mobile-first responsive design
- Chat bubble design with proper alignment
- Fixed header and input container

## Error Handling

- Session start failure → Redirects to AI Wow page
- Message send failure → Shows error message in chat
- No profile selected → Redirects to AI Wow page with error toast
- Direct URL access without profile → Redirects to AI Wow page
- Network errors → User-friendly error messages via Toast

## Service Layer

Service functions in `src/services/appServices/aiWowService.js`:

- `startCosmicChat(kundliData)` - Starts a new cosmic chat session
- `sendCosmicChatMessage(sessionId, message)` - Sends a message in the session

Both functions:
- Use global axios interceptor from `privateRequest.js`
- Return `{success, data}` or `{success: false, error, code}`
- Error handling done by interceptor (shows toast automatically)

## Usage

From AI Wow main page:
```javascript
handleFeatureClick('/aiwow/cosmic-chat')
```

This will:
1. Open profile selection modal
2. User selects profile
3. Profile stored in localStorage
4. Navigate to `/aiwow/cosmic-chat`
5. Session starts automatically
6. User can start chatting about cosmic energies

## Differences from Talk to Kundli

- **Focus**: Cosmic energies, planetary transits, spiritual guidance vs. general kundli questions
- **Tone**: More spiritual and cosmic-focused
- **API**: Different endpoint (`wow-suite/cosmic-chat` vs. `companion-suite/kundli-chat`)
- **Data Format**: Includes lat/lon/tzone as strings, gender field
- **Suggested Questions**: Cosmic and spiritual themed
