import React from 'react'
import { useGetEroticLoveTarotQuery } from '../../../../redux/api/tarot/tarotApi'
import ResultTarot from '../resultTarot/ResultTarot'
import CommonTarot from '../commonTarot/CommonTarot'
import { tarotMeta } from '../../../../utils/constanats/tarotMeta'

const EroticLove = () => {
  return (
    <CommonTarot
      title={tarotMeta.EROTIC_LOVE_TAROT.title}
      subTitle={tarotMeta.EROTIC_LOVE_TAROT.subtitle}
      cardsCount={22}
      shuffleType="major"
      apiHook={useGetEroticLoveTarotQuery}
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

export default EroticLove