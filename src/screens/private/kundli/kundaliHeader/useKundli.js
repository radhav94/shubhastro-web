// import React from "react";
// import { useState, useEffect } from "react";
// import { kundliGetAllUser } from "../../../../services/appServices/kundliServices";

// export const useKundlis = () => {
//   const [kundlis, setKundlis] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const fetchKundlis = async () => {
//     try {
//       setLoading(true);
//       const res = await kundliGetAllUser();
//       setKundlis(res?.data?.data || []);
//     } catch (err) {
//       setError("Failed to fetch kundli list");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchKundlis();
//   }, []);

//   return { kundlis, loading, error, fetchKundlis };
// };

// export const useSingleKundlis=()=>{
//     const [kundlis,setKundlis]=useState([]);
    
//     const createKundlis=()=>{
        
//     }
// }
