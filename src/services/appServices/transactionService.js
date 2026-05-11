import { privateRequestNew } from "./privateRequestNew";

export const transactionsApi = privateRequestNew.injectEndpoints({
    endpoints: (builder) => ({
        //  Get All Transactions
        getTransactions: builder.query({
        query: ({ page = 1, limit = 10, type = null, filterBy = null, sortBy = null, dateRange = null, customFromDate = null, customToDate = null, minPrice = null, maxPrice = null, search = null } = {}) => {
            let url = `transactions/all?page=${page}&limit=${limit}`;
            if (type) {
            url += `&type=${type}`;
            }
            if (filterBy) {
            url += `&filterBy=${filterBy}`;
            }
            if (sortBy) {
            url += `&sortBy=${sortBy}`;
            }
            if (dateRange) {
            url += `&dateRange=${dateRange}`;
            }
            if (customFromDate) {
            url += `&customFromDate=${customFromDate}`;
            }
            if (customToDate) {
            url += `&customToDate=${customToDate}`;
            }
            if (minPrice !== null && minPrice !== "") {
            url += `&minPrice=${minPrice}`;
            }
            if (maxPrice !== null && maxPrice !== "") {
            url += `&maxPrice=${maxPrice}`;
            }
            if (search) {
            url += `&search=${encodeURIComponent(search)}`;
            }
            return {
            url,
            method: "GET",
            };
        },
        providesTags: ["Transactions"],
        }),

        // Get Invoice for a transaction
        getInvoice: builder.mutation({
            query: (transactionId) => ({
                url: `transactions/invoice?transactionId=${transactionId}`,
                method: "GET",
            }),
        }),
    })
})

export const { useGetTransactionsQuery, useGetInvoiceMutation } = transactionsApi;