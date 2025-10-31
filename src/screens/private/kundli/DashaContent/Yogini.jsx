import Table from "../../../../component/UI/table/kundli/dasha/table";

const Yogini = ({data}) =>{
    return(
        <div className="w-full mr-4 rounded-sm">
            <div className="" >
                <p className="font-bold bg-[#fff5d1] p-2 mx-2 w-full" >Note: <span className="font-normal" >MAN: Mangala, PIN: Pingala, DHA: Dhanya, BHR: Bhramari, BHA: Bhadrika, ULK: Ulka, SID: Siddha, SAN: Sankata</span></p>
            </div>
            <Table dashaData={data.yogini} />
        </div>
    )
}

export default Yogini;