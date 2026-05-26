import { useState, useRef, useEffect } from "react";
import { FiImage, FiX } from "react-icons/fi";
import styles from "../Community.module.scss";
import SuccessModal from "./SuccessModal";
import {
  useGetCommunityPostQuery,
  useUpdateCommunityPostMutation,
} from "../../../../redux/api/community/communityApi";
import { useGetS3SignedUrlMutation } from "../../../../redux/api/s3SignedApi";
import Toast from "../../../../component/toast";

const MAX_IMAGES = 5;

const EditPost = ({ postId, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { data: post, isLoading: isLoadingPost } = useGetCommunityPostQuery(postId, { skip: !postId });
  const [updatePost, { isLoading: isSubmitting }] = useUpdateCommunityPostMutation();
  const [getS3SignedUrl] = useGetS3SignedUrlMutation();

  // Populate form with existing post data
  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setContent(post.body || "");
      setIsAnonymous(post.isAnonymous || false);
      if (post.images && post.images.length > 0) {
        setImages(post.images.map((url) => ({ url, isExisting: true })));
      }
    }
  }, [post]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const newFiles = files.slice(0, remaining);
    const newImages = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImagesToS3 = async (newImages) => {
    const uploadedUrls = [];

    for (const img of newImages) {
      const ext = img.file.name?.split(".").pop();
      const fileType = ext ? `application/${ext}` : img.file.type;

      const signedUrl = await getS3SignedUrl({ fileType }).unwrap();
      const uploadUrl = signedUrl.uploadUrl;
      const fileUrl = uploadUrl.split("?")[0];

      try {
        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: img.file,
        });

        if (res.ok) {
          uploadedUrls.push(fileUrl);
        }
      } catch {
        console.warn("Image upload failed (CORS), skipping:", fileUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.error("Title is required");
      return;
    }
    if (!content.trim() || content.trim().length < 20) {
      Toast.error("Post body must be at least 20 characters");
      return;
    }

    try {
      setIsUploading(true);

      // Separate existing and new images
      const existingUrls = images.filter((img) => img.isExisting).map((img) => img.url);
      const newImages = images.filter((img) => !img.isExisting);

      let newUploadedUrls = [];
      if (newImages.length > 0) {
        newUploadedUrls = await uploadImagesToS3(newImages);
      }

      const allImageUrls = [...existingUrls, ...newUploadedUrls];

      const postData = {
        postId,
        title: title.trim(),
        body: content.trim(),
        images: allImageUrls,
        linkedProducts: [],
      };

      await updatePost(postData).unwrap();
      setShowSuccess(true);
    } catch (error) {
      const message = error?.data?.message || "Failed to update post";
      Toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (onSuccess) onSuccess();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (onSuccess) onSuccess();
  };

  const isBusy = isSubmitting || isUploading;

  if (isLoadingPost) {
    return (
      <div className={styles.createPostLayout}>
        <div className={styles.createPostMain}>
          <div className={styles.commentLoading}>Loading post...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.createPostLayout}>
      <div className={styles.createPostMain}>
        <h2 className={styles.sectionHeading}>
          <span className={styles.headingBar} />
          EDIT POST
        </h2>

        <div className={styles.createPostForm}>
          {/* Community (read-only) */}
          {post?.spaceInfo && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Community</label>
              <input
                type="text"
                value={`${post.spaceInfo.icon || ""} ${post.spaceInfo.name || ""}`}
                className={styles.formInput}
                disabled
              />
            </div>
          )}

          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="Give your post a title (max 200 chars)"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              className={styles.formInput}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Share your thoughts <span className={styles.required}>*</span>
            </label>
            <textarea
              placeholder="What's on your mind? (min 20 chars)"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              className={styles.formTextarea}
              rows={5}
              maxLength={5000}
            />
          </div>

          {/* Upload Images */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Images</label>
            <button
              className={styles.imageUploadLabel}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              disabled={images.length >= MAX_IMAGES}
            >
              <FiImage size={18} />
              <span>{images.length >= MAX_IMAGES ? "Maximum 5 images reached" : "Choose images (max 5)"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              hidden
            />
            {images.length > 0 && (
              <div className={styles.imagePreviewGrid}>
                {images.map((img, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <img src={img.isExisting ? img.url : img.preview} alt={`Preview ${index + 1}`} />
                    <button
                      onClick={() => removeImage(index)}
                      className={styles.removeImage}
                      type="button"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anonymous (read-only) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                disabled
                style={{ width: 16, height: 16 }}
              />
              Post anonymously
            </label>
          </div>

          {/* Moderation Notice */}
          <div className={styles.moderationNotice}>
            <span className={styles.infoIcon}>ℹ️</span>
            <span>Updated content will be re-reviewed by AI moderation.</span>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={handleCancel} type="button">
              Cancel
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!title.trim() || content.trim().length < 20 || isBusy}
              type="button"
            >
              {isBusy ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Guidelines Sidebar */}
      <aside className={styles.guidelinesSidebar}>
        <div className={styles.guidelinesCard}>
          <div className={styles.guidelinesIcon}>💡</div>
          <h3 className={styles.guidelinesTitle}>Things to consider before posting</h3>
          <ul className={styles.guidelinesList}>
            <li>Body must be between 20-5000 characters.</li>
            <li>Title can be up to 200 characters.</li>
            <li>Maximum 5 images allowed per post.</li>
            <li>Updated content is re-moderated by AI before publishing.</li>
          </ul>
        </div>
      </aside>

      {/* Success Modal */}
      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}
    </div>
  );
};

export default EditPost;
