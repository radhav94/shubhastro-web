import { useState, useRef } from "react";
import { FiImage, FiX } from "react-icons/fi";
import styles from "../Community.module.scss";
import SuccessModal from "./SuccessModal";
import MwebCommunities from "./MwebCommunities";
import {
  useCreateCommunityPostMutation,
  useGetCommunitySpacesQuery,
} from "../../../../redux/api/community/communityApi";
import { useGetS3SignedUrlMutation } from "../../../../redux/api/s3SignedApi";
import Toast from "../../../../component/toast";

const MAX_IMAGES = 5;

const POSTING_GUIDELINES = [
  "Body must be between 20-5000 characters.",
  "Title can be up to 200 characters.",
  "Maximum 5 images allowed per post.",
  "Posts are reviewed by AI moderation before publishing.",
];

const CreatePost = ({ onSuccess, joinedSpaces: mwebJoinedSpaces = [], onCommunityClick }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [images, setImages] = useState([]); // [{ file, preview }]
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [createPost, { isLoading: isSubmitting }] = useCreateCommunityPostMutation();
  const [getS3SignedUrl] = useGetS3SignedUrlMutation();
  const { data: spacesData } = useGetCommunitySpacesQuery({ page: 1, limit: 50 });
  const spaces = spacesData?.spaces || [];
  const joinedSpaces = spaces.filter((s) => s.isJoined);

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
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImagesToS3 = async () => {
    const uploadedUrls = [];

    for (const img of images) {
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
        // S3 CORS may block from localhost — skip failed uploads
        console.warn("Image upload failed (CORS), skipping:", fileUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!selectedSpaceId) {
      Toast.error("Please select a community");
      return;
    }
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

      // Upload images to S3 first
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImagesToS3();
      }

      const postData = {
        title: title.trim(),
        body: content.trim(),
        spaceId: selectedSpaceId,
        images: imageUrls,
        linkedProducts: [],
      };

      await createPost(postData).unwrap();
      setShowSuccess(true);
    } catch (error) {
      const message = error?.data?.message || "Failed to create post";
      Toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setSelectedSpaceId("");
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    handleCancel();
    if (onSuccess) onSuccess();
  };

  const isBusy = isSubmitting || isUploading;

  return (
    <div className={styles.createPostLayout}>
      <div className={styles.createPostMain}>
        {/* Your Community - Mobile Only */}
        <MwebCommunities joinedSpaces={mwebJoinedSpaces} onCommunityClick={onCommunityClick} />

        <h2 className={styles.sectionHeading}>
          <span className={styles.headingBar} />
          CREATE POST
        </h2>

        <div className={styles.createPostForm}>
          {/* Community Selector */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Community <span className={styles.required}>*</span>
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => setSelectedSpaceId(e.target.value)}
              className={styles.formInput}
            >
              <option value="">Select a community</option>
              {joinedSpaces.map((space) => (
                <option key={space._id} value={space._id}>
                  {space.icon} {space.name}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="What's on your mind? Share your spiritual journey, insights, questions... (min 20 chars)"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              className={styles.formTextarea}
              rows={5}
              maxLength={5000}
            />
          </div>

          {/* Upload Images */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Upload Images</label>
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
                    <img src={img.preview} alt={`Preview ${index + 1}`} />
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

          {/* Moderation Notice */}
          <div className={styles.moderationNotice}>
            <span className={styles.infoIcon}>ℹ️</span>
            <span>Your post will be reviewed by AI moderation before publishing.</span>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={handleCancel} type="button">
              Cancel
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!selectedSpaceId || !title.trim() || content.trim().length < 20 || isBusy}
              type="button"
            >
              {isBusy ? "Posting..." : "Post"}
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
            {POSTING_GUIDELINES.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Success Modal */}
      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}
    </div>
  );
};

export default CreatePost;
