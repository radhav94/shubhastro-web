import React from 'react'
import { useGetFlirtTarotQuery } from '../../../../redux/api/tarot/tarotApi'
import ResultTarot from '../resultTarot/ResultTarot'
import CommonTarot from '../commonTarot/CommonTarot'
import { tarotMeta } from '../../../../utils/constanats/tarotMeta'

const FlirtTarot = () => {
  return (
    <CommonTarot
      title={tarotMeta.FLIRT_TAROT.title}
      subTitle={tarotMeta.FLIRT_TAROT.subtitle}
      cardsCount={22}
      shuffleType="major"
      apiHook={useGetFlirtTarotQuery}
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

export default FlirtTarot