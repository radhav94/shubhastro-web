import {
  AstrologerCard,
  DetailsModal,
  PrimaryText,
  RechargeAlertModel,
  Title,
} from "../../../component";
import styles from "./TalkToAstrologer.module.scss";
import { useTalkToAstrologer } from "./useTalkToAstrologer";

const TalkToAstrologer = () => {
  const [
    onFollow,
    data,
    openModal,
    setOpenModal,
    onChat,
    onProfile,
    handleSubmit,
    onRechargeNow,
  ] = useTalkToAstrologer();

  return (
    <div>
      <PrimaryText size_24 isExtraBold>
        Talk To Best Astrologers Online
      </PrimaryText>
      <div className=" pt-4" />

      <PrimaryText className="">
        Talk to the best astrologer online and get clear guidance on your
        relationships, career, finances, and other important life choices you’re
        about to make. You get trusted insights, accurate predictions with
        complete privacy, and take the next step in life with confidence. With
        over two decades of expertise and with 5000+ experts available 24/7,
        you’ll always find support and clarity with us on your journey forward.
      </PrimaryText>
      <div className=" pt-4" />
      <Title title="Trial Offer ( 3 left )" showButton showDivider />
      <div className={styles.cardsContainer}>
        {data.map((e) => (
          <div key={e.AstrologerLoginId} className={styles.cardWrapper}>
            <AstrologerCard
              data={e}
              onFollow={() => onFollow(e.AstrologerLoginId)}
              onChat={() => onChat(e)}
              onProfile={() => onProfile(e)}
            />
          </div>
        ))}
      </div>

      <DetailsModal
        onClose={() => setOpenModal((prev) => ({ ...prev, details: false }))}
        isOpen={openModal.details}
        handleSubmit={handleSubmit}
      />
      <RechargeAlertModel
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        isOpen={openModal.recharge}
        handleSubmit={onRechargeNow}
      />
    </div>
  );
};

export default TalkToAstrologer;
