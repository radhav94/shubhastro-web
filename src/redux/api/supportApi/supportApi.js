import { privateRequestNew } from "../../../services/appServices/privateRequestNew";

export const supportApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getSupportQuestions: builder.query({
      query: (role = "user") => ({
        url: `support/topics`,
        params: { role },
      }),
    }),
    getSubQuestions: builder.query({
      query: ({ mainQuestionId, role = "user" }) => ({
        url: `support/questions/sub`,
        params: { mainQuestionId, role },
      }),
    }),
    getSubTopics: builder.query({
      query: (topicId) => ({
        url: `support/topics/${topicId}`,
      }),
    }),
    getUserSessions: builder.query({
      query: ({ page = 1, limit = 3 } = {}) => ({
        url: `sessions/getAllUserSessions`,
        params: { page, limit },
      }),
    }),
    getSupportEntitySessions: builder.query({
      query: ({ entityType, page = 1, limit = 3 } = {}) => ({
        url: `support/entities/${entityType}`,
        params: { page, limit },
      }),
    }),
    getSupportAnswer: builder.query({
      query: (questionId) => ({
        url: `support/answers`,
        params: { questionId },
      }),
    }),
    createSupportTicket: builder.mutation({
      query: (body) => ({
        url: `support/tickets`,
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
    }),
    getMyTickets: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: `support/tickets/my`,
        params: { page, limit },
      }),
    }),
    getTicketById: builder.query({
      query: (ticketId) => ({
        url: `support/tickets/${ticketId}`,
      }),
    }),
    rateTicket: builder.mutation({
      query: ({ ticketId, rating, feedback }) => ({
        url: `support/tickets/${ticketId}/rate`,
        method: "POST",
        body: { rating, feedback },
        headers: { "Content-Type": "application/json" },
      }),
    }),
    replyToTicket: builder.mutation({
      query: ({ ticketId, message, isUserMessage = true, attachments }) => ({
        url: `support/tickets/${ticketId}/message`,
        method: "POST",
        body: { message, isUserMessage, ...(attachments?.length ? { attachments } : {}) },
        headers: { "Content-Type": "application/json" },
      }),
    }),
  }),
});

export const {
  useGetSupportQuestionsQuery,
  useLazyGetSubQuestionsQuery,
  useLazyGetSubTopicsQuery,
  useLazyGetUserSessionsQuery,
  useLazyGetSupportEntitySessionsQuery,
  useLazyGetSupportAnswerQuery,
  useCreateSupportTicketMutation,
  useGetMyTicketsQuery,
  useGetTicketByIdQuery,
  useRateTicketMutation,
  useReplyToTicketMutation,
} = supportApi;
