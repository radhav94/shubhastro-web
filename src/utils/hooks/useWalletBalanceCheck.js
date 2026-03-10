import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGetBalanceMutation, useLazyGetWalletBalanceQuery } from "../../redux/api/wallet/walletApi";
import { Toast } from "../../component";

/**
 * Custom hook to check wallet balance before starting a session or downloading
 * @returns {Object} - { checkBalance, isChecking }
 */
export const useWalletBalanceCheck = () => {
  const navigate = useNavigate();
  const [getBalance, { isLoading: isCheckingSession }] = useGetBalanceMutation();
  const [getWalletBalance, { isLoading: isCheckingWallet }] = useLazyGetWalletBalanceQuery();

  /**
   * Check if user has sufficient balance (minimum 10)
   * @param {string} astrologerId - The astrologer ID (can be null for general balance check)
   * @param {string} type - Session type: "chat", "call", or "download"
   * @returns {Promise<boolean>} - Returns true if balance is sufficient, false otherwise
   */
  const checkBalance = useCallback(
    async (astrologerId, type = "chat") => {
      try {
        // For download or general balance check without astrologer
        if (!astrologerId || type === "download") {
          // Use the general wallet balance query
          const response = await getWalletBalance().unwrap();
          
          console.log("Wallet balance response:", response);
          
          // Check if balance is less than 10
          const balance = response?.data || 0;
          
          if (balance < 10) {
            Toast.error("Low wallet balance! Please recharge to continue.");
            
            // Redirect to recharge page with return URL after a short delay
            setTimeout(() => {
              const currentPath = window.location.pathname + window.location.search;
              navigate(`/recharge?returnUrl=${encodeURIComponent(currentPath)}`);
            }, 1500);
            
            return false;
          }
          
          return true;
        }
        
        // For astrologer-specific balance check
        const response = await getBalance({ astrologerId, type }).unwrap();
        
        console.log("Balance check response:", response);
        
        // Check if balance is less than 10
        const balance = response?.data?.balance || 0;
        
        if (balance < 10) {
          Toast.error("Low wallet balance! Please recharge to continue.");
          
          // Redirect to recharge page with return URL after a short delay
          setTimeout(() => {
            const currentPath = window.location.pathname + window.location.search;
            navigate(`/recharge?returnUrl=${encodeURIComponent(currentPath)}`);
          }, 1500);
          
          return false;
        }
        
        return true;
      } catch (error) {
        console.error("Balance check error:", error);
        Toast.error(error?.data?.message || "Failed to check wallet balance");
        return false;
      }
    },
    [getBalance, getWalletBalance, navigate]
  );

  return {
    checkBalance,
    isChecking: isCheckingSession || isCheckingWallet,
  };
};
