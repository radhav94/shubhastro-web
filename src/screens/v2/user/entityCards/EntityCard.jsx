import SessionCard from "./SessionCard";
import AstrologerCard from "./AstrologerCard";
import OrderCard from "./OrderCard";
import DefaultEntityCard from "./DefaultEntityCard";

const EntityCard = ({ entityType, item, onClick }) => {
  switch (entityType) {
    case "sessions":
    case "session":
      return <SessionCard item={item} onClick={onClick} />;
    case "astrologers":
    case "astrologer":
      return <AstrologerCard item={item} onClick={onClick} />;
    case "orders":
    case "user_order":
      return <OrderCard item={item} onClick={onClick} />;
    default:
      return <DefaultEntityCard item={item} onClick={onClick} />;
  }
};

export default EntityCard;
