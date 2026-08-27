import { useMemo, useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import SeoHelmet from "../../../../component/SeoHelmet";
import {
  useGetSingleBlogQuery,
  useGetRelatedBlogsQuery,
  useGetBlogQuery,
} from "../../../../services/appServices/blogService";
import styles from "./SingleBlogDetails.module.scss";
import TTSButton from "../../../../component/UI/TTSButton";
import { PATH } from "../../../../utils/routes/Paths";
import { DefaultImages } from "../../../../utils/appImages";
import defaultBlogImg from "../../../../assets/images/default_image_16x9_1920x1080.png";
import { linkifyHtml } from "../../../../utils/helper/linkPreview";

const SingleBlogDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Router location, explicitly. Without this `location` resolves to
  // `window.location`, whose `key` is undefined — so the `key !== "default"`
  // check below would always take navigate(-1), including on a first history
  // entry where it does nothing. (Exactly the bug that was sitting in
  // AstrologerProfile.)
  const location = useLocation();
  const { data, isLoading } = useGetSingleBlogQuery(slug);
  const singleBLogData = data?.data;
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  /*
    Which share row is open — "article" for the one beside the title, or a blog
    id for a sidebar item. One piece of state covers both, mirroring `copiedId`.

    The rows used to be revealed only by `.shareWrap:hover` /
    `.popularShareWrap:hover`. A touch device has no hover, so on a phone the row
    never appeared at all and the share button — a 36px circle with a pointer
    cursor, a hover style and aria-label="Share blog" — did nothing whatsoever.
    The feature was unreachable on the devices most of these readers arrive on.

    Clicking now toggles the row. The CSS hover rules are left in place, so
    desktop behaviour is unchanged.
  */
  const [shareOpenId, setShareOpenId] = useState(null);
  const toggleShare = (id) => setShareOpenId((cur) => (cur === id ? null : id));

  // Dismiss on Escape or a pointer press elsewhere. The wrappers stop
  // pointerdown from bubbling, so pressing inside an open row doesn't close it
  // before the click lands.
  useEffect(() => {
    if (!shareOpenId) return undefined;
    const close = () => setShareOpenId(null);
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shareOpenId]);

  /*
    Article bodies are authored in the CMS and injected as-is. They regularly end
    with a plain-text URL ("Visit https://www.shubhastro.ai/") which reads as a
    link and isn't one, so readers click it and nothing happens. Wrap bare URLs
    in real anchors before injecting; existing <a> tags are left untouched.
  */
  const blogBodyHtml = useMemo(
    () => linkifyHtml(singleBLogData?.body || ""),
    [singleBLogData?.body]
  );

  // Fetch related blogs (matches by tags)
  const { data: relatedData } = useGetRelatedBlogsQuery(
    { blogId: singleBLogData?._id, page: 1, limit: 6 },
    { skip: !singleBLogData?._id }
  );

  // Fallback list for the "Most Popular" sidebar
  const { data: allBlogsData } = useGetBlogQuery({ page: 1, limit: 7 });

  const relatedBlogs = relatedData?.data || [];
  const allBlogs = allBlogsData?.data || [];

  // The single-blog endpoint may not return `author`; fall back to the
  // matching entry from the list endpoint (which does include author).
  const blogAuthor =
    singleBLogData?.author ||
    allBlogs.find((b) => b._id === singleBLogData?._id || b.slug === slug)?.author ||
    relatedBlogs.find((b) => b._id === singleBLogData?._id || b.slug === slug)?.author ||
    "";

  // Sidebar list: prefer related blogs, fallback to all blogs, exclude current.
  //
  // The `b.slug || b._id` guard is load-bearing: the card's `to` is built with
  // `.replace(":slug", blog.slug || blog._id)`, so an entry carrying neither
  // rendered a link to the literal path /blog/undefined, which resolves to the
  // "No blog found" branch of this very screen. A card that reads like an article
  // and lands on an empty page is worse than one that was never listed.
  const popularBlogs = (relatedBlogs.length > 0 ? relatedBlogs : allBlogs)
    .filter((b) => (b.slug || b._id) && (b.slug || b._id) !== slug && b._id !== singleBLogData?._id)
    .slice(0, 6);

  const cleanText = singleBLogData?.body
    ?.replace(/<[^>]+>/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim();

  /*
    Route in-article links through React Router.

    The article body is CMS markup injected with dangerouslySetInnerHTML, so the
    router never sees its anchors. An internal link — "talk to an Astrologer"
    pointing at /astrologers, or a cross-link to a Kundli or horoscope page —
    was therefore a full document load: the SPA tears down and re-boots
    mid-article, re-downloading the entry bundle and re-running every startup
    request before the destination paints. For seconds the page looks like it
    ignored the click, which is exactly when a reader clicks again. It also
    inflates page counts: this pattern showed up as a session with 95 page views
    from 80 clicks, looping between Kundli, Daily Horoscope and Astrologers.

    Delegated from the container rather than bound per anchor, because the body
    is replaced wholesale for every article. Everything that should stay a
    browser navigation is left alone: modified and non-primary clicks, new-tab
    links, downloads, other origins, and non-http schemes such as mailto: and
    tel: (URL gives those an origin of "null", so the origin check covers them).
  */
  const handleBodyClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const anchor = e.target?.closest?.("a[href]");
    if (!anchor) return;
    if (anchor.target && anchor.target !== "_self") return;
    if (anchor.hasAttribute("download")) return;

    let url;
    try {
      url = new URL(anchor.href, window.location.origin);
    } catch {
      return;
    }

    if (url.origin !== window.location.origin) return;

    /*
      Anchors that resolve to the article we are already on.

      The previous version only bailed out when there was a hash
      (`pathname === current && url.hash`), which left two very common cases
      falling through to `navigate(<the page we are already reading>)` — a no-op
      that renders nothing new, i.e. a dead click:

        <a href="#">        url.hash is "" for a bare "#", so this fell through.
        <a href="">         resolves to the current URL, same thing.

      Both are routine in CMS-authored bodies, and `.blogContent a` underlines and
      colours every anchor, so a placeholder link is indistinguishable from a real
      one. Worse, the `preventDefault()` also suppressed the scroll-to-top that
      browsers natively perform for `href="#"` — so the handler took away the one
      thing the click used to do.

      A hash whose target does not exist in this article is dead natively too, and
      is treated the same way: a broken in-page link is a CMS content problem we
      cannot fix from here, and returning the reader to the top of the piece is the
      least surprising thing left.
    */
    const isSamePage =
      url.pathname === window.location.pathname && url.search === window.location.search;

    if (isSamePage) {
      const targetId = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";
      if (targetId) {
        const target =
          document.getElementById(targetId) || document.getElementsByName(targetId)[0];
        // Real in-page anchor with something to jump to — let the browser do it.
        if (target) return;
      }
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };

  const handleShare = (e, platform) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${slug}`;
    switch (platform) {
      // "noopener,noreferrer": unlike a target="_blank" anchor, window.open does
      // NOT imply noopener, so the share tab kept a live window.opener handle
      // back to this page.
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      case "copy":
        navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      default:
        break;
    }
    // Collapse the row once a destination has been picked. Not for "copy",
    // which needs to stay open long enough to show its own "Copied!" label.
    if (platform !== "copy") setShareOpenId(null);
  };

  const handleShareBlog = (e, platform, blog) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${blog.slug || blog._id}`;
    switch (platform) {
      // See the note in handleShare: window.open needs noopener explicitly.
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
        break;
      case "copy": {
        const id = blog._id || blog.blogId;
        navigator.clipboard?.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        break;
      }
      default:
        break;
    }
    if (platform !== "copy") setShareOpenId(null);
  };

  /*
    Both of these were a single centred <p> with a 60px pad and nothing else on
    the page — no back control, no link to the blog index, nothing to click. The
    "No blog found" branch is also where an unresolvable slug lands (including the
    /blog/undefined case the sidebar guard upstream exists to prevent), so it is
    reachable from inside the product, not just from a bad external link.

    Same treatment as the other dead-end states: say what happened and always
    offer a way onward.
  */
  if (isLoading) {
    return (
      <div className={styles.stateWrap}>
        <p className={styles.stateText}>Loading article…</p>
        <Link to={PATH.privateRoutes.BLOG.path} className={styles.stateLink}>
          Back to all blogs
        </Link>
      </div>
    );
  }

  if (!singleBLogData) {
    return (
      <div className={styles.stateWrap}>
        <h1 className={styles.stateTitle}>We couldn&apos;t find that article</h1>
        <p className={styles.stateText}>
          It may have been moved or unpublished.
        </p>
        <div className={styles.stateActions}>
          {/*
            `location.key === "default"` means this is the first entry in the
            history stack, where navigate(-1) is inert. Sending them to the blog
            index is better than a button that does nothing.
          */}
          <button
            type="button"
            className={styles.stateBtn}
            onClick={() =>
              location.key !== "default" ? navigate(-1) : navigate(PATH.privateRoutes.BLOG.path)
            }
          >
            Go back
          </button>
          <Link to={PATH.privateRoutes.BLOG.path} className={styles.stateLink}>
            Browse all blogs
          </Link>
        </div>
      </div>
    );
  }

  const seoData = {
    meta_title: singleBLogData.meta_title || singleBLogData.title,
    meta_description: singleBLogData.meta_description || singleBLogData.description || cleanText?.slice(0, 160),
  };

  return (
    <div className={styles.pageWrapper}>
      <SeoHelmet data={seoData} image={singleBLogData.img} />

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        {/* A bare navigate(-1) does nothing when this article is the first entry
            in the history stack — which is the normal case for blog traffic,
            since most of it arrives on an article straight from search. Fall back
            to the blog index so the chevron always goes somewhere. */}
        <button
          className={styles.backBtn}
          onClick={() =>
            location.key !== "default" ? navigate(-1) : navigate(PATH.privateRoutes.BLOG.path)
          }
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Link to={PATH.privateRoutes.HOME.path}>Home</Link>
        <span className={styles.sep}>›</span>
        <Link to={PATH.privateRoutes.BLOG.path}>Blogs</Link>
        <span className={styles.sep}>›</span>
        <span className={styles.current}>{singleBLogData.title}</span>
      </nav>

      <div className={styles.contentLayout}>
        {/* LEFT: Article */}
        <article className={styles.article}>
          {/* Title */}
          <h1 className={styles.title}>{singleBLogData.title}</h1>

          {/* Meta row: author | date + TTS/share */}
          <div className={styles.metaRow}>
            <div className={styles.metaInfo}>
              {blogAuthor && (
                <span className={styles.author}>{blogAuthor}</span>
              )}
              <span className={styles.date}>
                {dayjs(singleBLogData.publishDate).format("DD MMM, YYYY")}
              </span>
            </div>
            <div className={styles.metaActions}>
              <TTSButton
                text={`${[singleBLogData?.title, singleBLogData?.author, cleanText]
                  .filter(Boolean)
                  .join(". ")}`}
              />
              <div
                className={styles.shareWrap}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.shareBtn}
                  aria-label="Share blog"
                  aria-expanded={shareOpenId === "article"}
                  onClick={() => toggleShare("article")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 18 20" fill="none">
                    <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                  </svg>
                </button>
                <div
                  className={`${styles.shareIconSocial} ${
                    shareOpenId === "article" ? styles.shareIconSocialOpen : ""
                  }`}
                >
                  <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "whatsapp")}>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                  </span>
                  <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "facebook")}>
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                  </span>
                  <span className={styles.socialIconWrapper} onClick={(e) => handleShare(e, "copy")}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    {copied && <span className={styles.copiedText}>Copied!</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Image */}
          {/*
            width/height give the browser the 16:9 ratio during HTML parse, before
            the stylesheet's `aspect-ratio` is even applied — belt and braces
            against the box collapsing to 0px and then expanding when the image
            decodes. They are a ratio hint, not a size: `.bannerImage` is
            `width: 100%`, so the rendered width is unaffected. See the note on
            .bannerImage for why this matters (0.68 CLS on this route).

            fetchPriority high: on a direct landing this is the article's hero and
            the leading LCP candidate, and its URL only arrives with the blog
            payload, so it cannot be preloaded from the HTML.
          */}
          <img
            src={singleBLogData?.image?.medium || singleBLogData?.img || defaultBlogImg}
            alt={singleBLogData.title}
            className={styles.bannerImage}
            width="1200"
            height="675"
            fetchPriority="high"
            decoding="async"
            onError={(e) => { e.target.onerror = null; e.target.src = defaultBlogImg; }}
          />

          {/* Blog Content */}
          {/* onClick delegation, not per-anchor listeners — see handleBodyClick.
              No role/tabIndex: this is not a control, it only upgrades the
              anchors inside it, which keep their own keyboard behaviour. */}
          <div
            className={styles.blogContent}
            onClick={handleBodyClick}
            dangerouslySetInnerHTML={{ __html: blogBodyHtml }}
          ></div>
        </article>

        {/* RIGHT: Most Popular Blogs */}
        {popularBlogs.length > 0 && (
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>MOST POPULAR BLOGS</h2>
            <ul className={styles.popularList}>
              {popularBlogs.map((blog) => (
                <li key={blog._id || blog.blogId}>
                  <Link
                    to={PATH.privateRoutes.SINGLEBLOG.path.replace(
                      ":slug",
                      blog.slug || blog._id
                    )}
                    className={styles.popularItem}
                  >
                    <span className={styles.popularAuthor}>{blog.author || "ShubhAstro"}</span>
                    <h3 className={styles.popularItemTitle}>{blog.title}</h3>
                    <div className={styles.popularMeta}>
                      <span className={styles.popularDate}>
                        {dayjs(blog.publishDate).format("DD MMM, YYYY")}
                      </span>
                      {/*
                        Pointer-only, deliberately. This whole card is a <Link>,
                        so giving the share toggle button semantics would nest an
                        interactive element inside an anchor — invalid, and it
                        lets the inner control swallow the click without the
                        anchor navigating. The article's own share button above is
                        a real, keyboard-reachable <button>; this is the
                        convenience copy. Restructuring the card so the share
                        control sits outside the anchor is the proper fix and is
                        more than this change should take on.

                        preventDefault stops the card navigating when the reader
                        reaches for share; the added onClick is what makes the row
                        open at all on touch, where there is no hover.
                      */}
                      <span
                        className={styles.popularShareWrap}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleShare(blog._id || blog.blogId);
                        }}
                      >
                        <span className={styles.popularShare} aria-label="Share blog">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 18 20" fill="none">
                            <path d="M15 14.08C14.24 14.08 13.56 14.38 13.04 14.85L5.91 10.7C5.96 10.47 6 10.24 6 10C6 9.76 5.96 9.53 5.91 9.3L12.96 5.19C13.5 5.69 14.21 6 15 6C16.66 6 18 4.66 18 3C18 1.34 16.66 0 15 0C13.34 0 12 1.34 12 3C12 3.24 12.04 3.47 12.09 3.7L5.04 7.81C4.5 7.31 3.79 7 3 7C1.34 7 0 8.34 0 10C0 11.66 1.34 13 3 13C3.79 13 4.5 12.69 5.04 12.19L12.16 16.35C12.11 16.56 12.08 16.78 12.08 17C12.08 18.61 13.39 19.92 15 19.92C16.61 19.92 17.92 18.61 17.92 17C17.92 15.39 16.61 14.08 15 14.08Z" fill="#D43400"/>
                          </svg>
                        </span>
                        <span
                          className={`${styles.shareIconSocial} ${
                            shareOpenId === (blog._id || blog.blogId)
                              ? styles.shareIconSocialOpen
                              : ""
                          }`}
                        >
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShareBlog(e, "whatsapp", blog)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                          </span>
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShareBlog(e, "facebook", blog)}>
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"></path></svg>
                          </span>
                          <span className={styles.socialIconWrapper} onClick={(e) => handleShareBlog(e, "copy", blog)}>
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            {copiedId === (blog._id || blog.blogId) && <span className={styles.copiedText}>Copied!</span>}
                          </span>
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
};

export default SingleBlogDetails;
