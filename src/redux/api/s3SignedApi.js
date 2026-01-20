import { privateRequestNew } from "../../services/appServices/privateRequestNew";

export const s3SignedApi = privateRequestNew.injectEndpoints({
  endpoints: (builder) => ({
    getS3SignedUrl: builder.mutation({
      query: ({ fileType }) => ({
        url: "getUploadUrl?fileType="+encodeURI(fileType),
        method: "GET"
      }),
    })
  }),
});

export const { useGetS3SignedUrlMutation } = s3SignedApi;
