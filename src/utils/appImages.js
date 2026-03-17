//appicons

import Logo from "../assets/icons/logo.png";
import Call from "../assets/icons/phone.png";
import Chat from "../assets/icons/chat.png";
import Astrology from "../assets/icons/astrology.png";
import Kundali from "../assets/icons/kundali.png";
import Trophy from "../assets/icons/trophy.png";
import Education from "../assets/icons/edu.png";
import Lang from "../assets/icons/lang.png";
import Star from "../assets/icons/star.png";
import Message from "../assets/icons/message.png";
import Phone from "../assets/icons/phone.png";
import leo from "../assets/icons/leo.png";
import Tarot from "../assets/icons/tarot.png";
import Share from "../assets/icons/share.png";
import Gmail from "../assets/icons/gmail.png";
import whatsapp from "../assets/icons/whatsapp.png";
import CopyLink from "../assets/icons/link.png";
import Video from "../assets/icons/video.png";

// Astrologers card icon
import ChatMinutesIcon from "../assets/icons/experienceIcon.svg";
import CallMinutesIcon from "../assets/icons/callMinutess.svg";

// application all default images
import AstrologerDefaultImg from "../assets/default-img/astrologer.svg";
import AstrologerMaleDefaultImg from "../assets/default-img/astrologer male_v.1.png"; // Male astrologer
import AstrologerFemaleDefaultImg from "../assets/default-img/astrologer female_v.1.png"; // Female astrologer
import AstromallCategoryDefault from "../assets/default-img/astromall-category.png";
import AstrologerNumerologyDefault from "../assets/default-img/astrologer-numerology.png";
import AstromallSubCategoryDefault from "../assets/default-img/astromall-sub-category.jpeg";
import HoroscopeDefault from "../assets/default-img/horoscope.png";
import KundliChartDefault from "../assets/default-img/kundli-chart.png";
import TarotCardDefault from "../assets/default-img/tarot-card.png";
import BlogsDefault from "../assets/default-img/blogs.png";
import CardBlackDefault from "../assets/default-img/card_black.png";
import DeafultCategory from "../assets/default-img/default-category-img.png";
import NewBlogsDefault from "../assets/default-img/new-blogs.jpeg";
import VedicKundliDefault from "../assets/default-img/vedic-kundli.svg";
import AriesDefault from "../assets/default-img/aries-default.svg";
import TalkToDefaultAstrologer from "../assets/default-img/talk-to-defaultastrollger.png";

export const DefaultImages = {
  AstrologerDefaultImg,
  AstrologerMaleDefaultImg,
  AstrologerFemaleDefaultImg,
  AstromallCategoryDefault,
  AstrologerNumerologyDefault,
  AstromallSubCategoryDefault,
  HoroscopeDefault,
  KundliChartDefault,
  TarotCardDefault,
  BlogsDefault,
  CardBlackDefault,
  DeafultCategory,
  NewBlogsDefault,
  VedicKundliDefault,
  AriesDefault,
  TalkToDefaultAstrologer,
};

/**
 * Get astrologer default image based on gender
 * @param {string} gender - 'male', 'female', or other
 * @returns {string} - Default image path
 */
export const getAstrologerDefaultImage = (gender) => {
  if (!gender) return DefaultImages.AstrologerDefaultImg;
  
  const genderLower = gender.toLowerCase();
  
  if (genderLower === 'male' || genderLower === 'm') {
    return DefaultImages.AstrologerMaleDefaultImg;
  } else if (genderLower === 'female' || genderLower === 'f') {
    return DefaultImages.AstrologerFemaleDefaultImg;
  }
  
  return DefaultImages.AstrologerDefaultImg;
};


export const AppIcons = {
  Logo,
  Call,
  Chat,
  Astrology,
  Kundali,
  Trophy,
  Education,
  Lang,
  Star,
  Message,
  Call,
  Phone,
  leo,
  Tarot,
  Share,
  Gmail,
  whatsapp,
  CopyLink,
  Video,
  ChatMinutesIcon,
  CallMinutesIcon
};

//appImages

