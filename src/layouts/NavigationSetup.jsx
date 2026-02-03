import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setNavigate } from "../utils/navigationHelper";

const NavigationSetup = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);

    return children;
};

export default NavigationSetup;
