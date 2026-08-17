import React from "react";
import styles from "./ChatList.module.scss";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../../utils/routes/Paths";
import { useGetChatMessagesQuery } from "../../../../../../redux/api/chatApi";
import PrimaryLoader from "../../../../../../component/UI/PrimaryLoader";
import { getAstrologerDisplayName } from "../../../../../../utils/helper/string.utils";

//     roomId: "6922f748318e70a557f0f17a",
//     userId: "691da49c281243bd6345349b",

const ChatList = () => {
  const navigate = useNavigate();
  const astroIdLocal = localStorage.getItem("shubhtalk_astro_id");

  const { data, isLoading, isError } = useGetChatMessagesQuery({
    astrologerId: astroIdLocal,
  });

  const chats = data?.data;


  if (isLoading) {
    return (
      <div className={styles.listWrapper}>
        <PrimaryText size_20 isBold paddingBottom={15}>
          Recent Chats
        </PrimaryText>

        <div className={styles.loaderBox}>
          <div className={styles.loader}></div>
          <PrimaryLoader fullscreen={false} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.listWrapper}>
        <PrimaryText size_20 isBold paddingBottom={15}>
          Recent Chats
        </PrimaryText>

        <PrimaryText size_14 color="red">
          Failed to load chats
        </PrimaryText>
      </div>
    );
  }

  return (
    <div className={styles.listWrapper}>
      <PrimaryText size_20 isBold paddingBottom={15}>
        Recent Chats
      </PrimaryText>

      {chats?.length === 0 && (
        <PrimaryText size_14 color="#777">
          No chats found
        </PrimaryText>
      )}

      {chats?.map((chat) => {
        return (
          <div
            key={chat.roomId}
            className={styles.chatItem}
            onClick={() =>
              navigate(
                PATH.privateRoutes.ASTROLOGER_CHAT_WINDOW.path.replace(
                  ":chatId",
                  chat.roomId
                ),
                {
                  state: {
                    userId: chat?.userId,
                    astrologerId: astroIdLocal,
                    fullName: chat?.firstName,
                    roomId: chat?.roomId,
                    isUserSide: false,
                    kundliId:null
                  },
                }
              )
            }
          >
            <img
              src={
                chat.image ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              className={styles.avatar}
              alt="User"
            />

            <div className={styles.info}>
              <PrimaryText size_16 isSemiBold>
                {getAstrologerDisplayName(chat)}
              </PrimaryText>

              <PrimaryText size_12 color="#777">
                {chat.lastMessage || chat.phoneNumber}
              </PrimaryText>
            </div>

            <PrimaryText size_12 color="#999">
              {chat.time}
            </PrimaryText>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;