import Hero from "../assets/images/navratri-hero.jpg";
import Astro1 from "../assets/images/astrologer-1.jpg";
import Astro2 from "../assets/images/astrologer-2.jpg";
import Astro3 from "../assets/images/astrologer-3.jpg";
import BgAstro from "../assets/images/bg_astro.png";
import Marriage from "../assets/images/marriage.png";
import KundaliRead from "../assets/images/kundli_read.png";
import Love from "../assets/images/love.png";
import Vastu from "../assets/images/vastu.png";
import Blog1 from "../assets/images/blog1.png";
import Progress from "../assets/images/progress.png";
import Profile from "../assets/images/sanket_profile.jpeg";
import AstroLiveBg from "../assets/images/astroLiveBg.png";
import Dosh from "../assets/images/dosh.png";
import Ring from "../assets/images/ring.png";
import ChatBg from "../assets/images/Chat.png";
import tarotCard from "../assets/images/tarotCard.png";
import cosmicMoon from "../assets/images/daily-insight-1.png";
import cosmicChronicles from "../assets/images/daily-insight-2.png";
import cosmicUnity from "../assets/images/daily-insight-3.png";

export const AppImages = {
  Hero,
  Astro1,
  Astro2,
  Astro3,
  BgAstro,
  Marriage,
  KundaliRead,
  Love,
  Vastu,
  Blog1,
  Progress,
  AstroLiveBg,
  Profile,
  Dosh,
  Ring,
  ChatBg,
  tarotCard,
  cosmicMoon,
  cosmicChronicles,
  cosmicUnity,
};

//svgs

import Aries from "../assets/svg/aries.svg";
import Taurus from "../assets/svg/taurus.svg";
import Gemini from "../assets/svg/gemini.svg";
import Cancer from "../assets/svg/cancer.svg";
import Leo from "../assets/svg/leo.svg";
import Virgo from "../assets/svg/virgo.svg";
import Libra from "../assets/svg/libra.svg";
import Scorpio from "../assets/svg/scorpio.svg";
import Sagittarius from "../assets/svg/sagittarius.svg";
import Capricorn from "../assets/svg/capricorn.svg";
import Aquarius from "../assets/svg/aquarius.svg";
import Pisces from "../assets/svg/pisces.svg";
import Experience from "../assets/icons/experience.svg"

export const appSvgs = {
  Aries,
  Taurus,
  Gemini,
  Cancer,
  Leo,
  Virgo,
  Libra,
  Scorpio,
  Sagittarius,
  Capricorn,
  Aquarius,
  Pisces,
  Experience
};

// AI WOW Icons
import VastuIcon from "../assets/aiwow/Group 1410084718.svg";
import GemstoneIcon from "../assets/aiwow/Group 1410084675.svg";
import SignatureIcon from "../assets/aiwow/Rectangle 34624973.png";
import PalmIcon from "../assets/aiwow/Group 1410084719.svg";
import FaceIcon from "../assets/aiwow/Rectangle 34624969.svg";
import ClothesIcon from "../assets/aiwow/Group 1410084720.svg";
import AuraIcon from "../assets/aiwow/Vector.svg";

// AI WOW Instruction Images
import FaceReadingInstruction from "../assets/aiwow/face-reading-1.png";
import PalmistryInstruction from "../assets/aiwow/palmistry-1.png";
import SignatureInstruction from "../assets/aiwow/signature-1.png";
import GemstoneInstruction from "../assets/aiwow/gemstone-1.png";
import ClothColorInstruction from "../assets/aiwow/cloth-color-1.png";
import AuraInstruction from "../assets/aiwow/face-reading-1.png"; // Using face reading image as placeholder

const aiWowIcons = {
  vastu: VastuIcon,
  gemstone: GemstoneIcon,
  signature: SignatureIcon,
  palm: PalmIcon,
  face: FaceIcon,
  clothes: ClothesIcon,
  aura: AuraIcon,
  // Companion Suite icons (using existing icons as placeholders)
  chat: SignatureIcon, // Chat icon
  message: SignatureIcon, // Message icon
  sun: AuraIcon, // Sun icon for daily briefing
  moon: AuraIcon, // Moon icon for dream interpreter
  // Action Suite icons (using existing icons as placeholders)
  heart: GemstoneIcon, // Heart icon for matchmaking
  calendar: VastuIcon, // Calendar icon
  health: ClothesIcon, // Health icon
  karma: AuraIcon, // Karma icon
};

const aiWowInstructions = {
  faceReading: FaceReadingInstruction,
  palmistry: PalmistryInstruction,
  signature: SignatureInstruction,
  gemstone: GemstoneInstruction,
  clothColor: ClothColorInstruction,
  aura: AuraInstruction,
};

export const getAIWowIcon = (iconName) => {
  return aiWowIcons[iconName] || null;
};

export const getAIWowInstructionImage = (featureName) => {
  return aiWowInstructions[featureName] || null;
};
