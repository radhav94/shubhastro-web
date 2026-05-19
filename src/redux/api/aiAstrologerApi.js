import { privateRequestNew } from "../../services/appServices/privateRequestNew";

export const aiAstrologerApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAIAstrologerUsage: builder.query({
      query: ({ astrologerId, isEmergency } = {}) => {
        const params = {};
        if (astrologerId) params.astrologerId = astrologerId;
        if (isEmergency) params.isEmergency = isEmergency;
        return {
          url: "ai-astrologer/usage",
          params,
        };
      },
    }),
  }),
});

export const { useGetAIAstrologerUsageQuery, useLazyGetAIAstrologerUsageQuery } =
  aiAstrologerApi;
