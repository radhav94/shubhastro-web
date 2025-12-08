
import React from "react";
import MultiPickTarot from "../commonTarot/MultiPickTarot";
import { useGetLoveTriangleTarotQuery } from "../../../../redux/api/tarot/tarotApi";
import LoveTriangleResult from "./LoveTriangleResult";
import { tarotMeta } from "../../../../utils/constanats/tarotMeta";

const LoveTriangleTarot = () => {
  return (
    <MultiPickTarot
      title={tarotMeta.LOVE_TRIANGLE_TAROT.title}
      subtitle={tarotMeta.LOVE_TRIANGLE_TAROT.subtitle}
      maxSelectableCards={3}
      shuffleType="major"
      apiHook={useGetLoveTriangleTarotQuery}
      ResultComponent={LoveTriangleResult}
      buildParams={({ selectedCards, revealed, lang }) => {
        if (!revealed || selectedCards.length !== 3) return null;

        return {
          card_self: selectedCards[0]?.id,
          card_lover1: selectedCards[1]?.id,
          card_lover2: selectedCards[2]?.id,
          lang,
        };
      }}
    />
  );
};

export default LoveTriangleTarot;

