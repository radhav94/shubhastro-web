import { useNavigate } from "react-router-dom";
import styles from "./ProfileSelector.module.scss";

const ProfileSelector = ({ selectedProfile, onSelectClick, onEditClick, isGuest, onAddClick }) => {
    const navigate = useNavigate();

    const showAddNew = isGuest && !selectedProfile;
    const label = "Select Profile";
    const displayName = selectedProfile ? selectedProfile.name : (showAddNew ? "Add New Profile" : "Select Profile");

    const handleClick = () => {
        if (showAddNew && onAddClick) {
            onAddClick();
        } else {
            onSelectClick();
        }
    };

    return (
        <>
            {/* Desktop Profile Header */}
            <div className={styles.profileHeader}>
                <div className={styles.profileInnerWrap}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className={styles.profileSelector}>
                        <span className={styles.selectLabel}>{label}</span>
                        <span className={styles.profileName} onClick={handleClick}>
                            {displayName}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', marginLeft: '4px', verticalAlign: 'middle' }}>
                                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                    {/* <button className={styles.editBtn} onClick={onEditClick} disabled={!selectedProfile}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button> */}
                </div>
            </div>
        </>
    );
};

export default ProfileSelector;
