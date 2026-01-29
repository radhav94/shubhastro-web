// import { privateRequest } from "./privateRequest";

// import { privateRequest } from "../privateRequest";
import { privateRequestNew } from "./privateRequestNew";

export const kundliApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL KUNDLIS
   getAllKundlis: builder.query({
      query: (userId) => ({
        url: "kundlis/all",
        method: "GET",
      }),
      providesTags: (result, error, userId) => [
        { type: "Kundlis", id: userId || "LIST" }
      ],
      // Force refetch on mount or when userId changes
      keepUnusedDataFor: 0, // Don't cache data after component unmounts
    }),

    // CREATE KUNDLI
    createKundli: builder.mutation({
      query: (body) => ({
        url: "kundlis/create",
        method: "POST",
        body,
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Kundlis", id: "LIST" },
        // Invalidate for all possible user IDs to be safe
        "Kundlis"
      ],
    }),

    // DELETE KUNDLI
   deleteKundli: builder.mutation({
      query: (id) => ({
        url: "kundlis/delete",
        method: "DELETE",
        body: { kundliId: id },
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Kundlis", id: "LIST" },
        // Invalidate for all possible user IDs to be safe
        "Kundlis"
      ],
    }),


  }),
});

// HOOKS
export const {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} = kundliApi;

// Export addKundli as an alias for createKundli for backward compatibility
export const useAddKundliMutation = useCreateKundliMutation;
