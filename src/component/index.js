export { default as Title } from "../component/UI/Title";

export { default as Breadcrumb } from "../component/BreadCrumb";
export { default as Divider } from "../component/Divider";
export { default as PrimaryText } from "../component/PrimaryText";
export { default as PrimaryButton } from "../component/PrimaryButton";
export { default as ErrorText } from "../component/ErrorText";
export { default as Toast } from "../component/toast";
export { default as ErrorBoundary } from "../component/ErrorBoundary";

//UI releated component

//cards
export { default as AstrologerCard } from "../component/UI/cards/AstrologersCard";
export { default as ChatAstrologerCard } from "../component/UI/cards/ChatAstrologerCard";
export { default as PanchangInputCard } from "../component/UI/cards/panchangInput/PanchangInputCard";
export { default as BlogCard } from "../component/UI/cards/BlogCard";
export { default as NewsCard } from "../component/UI/cards/NewsCard";
export { default as ImageTextCard } from "../component/UI/cards/ImageTextCard";
export { default as WorkInProgressCard } from "../component/UI/cards/WorkInProgressCard";
export { default as LiveAstroCard } from "../component/UI/cards/LiveAstroCard";
export { default as ContentCard } from "../component/UI/cards/ContentCard";
export { default as MoreBlogsCarousel } from "../component/UI/cards/MoreBlogsCarousel";
export { default as PopularBlogsSection } from "../component/UI/cards/PopularBlogsSection";
export { default as RelationalBlogsSection } from "../component/UI/cards/RelationalBlogsSection";
export { default as TrendingBlogsCarousel } from "../component/UI/cards/TrendingBlogsCarousel";

//formic control
export { default as Checkbox } from "../component/formikcontrols/checkbox/Checkbox";
export { default as Input } from "../component/formikcontrols/input/Input";

//model
export { default as DetailsModal } from "../component/UI/modal/detailsModal/DetailsModal";
export { default as RechargeAlertModel } from "../component/UI/modal/rechargeAlertModel/ReachargeAlertModel";
export { default as RechargeModal } from "../component/UI/modal/RechargeModal/RechargeModal";
export { default as LiveModal } from "../component/UI/modal/liveModal/LiveModal";
export { default as WheelDatePicker } from "../component/UI/WheelDatePicker/WheelDatePicker";

//profile
export { default as AddProfileModal } from "../component/UI/Profile/AddProfileModal";
export { default as EditProfileModal } from "../component/UI/Profile/EditProfileModal";
export { default as ProfileListingModal } from "../component/UI/Profile/ProfileListingModal";
export { default as DeleteConfirmationModal } from "../component/UI/modal/deleteModal/DeleteConfirmationModal";

/*
  PieChart is deliberately NOT re-exported here.

  It does `import { Chart } from 'chart.js/auto'`, which registers every
  controller as a side effect and so cannot be tree-shaken. 26 files import this
  barrel, several of them eagerly, so re-exporting PieChart pulled all ~196 KB
  of chart.js into the entry chunk for every visitor — including the homepage,
  which has no charts.

  Its one consumer (FaceReadingResult) imports it directly from
  ../component/UI/charts/PieChart, keeping chart.js in that lazy route's chunk.
*/

//chat
export { default as MessageTicks } from "../component/UI/chat/MessageTicks";
export { default as ReplyPreview } from "../component/UI/chat/ReplyPreview";
