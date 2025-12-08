import React from 'react'
import { useGetCareerTarotQuery } from '../../../../redux/api/tarot/tarotApi'
import CommonTarot from '../commonTarot/CommonTarot'
import { tarotMeta } from '../../../../utils/constanats/tarotMeta'
import CareerSelectResult from './CareerSelectResult'

const CareerSelectTarot = () => {
  return (
    <CommonTarot
      title={tarotMeta.CAREER_SELECT_TAROT.title}
      subTitle={tarotMeta.CAREER_SELECT_TAROT.subtitle}
      shuffleType="major"
      apiHook={useGetCareerTarotQuery}
      ResultComponent={CareerSelectResult}
      buildParams={({ selected, revealed, lang }) => {
        if (!selected || !revealed) return null;

        return {
          card_name: selected?.id,
          lang,
        };
      }}
    />
  )
}

export default CareerSelectTarot