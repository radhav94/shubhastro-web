import React from "react";
import { useGetBusinessBreakupQuery } from "../../../../redux/api/tarot/tarotApi";
import RomanticBreakupResult from "../romanticBreakupTarot/RomanticBreakupResult";
import MultiPickTarot from "../commonTarot/MultiPickTarot";
import { tarotMeta } from "../../../../utils/constanats/tarotMeta";

const BuisnessBreakupTarot = () => {
  return (
    <MultiPickTarot
      title={tarotMeta.BUISNESS_BREAKUP_TAROT.title}
      subtitle={tarotMeta.BUISNESS_BREAKUP_TAROT.subtitle}
      maxSelectableCards={2}
      shuffleType="major"
      apiHook={useGetBusinessBreakupQuery}
      ResultComponent={RomanticBreakupResult}
      buildParams={({ selectedCards, revealed, lang }) => {
        if (!revealed || selectedCards.length !== 2) return null;

        return {
          card_cause: selectedCards[0]?.cardName,
          card_advise: selectedCards[1]?.cardName,
          lang,
        };
      }}
    />
  );
};

export default BuisnessBreakupTarot;
