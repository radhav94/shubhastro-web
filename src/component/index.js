/*
 * Leaf-component barrel.
 *
 * SCOPE — read before adding an export
 * ------------------------------------
 * Only cheap, dependency-free presentational leaves belong here. Anything that
 * pulls a form library, a chart library, a date picker, a modal tree or a large
 * stylesheet must be imported from its own module by the screens that use it.
 *
 * Why, measured
 * -------------
 * `src/context/WaitingQueueContext.jsx` imports `Toast` from this file, and
 * WaitingQueueContext is mounted by App.jsx, so this module is in the entry
 * chunk that every visitor on every route downloads and parses before anything
 * renders.
 *
 * Rollup will drop an unused re-export only if the module behind it is
 * side-effect free. Every component here imports a `*.module.scss`, and a CSS
 * import IS a side effect, so the modules behind these re-exports could not be
 * shaken out — importing `Toast` retained the whole barrel. Attributing the
 * entry chunk's modules through the bundle graph, the heavy re-exports that
 * used to live here cost (rendered, pre-minify):
 *
 *     yup                     72,201 B   via DetailsModal
 *     lodash-es (119 modules) 69,079 B   via formik
 *     formik                  43,313 B   via Checkbox / Input
 *     AddProfileModal         29,638 B
 *     DetailsModal            12,499 B
 *     ProfileListingModal     11,498 B
 *     RechargeModal           11,346 B
 *
 * — roughly 250 kB of raw JS in the critical path of ~180 routes, for three
 * form controls and a set of modals that only a handful of screens ever open.
 * Neither formik nor yup is used anywhere in the app's first render.
 *
 * The heavy members were not deleted, they moved to direct imports at their
 * (few) call sites, so they now land in those screens' own lazy route chunks.
 * `git log` on this file has the codemod that did it.
 *
 * PieChart is deliberately NOT re-exported here either — see below.
 */

export { default as Title } from "../component/UI/Title";

export { default as Breadcrumb } from "../component/BreadCrumb";
export { default as Divider } from "../component/Divider";
export { default as PrimaryText } from "../component/PrimaryText";
export { default as PrimaryButton } from "../component/PrimaryButton";
export { default as ErrorText } from "../component/ErrorText";
export { default as Toast } from "../component/toast";
export { default as ErrorBoundary } from "../component/ErrorBoundary";

/*
  Everything below was previously re-exported here and is now imported directly
  by its consumers. Listed so a future reader can see what moved and does not
  re-add it by reflex:

    cards          AstrologerCard, ChatAstrologerCard, PanchangInputCard,
                   BlogCard, NewsCard, ImageTextCard, WorkInProgressCard,
                   LiveAstroCard, ContentCard, MoreBlogsCarousel,
                   PopularBlogsSection, RelationalBlogsSection,
                   TrendingBlogsCarousel
    formik         Checkbox, Input            (pull formik + lodash-es)
    modals         DetailsModal (pulls yup), RechargeAlertModel, RechargeModal,
                   LiveModal, DeleteConfirmationModal
    profile        AddProfileModal (pulls formik + yup), EditProfileModal,
                   ProfileListingModal
    pickers        WheelDatePicker
    chat           MessageTicks, ReplyPreview

  PieChart was never here: it does `import { Chart } from 'chart.js/auto'`,
  which registers every controller as a side effect and so cannot be
  tree-shaken — re-exporting it pulled ~196 KB of chart.js into the entry chunk
  for every visitor, including the homepage, which has no charts. Its one
  consumer (FaceReadingResult) imports it directly from
  ../component/UI/charts/PieChart.
*/
