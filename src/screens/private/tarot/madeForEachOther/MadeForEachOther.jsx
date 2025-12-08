import React from 'react'
import { useGetMadeForEachOtherQuery } from '../../../../redux/api/tarot/tarotApi';
import ResultTarot from '../resultTarot/ResultTarot';
import CommonTarot from '../commonTarot/CommonTarot';
import { tarotMeta } from '../../../../utils/constanats/tarotMeta';

const MadeForEachOther = () => {
  return (
    <CommonTarot
      title={tarotMeta.MADE_FOR_EACH_OTHER_TAROT.title}
      subTitle={tarotMeta.MADE_FOR_EACH_OTHER_TAROT.subtitle}
      cardsCount={22}
      shuffleType="major"
      apiHook={useGetMadeForEachOtherQuery}
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

export default MadeForEachOther