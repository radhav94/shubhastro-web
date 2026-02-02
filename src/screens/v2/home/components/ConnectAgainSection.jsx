import { useSelector } from "react-redux";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";

const ConnectAgainSection = ({ title, onConnect }) => {
    const navigate = useNavigate();
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

    // This section would typically fetch recent astrologers the user has connected with
    // For now, we'll return null as it requires additional API integration

    if (!isLoggedIn) {
        return null;
    }

    // TODO: Implement with actual recent connections data
    return null;
};

export default ConnectAgainSection;
