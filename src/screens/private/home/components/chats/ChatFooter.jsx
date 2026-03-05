import styles from "./ChatWindow.module.scss";

const ChatFooter = ({ remainingTime = 0, onRecharge, onChatEnd, isChatActive }) => {
  // Format time as HH:MM:SS or MM:SS
  const formatTime = (sec) => {
    const totalSec = Math.max(0, Math.floor(Number(sec) || 0));
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className={styles.chatFooter}>
      {isChatActive && (<div className={styles.timerText}>
        Chat Ends in <span className={styles.timerHighlight}>{formatTime(remainingTime)}</span>
      </div>)}

      {isChatActive && (<button className={styles.chateEnd} onClick={onChatEnd}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <g clip-path="url(#clip0_8955_984)">
            <path d="M7.12004 8.87333C7.79661 9.5505 8.56125 10.1335 9.39337 10.6067L10.24 9.76C10.4213 9.58076 10.6501 9.45723 10.8994 9.40406C11.1488 9.35089 11.4081 9.3703 11.6467 9.46C12.2516 9.6857 12.88 9.84225 13.52 9.92667C13.8404 9.97195 14.1334 10.1322 14.3443 10.3775C14.5553 10.6228 14.6699 10.9365 14.6667 11.26V13.26C14.6675 13.4457 14.6294 13.6294 14.555 13.7996C14.4807 13.9697 14.3716 14.1224 14.2348 14.2479C14.0979 14.3734 13.9364 14.469 13.7605 14.5285C13.5847 14.588 13.3983 14.61 13.2134 14.5933C11.1619 14.3704 9.19137 13.6694 7.46004 12.5467C6.65688 12.0367 5.91239 11.4398 5.24004 10.7667M3.46004 8.54C2.33727 6.80867 1.63628 4.83811 1.41337 2.78667C1.39671 2.60231 1.41862 2.41651 1.4777 2.24108C1.53679 2.06566 1.63175 1.90446 1.75655 1.76775C1.88134 1.63103 2.03324 1.5218 2.20256 1.44701C2.37189 1.37222 2.55493 1.33351 2.74004 1.33333H4.74004C5.06357 1.33015 5.37723 1.44472 5.62254 1.65569C5.86786 1.86666 6.02809 2.15963 6.07337 2.48C6.15779 3.12004 6.31434 3.74848 6.54004 4.35333C6.62973 4.59195 6.64915 4.85127 6.59597 5.10059C6.5428 5.3499 6.41928 5.57874 6.24004 5.76L5.39337 6.60667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14.6666 1.33333L1.33325 14.6667" stroke="white" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
          </g>
          <defs>
            <clipPath id="clip0_8955_984">
              <rect width="16" height="16" fill="white" />
            </clipPath>
          </defs>
        </svg>
        End
      </button>)}

      {isChatActive && <span className={styles.dividerLine}></span>}

      {isChatActive && (
        <button className={styles.rechargeButton} onClick={onRecharge}>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M5 0C2.23858 0 0 2.23858 0 5V28.3333C0 31.0948 2.23858 33.3333 5 33.3333H28.3333C31.0948 33.3333 33.3333 31.0948 33.3333 28.3333V11.6667C33.3333 9.48964 31.942 7.63757 30 6.95118V5C30 2.23858 27.7614 0 25 0H5ZM5 3.33333C4.07953 3.33333 3.33333 4.07953 3.33333 5C3.33333 5.92047 4.07953 6.66667 5 6.66667H26.6667V5C26.6667 4.07953 25.9205 3.33333 25 3.33333H5ZM25 16.6667C23.1591 16.6667 21.6667 18.1591 21.6667 20C21.6667 21.841 23.1591 23.3333 25 23.3333H28.3333C29.2538 23.3333 30 22.5871 30 21.6667V18.3333C30 17.4129 29.2538 16.6667 28.3333 16.6667H25Z" fill="url(#paint0_linear_8953_991)" />
              <defs>
                <linearGradient id="paint0_linear_8953_991" x1="0" y1="16.6667" x2="33.3333" y2="16.6667" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F75801" />
                  <stop offset="1" stopColor="#D43400" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatFooter;
