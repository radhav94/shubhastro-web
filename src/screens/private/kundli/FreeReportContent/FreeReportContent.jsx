import SwitchTabs from "../../../../component/UI/tabs/switchtabs/SwitchTabs";
import KaalSarp from "./kaalsarp/KaalSarp";
import Mangal from "./mangal/Mangal";
import Manglik from "./manglik/Manglik";
import Pitra from "./pitra/Pitra";

const FreeReport = ({ data }) => {
  const tabs = [
    {
      label: "Manglik",
      value: "manglik",
      component: Manglik,
      // children: [
      //   {
      //     label: "General",
      //     value: "generalInfo",
      //     component: () => <General />,
      //   },
      //   {
      //     label: "Planetary",
      //     value: "planetary",
      //     component: () => <Planetary />,
      //   },
      //   {
      //     label: "Vimshottari Dasha",
      //     value: "vimshottari",
      //     component: () => <Vimshottari />,
      //   },
      //   { label: "Yoga", value: "yoga", component: Yoga },
      // ],
    },
    {
      label: "Kaal Sarp",
      value: "kaalsarp",
      component: KaalSarp,
      // children: [
      //   {
      //     label: "Rudraksha",
      //     value: "rudraksha",
      //     component: () => <Rudraksha />,
      //   },
      //   {
      //     label: "Gemstones",
      //     value: "gemstones",
      //     component: () => <Gemstones />,
      //   },
      // ],
    },
    {
      label: "Mangal",
      value: "mangal",
      component: Mangal,
      // children: [
      //   { label: "Manglik", value: "manglik", component: () => <Manglik /> },
      //   { label: "Kalsarpa", value: "kalsarpa", component: () => <Kalsarpa /> },
      //   { label: "Sadesati", value: "sadesati", component: () => <Saresati /> },
      // ],
    },
    {
      label: "Pitra",
      value: "pitra",
      component: Pitra,
    },
  ];

  // const tabs = [
  //   { label: "North Indian", value: "north", component: () => <NorthIndian /> },
  //   { label: "South Indian", value: "south", component: () => <SouthIndian /> },
  // ];
  return (
    <div>
      {/* <NestedTabs tabs={tabs} /> */}
      <SwitchTabs tabs={tabs} />
    </div>
  );
};

export default FreeReport;
