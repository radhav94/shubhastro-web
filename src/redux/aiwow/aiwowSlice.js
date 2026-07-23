import { createSlice } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

// Helper to create initial state for image-based modules
const createImageModuleState = (extraFields = {}) => ({
  result: null,
  image: null,
  ...extraFields,
});

// Helper to create initial state for chat modules
const createChatModuleState = () => ({
  messages: [],
});

// Initial state with optimized structure
const initialState = {
  // Image-based analysis modules
  aura: createImageModuleState(),
  faceReading: createImageModuleState(),
  palmistry: createImageModuleState({ selectedHand: null, resultId: null }),
  signature: createImageModuleState(),
  gemstone: createImageModuleState(),
  clothColor: createImageModuleState({ formData: null }),
  
  // Profile-based features
  selectedKundliProfile: null,
  
  // Chat modules
  cosmicChat: createChatModuleState(),
  talkToKundli: createChatModuleState(),

  // Result-based modules (persisted for back-navigation)
  dreamInterpreter: { result: null },
  smartMatchmaking: { result: null },
  muhuratCalendar: { result: null },
};

// Helper function to create generic reducers for image-based modules
const createImageModuleReducers = (moduleName, initialModuleState) => ({
  [`set${moduleName}Image`]: (state, action) => {
    state[moduleName.charAt(0).toLowerCase() + moduleName.slice(1)].image = action.payload;
  },
  [`set${moduleName}Result`]: (state, action) => {
    state[moduleName.charAt(0).toLowerCase() + moduleName.slice(1)].result = action.payload;
  },
  [`clear${moduleName}Data`]: (state) => {
    state[moduleName.charAt(0).toLowerCase() + moduleName.slice(1)] = initialModuleState;
  },
});

