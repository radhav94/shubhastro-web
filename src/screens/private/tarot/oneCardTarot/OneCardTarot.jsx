import React, { useState } from "react";
import InternalBanner from "../../../../component/UI/cards/internalBanner/InternalBanner";
import { PATH } from "../../../../utils/routes/Paths";
import { useNavigate } from "react-router-dom";
import TarotReadingCard from "../../../../component/UI/cards/tarotReadingCard/TarotReadingCard";
import TarotCardModal from "../../../../component/UI/modal/tarotCardModal/TarotCardModal";

const OneCardTarot = () => {
  const navigate = useNavigate();
  const [tarotModalOpen, setTarotModalOpen] = useState(false);
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
        isSelected: true,
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
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
      {
        id: 4,
        name: "Major Arcana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Major_Arcana_svg_45c2bf6d3d.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
      {
        id: 5,
        name: "Minor Arcana",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Minor_Arcana_svg_9420dfd7d1.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },

      {
        id: 7,
        name: "Love Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Love_Tarot_svg_f880df3842.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
      {
        id: 8,
        name: "Money Tarot",
        img: "https://images.astroyogi.com/strapicmsprod/assets/Money_Tarot_svg_f59c3f63f3.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
      {
        id: 9,
        name: "State of Mind Reading",
        img: "https://images.astroyogi.com/strapicmsprod/assets/State_of_Mind_Reading_svg_ef8355b75b.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
      {
        id: 10,
        name: "Tarot Style",
        img: "https://images.astroyogi.com/strapicmsprod/assets/My_Tarot_Style_svg_046f776883.webp",
        link: PATH.privateRoutes.TAROT.path,
        isSelected: false,
      },
    ],
  };

  const onCardClick = (data) => {
    if (data.link) {
      navigate(data.link);
    }
  };

  const onClickBtn = () => {
    setTarotModalOpen(true);
  };

  const onGetDetails = (e) => {
    setTarotModalOpen(false);
    navigate(PATH.privateRoutes.TAROT_RESULT.path, {
      state: { tarotData: e },
    });
  };

  return (
    <div>
      <InternalBanner data={tarotReadingData} onCardClick={onCardClick} />
      <TarotReadingCard onClickBtn={onClickBtn} />
      <TarotCardModal
        isOpen={tarotModalOpen}
        onClose={() => setTarotModalOpen(false)}
        onGetDetails={onGetDetails}
      />
    </div>
  );
};

export default OneCardTarot;
