// import { privateRequest } from "./privateRequest";

// import { privateRequest } from "../privateRequest";
import { privateRequestNew } from "./privateRequestNew";

export const kundliApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({

    // GET ALL KUNDLIS
   getAllKundlis: builder.query({
      query: () => ({
        url: "kundlis/all",
        method: "GET",
      }),
      providesTags: ["Kundlis"],        // ⭐ Add this
    }),

    // CREATE KUNDLI
    createKundli: builder.mutation({
      query: (body) => ({
        url: "kundlis/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Kundlis"],     // ⭐ Refetch GET after success
    }),

    // DELETE KUNDLI
   deleteKundli: builder.mutation({
      query: (id) => ({
        url: "kundlis/delete",
        method: "DELETE",
        body: { kundliId: id },
      }),
      invalidatesTags: ["Kundlis"],     // ⭐ Refetch on delete
    }),


  }),
});

// HOOKS
export const {
  useGetAllKundlisQuery,
  useCreateKundliMutation,
  useDeleteKundliMutation,
} = kundliApi;
