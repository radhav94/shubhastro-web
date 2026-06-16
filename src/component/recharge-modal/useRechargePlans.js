import { useEffect, useState, useCallback } from 'react';
import { useGetAllPlansQuery } from '../../redux/api/plansApi/plansApi';

/**
 * Custom hook to fetch and manage recharge plans
 * 
 * Fetches all plans from the API and filters for recharge plans (those with plan_id).
 * Provides loading states, error handling, and refetch capability.
 * 
 * @returns {Object} Plans data and loading states
 * @returns {Array} plans - Filtered array of recharge plans
 * @returns {boolean} isLoading - Loading state (initial load or refetching)
 * @returns {string|null} error - Error message if fetch failed
 * @returns {Function} refetch - Function to manually refetch plans
 * 
 * @example
 * const { plans, isLoading, error, refetch } = useRechargePlans();
 * 
 * if (isLoading) return <Loader />;
 * if (error) return <Error message={error} onRetry={refetch} />;
 * return <PlansList plans={plans} />;
 */
export const useRechargePlans = (skip = false) => {
  // State management
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);

  // RTK Query hook
  const { 
    data, 
    isLoading, 
    isFetching, 
    isError, 
    error: apiError,
    refetch: apiRefetch,
  } = useGetAllPlansQuery(undefined, {
    // Skip fetching until modal is actually opened
    skip,
    // Refetch on mount and focus for fresh data
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
  });

  /**
   * Process and filter plans data
   * Filters for recharge plans (those with plan_id field)
   */
  useEffect(() => {
    if (data?.data) {
      try {
        // Validate data structure
        if (!Array.isArray(data.data)) {
          console.error('[useRechargePlans] Invalid data format:', data);
          setError('Invalid data format received');
          setPlans([]);
          return;
        }

        // Filter plans: ensure valid plan objects
        const rechargePlans = data.data.filter((plan) => {
          if (!plan || typeof plan !== 'object') return false;
          return true;
        });

        // Sort by actualPrice (ascending) for better UX
        rechargePlans.sort((a, b) => {
          const priceA = a.actualPrice || 0;
          const priceB = b.actualPrice || 0;
          return priceA - priceB;
        });

        setPlans(rechargePlans);
        setError(null);
      } catch (processingError) {
        console.error('[useRechargePlans] Error processing plans:', processingError);
        setError('Failed to process plans data');
        setPlans([]);
      }
    }
  }, [data]);

  /**
   * Handle API errors
   */
  useEffect(() => {
    if (isError) {
      let errorMessage = 'Failed to load recharge plans';

      // Extract error message from different error formats
      if (apiError) {
        if (apiError.data?.message) {
          errorMessage = apiError.data.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        } else if (apiError.status === 'FETCH_ERROR') {
          errorMessage = 'Network error. Please check your connection.';
        } else if (apiError.status === 'PARSING_ERROR') {
          errorMessage = 'Failed to parse server response.';
        } else if (apiError.status === 'TIMEOUT_ERROR') {
          errorMessage = 'Request timeout. Please try again.';
        } else if (typeof apiError.status === 'number') {
          errorMessage = `Server error (${apiError.status}). Please try again.`;
        }
      }

      console.error('[useRechargePlans] API error:', apiError);
      setError(errorMessage);
      setPlans([]);
    }
  }, [isError, apiError]);

  /**
   * Refetch wrapper with error handling
   */
  const refetch = useCallback(async () => {
    try {
      setError(null);
      await apiRefetch();
    } catch (refetchError) {
      console.error('[useRechargePlans] Refetch error:', refetchError);
      setError('Failed to reload plans. Please try again.');
    }
  }, [apiRefetch]);

  return {
    plans,
    isLoading: isLoading || isFetching,
    error,
    refetch,
  };
};
