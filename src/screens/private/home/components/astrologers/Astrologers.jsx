// import styles from "./Astrologers.module.scss";
// import { useNavigate } from "react-router-dom";
// import {
//   AstrologerCard,
//   Divider,
//   PrimaryButton,
//   PrimaryText,
//   Title,
// } from "../../../../../component";
// import { AppImages } from "../../../../../utils/appImages";
// import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
// import { useState } from "react";



// const Astrologers = ({ onChat, onClickView, onProfile }) => {
//     const navigate = useNavigate();  

//   const page = 1;
//   const limit = 3;

//   const { data } = useGetAstrologersQuery({ page, limit });
//   return (
//     <div className={styles.astrologersWrapper}>
//       <Title
//         title="Top Online Astrologers"
//         showDivider
//         showButton
//         buttonTitle="View"
//         onButtonClick={onClickView}
//       />

//       <div className={styles.cardsContainer}>
//         {data?.data?.map((astrologer) => (
//           <div key={astrologer._id} className={styles.cardWrapper}>
//             <AstrologerCard
//               data={astrologer}
//                onChat={() =>
//                 navigate(`/talk-to-astrologers/chat/${astrologer._id}`, {
//                   state: { user: astrologer, role: "USER" },
//                 })
//               }
//               onProfile={() => onProfile(astrologer)}
//             />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Astrologers;



// Astrologers.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Astrologers.module.scss";
import {
  AstrologerCard,
  Divider,
  PrimaryButton,
  PrimaryText,
  Title,
} from "../../../../../component";
import { AppImages } from "../../../../../utils/appImages";
import { useGetAstrologersQuery } from "../../../../../redux/api/astrologer/astrologerApi";
import AstrologerCallUI from "./AstrologerCallUI";
// import AstrologerCallUI from "../AstrologerCallUI/AstrologerCallUI"; // NEW

const Astrologers = ({ onChat, onClickView, onProfile }) => {
  const navigate = useNavigate();

  const page = 1;
  const limit = 3;

  const { data } = useGetAstrologersQuery({ page, limit });

  const [activeCaller, setActiveCaller] = useState(null); // selected astrologer for call

  const handleStartCall = (astrologer) => {
    // Agar route based call chahiye toh yahan navigate bhi kar sakta hai
    // navigate(`/talk-to-astrologers/call/${astrologer._id}`, { state: { user: astrologer } });
    setActiveCaller(astrologer);
  };

  const handleEndCall = () => {
    setActiveCaller(null);
  };

  return (
    <div className={styles.astrologersWrapper}>
      <Title
        title="Top Online Astrologers"
        showDivider
        showButton
        buttonTitle="View"
        onButtonClick={onClickView}
      />

      <div className={styles.cardsContainer}>
        {data?.data?.map((astrologer) => (
          <div key={astrologer._id} className={styles.cardWrapper}>
            <AstrologerCard
              data={astrologer}
              onChat={() =>
                navigate(`/talk-to-astrologers/chat/${astrologer._id}`, {
                  state: { user: astrologer, role: "USER" },
                })
              }
              onProfile={() => onProfile(astrologer)}
              onAudioCall={() => handleStartCall(astrologer)} // NEW
            />
          </div>
        ))}
      </div>

      {activeCaller && (
        <AstrologerCallUI
          astrologer={activeCaller}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
};

export default Astrologers;






