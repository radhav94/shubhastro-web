import React from "react";
import styles from "./ChatList.module.scss";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../../utils/routes/Paths";

const chats = [
  {
    _id: "691da49c281243bd6345349b",
    firstName: "User",
    lastName: "Sanket",
    phoneNumber: "8530880988",
    time: "16:45",
    image:
      "http://i.postimg.cc/yNbzTZhz/Gemini-Generated-Image-gfixiggfixiggfix.png",
  },
  {
    _id: "69203b1dd62228a180ff6f58",
    firstName: "User",
    lastName: "Krishna",
    phoneNumber: "8983362469",
    time: "15:10",
    image:
      "https://i.postimg.cc/s2p26KXQ/Gemini-Generated-Image-oyd953oyd953oyd9.jpg",
  },
  {
    _id: "69203b7f836eaeb7310db1a7",
    firstName: "User",
    lastName: "Nazim",
    phoneNumber: "+919004858404",
    time: "18:45",
    image: "",
  },
  {
    _id: "69203b9c836eaeb7310db1a8",
    firstName: "User",
    lastName: "Anjum",
    phoneNumber: "+9199156942812",
    time: "08:00",
    image: "",
  },
];

const ChatList = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.listWrapper}>
      <PrimaryText size_20 isBold paddingBottom={15}>
        Recent Chats
      </PrimaryText>

      {chats.map((chat) => (
        <div
          key={chat._id}
          className={styles.chatItem}
          onClick={() =>
            navigate(
              PATH.privateRoutes.ASTROLOGER_CHAT_WINDOW.path.replace(
                ":chatId",
                chat._id
              ),
              { state: { user: chat ,role: "ASTROLOGER" } } 
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
              {chat.firstName} {chat.lastName}
            </PrimaryText>

            <PrimaryText size_12 color="#777">
              {chat.phoneNumber}
            </PrimaryText>
          </div>

          <PrimaryText size_12 color="#999">
            {chat.time}
          </PrimaryText>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
