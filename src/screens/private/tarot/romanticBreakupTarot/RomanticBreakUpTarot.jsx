import React from 'react'
import MultiPickTarot from '../commonTarot/MultiPickTarot';
import { useGetRomanticBreakupQuery } from '../../../../redux/api/tarot/tarotApi';
import RomanticBreakupResult from './RomanticBreakupResult';
import { tarotMeta } from '../../../../utils/constanats/tarotMeta';

const RomanticBreakUpTarot = () => {
  return (
    <MultiPickTarot
      title={tarotMeta.ROMANTIC_BREAKUP_TAROT.title}
      subtitle={tarotMeta.ROMANTIC_BREAKUP_TAROT.subtitle}
      maxSelectableCards={2}
      shuffleType="major"
      apiHook={useGetRomanticBreakupQuery}
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
  )
}

export default RomanticBreakUpTarot