const aiwowSlice = createSlice({
  name: 'aiwow',
  initialState,
  reducers: {
    // Generic image setter (can be used for any module)
    setModuleImage: (state, action) => {
      const { module, image } = action.payload;
      if (state[module]) state[module].image = image;
    },
    
    // Generic result setter (can be used for any module)
    setModuleResult: (state, action) => {
      const { module, result } = action.payload;
      if (state[module]) state[module].result = result;
    },
    
    // Generic clear (can be used for any module)
    clearModuleData: (state, action) => {
      const module = action.payload;
      if (state[module] && typeof state[module] === 'object') {
        state[module] = initialState[module];
      }
    },

    // Specific actions for modules with unique fields
    // Aura
    setAuraImage: (state, action) => {
      state.aura.image = action.payload;
    },
    setAuraResult: (state, action) => {
      state.aura.result = action.payload;
    },
    clearAuraData: (state) => {
      state.aura = createImageModuleState();
    },

    // Face Reading
    setFaceReadingImage: (state, action) => {
      state.faceReading.image = action.payload;
    },
    setFaceReadingResult: (state, action) => {
      state.faceReading.result = action.payload;
    },
    clearFaceReadingData: (state) => {
      state.faceReading = createImageModuleState();
    },

    // Palmistry (has extra fields)
    setPalmistryImage: (state, action) => {
      state.palmistry.image = action.payload;
    },
    setPalmistrySelectedHand: (state, action) => {
      state.palmistry.selectedHand = action.payload;
    },
    setPalmistryResult: (state, action) => {
      state.palmistry.result = action.payload;
    },
    setPalmistryResultId: (state, action) => {
      state.palmistry.resultId = action.payload;
    },
    clearPalmistryData: (state) => {
      state.palmistry = createImageModuleState({ selectedHand: null, resultId: null });
    },

    // Signature
    setSignatureImage: (state, action) => {
      state.signature.image = action.payload;
    },
    setSignatureResult: (state, action) => {
      state.signature.result = action.payload;
    },
    clearSignatureData: (state) => {
      state.signature = createImageModuleState();
    },

    // Gemstone
    setGemstoneImage: (state, action) => {
      state.gemstone.image = action.payload;
    },
    setGemstoneResult: (state, action) => {
      state.gemstone.result = action.payload;
    },
    clearGemstoneData: (state) => {
      state.gemstone = createImageModuleState();
    },

    // Cloth Color (has extra field)
    setClothColorImage: (state, action) => {
      state.clothColor.image = action.payload;
    },
    setClothColorFormData: (state, action) => {
      state.clothColor.formData = action.payload;
    },
    setClothColorResult: (state, action) => {
      state.clothColor.result = action.payload;
    },
    clearClothColorData: (state) => {
      state.clothColor = createImageModuleState({ formData: null });
    },

    // Kundli Profile
    setSelectedKundliProfile: (state, action) => {
      state.selectedKundliProfile = action.payload;
    },
    clearSelectedKundliProfile: (state) => {
      state.selectedKundliProfile = null;
    },

    // Chat modules - optimized with generic handlers
    setChatMessages: (state, action) => {
      const { module, messages } = action.payload;
      if (state[module]) state[module].messages = messages;
    },
    addChatMessage: (state, action) => {
      const { module, message } = action.payload;
      if (state[module]?.messages) state[module].messages.push(message);
    },
    clearChatMessages: (state, action) => {
      const module = action.payload;
      if (state[module]?.messages) state[module].messages = [];
    },

    // Specific chat actions (for backward compatibility)
    setCosmicChatMessages: (state, action) => {
      state.cosmicChat.messages = action.payload;
    },
    addCosmicChatMessage: (state, action) => {
      state.cosmicChat.messages.push(action.payload);
    },
    clearCosmicChatMessages: (state) => {
      state.cosmicChat.messages = [];
    },
    setTalkToKundliMessages: (state, action) => {
      state.talkToKundli.messages = action.payload;
    },
    addTalkToKundliMessage: (state, action) => {
      state.talkToKundli.messages.push(action.payload);
    },
    clearTalkToKundliMessages: (state) => {
      state.talkToKundli.messages = [];
    },

    // Clear all AI Wow data
    clearAllAiwowData: () => initialState,

    // Dream Interpreter
    setDreamInterpreterResult: (state, action) => {
      state.dreamInterpreter.result = action.payload;
    },
    clearDreamInterpreterResult: (state) => {
      state.dreamInterpreter.result = null;
    },

    // Smart Matchmaking
    setSmartMatchmakingResult: (state, action) => {
      state.smartMatchmaking.result = action.payload;
    },
    clearSmartMatchmakingResult: (state) => {
      state.smartMatchmaking.result = null;
    },

    // Muhurat Calendar
    setMuhuratCalendarResult: (state, action) => {
      state.muhuratCalendar.result = action.payload;
    },
    clearMuhuratCalendarResult: (state) => {
      state.muhuratCalendar.result = null;
    },
  },
  extraReducers: (builder) => {
    // Listen to logout action from authSlice
    builder.addCase(logout, (state) => {
      state.selectedKundliProfile = null;
    });
  },
});

export const {
  // Generic actions
  setModuleImage,
  setModuleResult,
  clearModuleData,
  setChatMessages,
  addChatMessage,
  clearChatMessages,
  
  // Aura
  setAuraImage,
  setAuraResult,
  clearAuraData,
  
  // Face Reading
  setFaceReadingImage,
  setFaceReadingResult,
  clearFaceReadingData,
  
  // Palmistry
  setPalmistryImage,
  setPalmistrySelectedHand,
  setPalmistryResult,
  setPalmistryResultId,
  clearPalmistryData,
  
  // Signature
  setSignatureImage,
  setSignatureResult,
  clearSignatureData,
  
  // Gemstone
  setGemstoneImage,
  setGemstoneResult,
  clearGemstoneData,
  
  // Cloth Color
  setClothColorImage,
  setClothColorFormData,
  setClothColorResult,
  clearClothColorData,
  
  // Kundli Profile
  setSelectedKundliProfile,
  clearSelectedKundliProfile,
  
  // Cosmic Chat
  setCosmicChatMessages,
  addCosmicChatMessage,
  clearCosmicChatMessages,
  
  // Talk to Kundli
  setTalkToKundliMessages,
  addTalkToKundliMessage,
  clearTalkToKundliMessages,
  
  // Clear all
  clearAllAiwowData,

  // Dream Interpreter
  setDreamInterpreterResult,
  clearDreamInterpreterResult,

  // Smart Matchmaking
  setSmartMatchmakingResult,
  clearSmartMatchmakingResult,

  // Muhurat Calendar
  setMuhuratCalendarResult,
  clearMuhuratCalendarResult,
} = aiwowSlice.actions;

export default aiwowSlice.reducer;
