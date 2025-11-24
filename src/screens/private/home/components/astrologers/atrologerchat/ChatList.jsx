import React from "react";
import styles from "./ChatList.module.scss";
import PrimaryText from "../../../../../../component/PrimaryText";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../../../../../utils/routes/Paths";

const chats = [
  {
    roomId: "6922f748318e70a557f0f17a",
    userId: "691da49c281243bd6345349b",
    firstName: "Krishna",
    lastName: "Patel",
    lastMessage: "Hi",
    phoneNumber: "8530880988",
    time: "16:45",
    image: "http://i.postimg.cc/yNbzTZhz/Gemini-Generated-Image-gfixiggfixiggfix.png",
  },
  {
    roomId: "ROOM124",
    userId: "U002",
    firstName: "Sanket",
    lastName: "More",
    lastMessage: "Hello",
    phoneNumber: "8983362469",
    time: "15:10",
    image: "https://i.postimg.cc/s2p26KXQ/Gemini-Generated-Image-oyd953oyd953oyd9.jpg",
  },
  {
    roomId: "ROOM125",
    userId: "U003",
    firstName: "Nazim",
    lastName: "Khan",
    lastMessage: "How are you?",
    phoneNumber: "+919004858404",
    time: "18:45",
    image: "",
  },
  {
    roomId: "ROOM126",
    userId: "U004",
    firstName: "Anjum",
    lastName: "Shaikh",
    lastMessage: "Need help",
    phoneNumber: "+9199156942812",
    time: "08:00",
    image: "",
  },
];


const ChatList = () => {
  const navigate = useNavigate();
  const astroIdLocal=localStorage.getItem("loggedAstroId")

  console.log("astroIdLocal",astroIdLocal);


  return (
    <div className={styles.listWrapper}>
      <PrimaryText size_20 isBold paddingBottom={15}>
        Recent Chats
      </PrimaryText>
{chats.map((chat) => (
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
         state: { userId: chat.userId, astrologerId :astroIdLocal ,fullName:chat.firstName,roomId: chat.roomId }
        }
      )
    }
  >
    <img
      src={chat.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
      className={styles.avatar}
      alt="User"
    />

    <div className={styles.info}>
      <PrimaryText size_16 isSemiBold>
        {chat.firstName} {chat.lastName}
      </PrimaryText>

      <PrimaryText size_12 color="#777">
        {chat.lastMessage || chat.phoneNumber}
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
