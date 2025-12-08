import React from 'react'
import CommonTarot from '../commonTarot/CommonTarot';
import ResultTarot from '../resultTarot/ResultTarot';
import { useGetInDepthLoveTarotQuery } from '../../../../redux/api/tarot/tarotApi';
import { tarotMeta } from '../../../../utils/constanats/tarotMeta';

const InDepthLove = () => {
  return (
    <CommonTarot
      title={tarotMeta.IN_DEPTH_TAROT.title}
      subTitle={tarotMeta.IN_DEPTH_TAROT.subtitle}
      cardsCount={22}
      shuffleType="major"
      apiHook={useGetInDepthLoveTarotQuery}
      ResultComponent={ResultTarot}
      buildParams={({ selected, revealed, lang }) => {
        if (!selected || !revealed) return null;

        return {
          card_name: selected?.cardName,
          lang,
        };
      }}
    />
  )
}

export default InDepthLove