import { useNavigate } from "react-router-dom";
import { PATH } from "../../../utils/routes/Paths";

export const useTarote = () => {
  const navigate = useNavigate();
  const tarotReadingData = {
    bannerImg:
      "https://images.astroyogi.com/strapicmsprod/assets/One_Card_Tarot_Reading_69d58e1ff0.webp",
    bannerName: "One Card Tarot Reading",
    bannerDescription:
      "Need answers or solutions to your problems in life as soon as possible? One card reading will provide you with suggestions on all aspects of life like business, love, finance and relationships. You can explore any issue in your life by consulting the online tarot reading all by yourself right here.",
    cards: [
      {
        id: 1,
        name: "One Card Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/One_Card_Tarot_svg_430fd5a9b9.webp",
        link: PATH.privateRoutes.TAROT_ONE_CARD.path,
        isSelected: false,
      },
      {
        id: 2,
        name: "Three Card Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Three_Card_Tarot_svg_9e748e21f1.webp",
        link: PATH.privateRoutes.TAROT_THREE_CARD.path,
        isSelected: false,
      },
      {
        id: 6,
        name: "Wellness Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Wellness_Tarot_svg_5a207f6de3.webp",
        link: PATH.privateRoutes.TAROT_WELLNESS.path,
        isSelected: false,
      },
      {
        id: 3,
        name: "2025 Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/2024_Tarot_Reading_svg_1_ecfe92725f.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
      {
        id: 4,
        name: "Major Arcana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Major_Arcana_svg_45c2bf6d3d.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
      {
        id: 5,
        name: "Minor Arcana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Minor_Arcana_svg_9420dfd7d1.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },

      {
        id: 7,
        name: "Love Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Love_Tarot_svg_f880df3842.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
      {
        id: 8,
        name: "Money Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Money_Tarot_svg_f59c3f63f3.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
      {
        id: 9,
        name: "State of Mind Reading",
        img: "https://images.astroyogi.com/strapicmsprod/assets/State_of_Mind_Reading_svg_ef8355b75b.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
      {
        id: 10,
        name: "Tarot Style",
        img: "https://images.astroyogi.com/strapicmsprod/assets/My_Tarot_Style_svg_046f776883.webp",
        link: PATH.privateRoutes.TAROT_CARD_V2.path,
        isSelected: false,
      },
    ],
  };

  const tarotContentData = [
    {
      type: "heading",
      level: 2,
      content: "What You Should Know About Tarot Cards?",
    },
    {
      type: "paragraph",
      content:
        "Tarot card reading is a traditional divination method that uses the cards to reveal insights and predict future events. All of this is based on the interpretation of tarot cards. The meanings of the cards that we know today are credited to Cartomancer Jean-Baptiste Alliette (also known as Etteilla) and Marie Anne Adelaide Lenormand (1776-1843).",
    },
    {
      type: "paragraph",
      content:
        "A traditional tarot deck comprises seventy-eight cards. The deck is further divided into two groups.",
    },
    {
      type: "paragraph",
      content:
        '<strong>Major Arcana -</strong> The <a href="/tarot/majorarcana">Major Arcana</a> consists of 22 cards, each with its own interpretation that can only be determined by someone who understands the cards. Tarot cards can be used to uncover secrets about upcoming events and to plan for the future. Each Major Arcana card depicts a scene with one or more people and various elements.',
    },
    {
      type: "paragraph",
      content:
        '<strong>Minor Arcana -</strong> On the other hand, the <a href="/tarot/minorarcana">Minor Arcana</a>, also called the Lesser Arcana, comprises 56 suit cards. These cards, too, form an integral part of any tarot reading. There are four suits, with 14 cards in each suit. The suits include four categories, as follows.',
    },
    {
      type: "list",
      items: ["Wands", "Cups", "Swords", "Pentacles"],
    },
    {
      type: "heading",
      level: 2,
      content: "How Can A Tarot Reading Session Help You?",
    },
    {
      type: "paragraph",
      content:
        "Tarot Reading has the power and ability to answer all questions that are on your mind about your life. There's much to be explored, and the cards are the perfect gateway into the unknown future. Questions about your past, present, and future can be addressed based on the cards that you select in your reading.",
    },
    {
      type: "heading",
      level: 2,
      content: "How Does Tarot Card Reading Work?",
    },
    {
      type: "paragraph",
      content:
        "It is a tool for self-discovery, reflection, and gaining new perspectives on life's journey. Tarot card reading is like navigating a captivating tapestry of life woven with Major and Minor Arcana cards. When the cards are pulled, it is as if conducting a dance, manifesting the signs of the cards and the feelings of the seeker in unison.",
    },
    {
      type: "heading",
      level: 3,
      content: "What Sets Shubh Talk Apart for Tarot Card Reading Online?",
    },
    {
      type: "paragraph",
      content:
        "Shubh Talk brings experts to your fingertips. We have a panel of some of the best tarot card reading experts, providing private sessions, delving into various aspects of life, and guiding you toward a better and brighter future.",
    },
    {
      type: "paragraph",
      content:
        'Future events are unpredictable, and our actions today have the power to affect the things that happen tomorrow. Discover what you can do to change your destiny today by getting <a href="/tarot/love-tarot-reading">love tarot reading</a>, marriage reading, career, money, or more.',
    },
    {
      type: "heading",
      level: 3,
      content: "Why Use Free Tarot Card Reading Online?",
    },
    {
      type: "paragraph",
      content:
        'In addition to offering paid online tarot readings from professionals, we also offer free tarot readings through our website\'s <a href="/tarot/one-card-reading">One Card Tarot Reading</a>, <a href="/tarot/three-card-reading">Three Card Reading</a>, <a href="/tarot/style-file">My Tarot Style</a>, and <a href="/tarot/wellness-tarot-reading">Wellness Tarot Reading</a>. You can get instant answers to all your questions by choosing your tarot cards.',
    },
    {
      type: "paragraph",
      content:
        '📖 <strong>Read previous year\'s Tarot predictions now!</strong> 👇<br /><a href="/tarot/tarot2024">Tarot 2024</a> | <a href="/tarot/tarot2023">Tarot 2023</a> | <a href="/tarot/tarot2022">Tarot 2022</a> | <a href="/tarot/tarot-reading-2021.aspx">Tarot 2021</a> | <a href="/tarot/tarot-reading-2020.aspx">Tarot 2020</a>',
    },
  ];

  const onCardClick = (data) => {
    if (data.link) {
      navigate(data.link);
    }
  };

  return [tarotReadingData, tarotContentData, onCardClick];
};
