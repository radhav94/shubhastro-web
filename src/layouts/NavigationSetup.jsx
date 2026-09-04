import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setNavigate } from "../utils/navigationHelper";
import useLandingPageTracking from "../hooks/useLandingPageTracking";

const NavigationSetup = ({ children }) => {
    const navigate = useNavigate();
    
    // Track landing page on route changes
    useLandingPageTracking();

    useEffect(() => {
        setNavigate(navigate);
    }, [navigate]);

    return children;
};

export default NavigationSetup;
