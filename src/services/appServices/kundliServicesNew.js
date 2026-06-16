import { privateRequestNew } from "./privateRequestNew";

/**
 * Checks if kundli list contains a "self" profile.
 * If not, redirects to personalize screen so user can register one.
 */
const checkSelfKundliAndRedirect = (data) => {
  const profiles = data?.data || [];
  const hasSelf = profiles.length > 0;

  if (!hasSelf) {
    const path = window.location.pathname;
    if (path === "/login" || path === "/register" || path === "/profile/add") return;
    setTimeout(() => window.location.replace("/login?step=personalize"), 0);
  }
};

export const kundliApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getAllKundlis: builder.query({
      query: () => ({ url: "kundlis/all", method: "GET" }),
      providesTags: () => [
        { type: "Kundlis", id: "LIST" },
      ],
      keepUnusedDataFor: 0,
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          checkSelfKundliAndRedirect(data);
        } catch {
          // API error — don't redirect
        }
      },
    }),

    createKundli: builder.mutation({
      query: (body) => ({
        url: "kundlis/create",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
    }),

    deleteKundli: builder.mutation({
      query: (id) => ({
        url: "kundlis/delete",
        method: "DELETE",
        body: { kundliId: id },
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
    }),

    editKundli: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `kundlis/editkundli/${id}`,
        method: "PUT",
        body,
        headers: { "Content-Type": "application/json", accept: "application/json" },
      }),
      invalidatesTags: () => [{ type: "Kundlis", id: "LIST" }, "Kundlis"],
    }),

    getKundliPdf: builder.query({
      query: ({ kundliId, language }) => ({
        url: `kundlis/kundli-pdf`,
        method: "GET",
        params: { id: kundliId, language: language || "en" },
      }),
    }),
  }),
});

export const {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
  useEditKundliMutation,
  useGetKundliPdfQuery,
  useLazyGetKundliPdfQuery,
} = kundliApi;

export const useAddKundliMutation = useCreateKundliMutation;
