import { privateRequestNew } from "./privateRequestNew";

export const transactionsApi = privateRequestNew.injectEndpoints({
    endpoints: (builder) => ({
        //  Get All Transactions
        getTransactions: builder.query({
        query: ({ page = 1, limit = 10, type = null } = {}) => {
            let url = `transactions/all?page=${page}&limit=${limit}`;
            if (type) {
            url += `&type=${type}`;
            }
            return {
            url,
            method: "GET",
            };
        },
        providesTags: ["Transactions"],
        }),
    })
})

export const {useGetTransactionsQuery} = transactionsApi;