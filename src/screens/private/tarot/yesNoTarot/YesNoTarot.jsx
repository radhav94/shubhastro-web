import React from 'react'
import { useGetYesNoTarotQuery } from '../../../../redux/api/tarot/tarotApi'
import ResultTarot from '../resultTarot/ResultTarot'
import CommonTarot from '../commonTarot/CommonTarot'
import { tarotMeta } from '../../../../utils/constanats/tarotMeta'

const YesNoTarot = () => {
  return (
    <CommonTarot
      title={tarotMeta.YES_NO_TAROT.title}
      subTitle={tarotMeta.YES_NO_TAROT.subtitle}
      cardsCount={22}
      shuffleType="major"
      apiHook={useGetYesNoTarotQuery}
      ResultComponent={ResultTarot}
      buildParams={({ selected, revealed, lang }) => {
        if (!selected || !revealed) return null;

        return {
          card_name: selected?.id,
          direction: selected?.direction,
          lang,
        };
      }}
    />
  )
}

export default YesNoTarot