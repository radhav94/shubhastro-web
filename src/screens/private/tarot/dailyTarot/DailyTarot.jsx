import React from 'react'
import { useGetTarotDailyDataQuery } from '../../../../redux/api/tarot/tarotApi'
import CommonTarot from '../commonTarot/CommonTarot'
import { tarotMeta } from '../../../../utils/constanats/tarotMeta'
import DailyTarotResult from './DailyTarotResult'

const DailyTarot = () => {
  return (
    <CommonTarot
      title={tarotMeta.DAILY_TAROT.title}
      subTitle={tarotMeta.DAILY_TAROT.subtitle}
      shuffleType="major"
      apiHook={useGetTarotDailyDataQuery}
      ResultComponent={DailyTarotResult}
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

export default DailyTarot