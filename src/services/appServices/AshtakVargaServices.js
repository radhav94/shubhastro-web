import { Toast } from "../../component";
import { callAshtakVargaAPI } from "./pythonDirectApi"

export const getAstakVargaData = async (values) =>{
   try {
     const ashtakVarga = await callAshtakVargaAPI("create-astakvarg-kundali-custom",values)
    return ashtakVarga;
    
   } catch (error) {
    Toast.error("Error ", error.toString());
    return null;
   }
}