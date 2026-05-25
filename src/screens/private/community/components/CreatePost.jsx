import { useState, useRef } from "react";
import { FiImage } from "react-icons/fi";
import styles from "../Community.module.scss";
import SuccessModal from "./SuccessModal";

const POSTING_GUIDELINES = [
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum",
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
];

const CreatePost = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    setShowSuccess(true);
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setImage(null);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setTitle("");
    setContent("");
    setImage(null);
    if (onSuccess) onSuccess();
  };

  return (
    <div className={styles.createPostLayout}>
      <div className={styles.createPostMain}>
        <h2 className={styles.sectionHeading}>
          <span className={styles.headingBar} />
          CREATE POST
        </h2>

        <div className={styles.createPostForm}>
          {/* Title */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="Give your post a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.formInput}
            />
          </div>

          {/* Content */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Share your thoughts <span className={styles.required}>*</span>
            </label>
            <textarea
              placeholder="What's on your mind? Share your spiritual journey, insights, questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.formTextarea}
              rows={5}
            />
            <div className={styles.textareaFooter}>
              <button
                className={styles.imageUploadBtn}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <FiImage size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
            </div>
            {image && (
              <div className={styles.imagePreview}>
                <img src={image} alt="Preview" />
                <button onClick={() => setImage(null)} className={styles.removeImage} type="button">×</button>
              </div>
            )}
          </div>

          {/* Moderation Notice */}
          <div className={styles.moderationNotice}>
            <span className={styles.infoIcon}>ℹ️</span>
            <span>Your post will be reviewed by our moderation team lorem ipsum is simply dummy text.</span>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={handleCancel} type="button">
              Cancel
            </button>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim()}
              type="button"
            >
              Post
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
