// import React from 'react'
// import styles from "./NewAstrologerCard.module.scss";

// const NewAstrologerDetailsCard = () => {
//   return (
//     <div className={styles.sessionCard}>
//       <Link
//         to={`/astrologer/${session.astrologerId}`}
//         className={styles.sessionCardLink}
//       >
//         <div className={styles.sessionImageWrapper}>
//           <img
//             src={
//               session.astrologerImage ||
//               getAstrologerDefaultImage(session.astrologerGender)
//             }
//             alt={session.astrologerName}
//             className={styles.sessionImage}
//             onError={(e) => {
//               e.target.style.display = "none";
//             }}
//           />
//         </div>
//       </Link>
//       <div className={styles.sessionInfo}>
//         <Link
//           to={`/astrologer/${session.astrologerId}`}
//           className={styles.sessionNameLink}
//         >
//           <h3 className={styles.sessionName}>{session.astrologerName}</h3>
//         </Link>
//         <div className={styles.sessionDateTime}>
//           <div className={styles.sessionDetail}>
//             <Calendar size={16} className={styles.sessionIconSvg} />
//             <span className={styles.sessionText}>
//               {formatDate(session.startTime)}
//             </span>
//           </div>
//           <div className={styles.sessionDetail}>
//             <Clock size={16} className={styles.sessionIconSvg} />
//             <span className={styles.sessionText}>
//               {formatTime(session.startTime)}
//             </span>
//           </div>
//         </div>
//         <p className={styles.sessionDuration}>
//           Duration : {formatDuration(session.billedMinutes)}
//         </p>
//         <div className={styles.sessionActionButtons}>
//           <div className={styles.sessionButtonWrapper}>
//             <button
//               className={styles.sessionChatBtn}
//               onClick={(e) => handleButtonClick(e,session, "chat")}
//               disabled={isLoading}
//             >
//               <img src={AppIcons.ChatMinutesIcon} alt="chat" /> Chat
//             </button>
//             {/* <p className={styles.sessionPriceText}>
//               <span className={styles.sessionPriceAmount}>₹{session.chatRate}</span>/min
//             </p> */}
//           </div>
//           <div className={styles.sessionButtonWrapper}>
//             <button
//               className={styles.sessionCallBtn}
//               onClick={(e) => handleButtonClick(e,session, "call")}
//               disabled={isLoading}
//             >
//               <img src={AppIcons.CallMinutesIcon} alt="call" /> Call
//             </button>
//             {/* <p className={styles.sessionPriceText}>
//               <span className={styles.sessionPriceAmount}>₹{session.callRate}</span>/min
//             </p> */}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default NewAstrologerDetailsCard