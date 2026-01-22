import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./ProfileModals.module.scss";

const ProfileModals = ({
    showSelectProfile,
    showAddProfile,
    showEditProfile,
    profiles,
    selectedProfile,
    formData,
    editFormData,
    isCreating,
    onCloseSelect,
    onCloseAdd,
    onCloseEdit,
    onSelectProfile,
    onAddProfile,
    onSubmitProfile,
    onSubmitEditProfile,
    setFormData,
    setEditFormData,
    formatProfileDisplay,
    showContinueButton = false,
    onContinue,
}) => {
    return (
        <>
            {/* Select Profile Modal */}
            {showSelectProfile && (
                <div className={styles.modalOverlay} onClick={onCloseSelect}>
                    <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sheetHandle}></div>

                        <div className={styles.sheetContent}>
                            <button className={styles.closeBtn} onClick={onCloseSelect}>×</button>
                            <h2 className={styles.sheetTitle}>Select Profile</h2>

                            <div className={styles.profileList}>
                                {profiles.map((profile) => {
                                    const formatted = formatProfileDisplay(profile);
                                    return (
                                        <div
                                            key={profile._id}
                                            className={styles.profileItem}
                                            onClick={() => onSelectProfile(profile)}
                                        >
                                            <div className={styles.profileAvatar}>{formatted.initials}</div>
                                            <div className={styles.profileInfo}>
                                                <span className={styles.relationBadge}>{formatted.relation}</span>
                                                <h3 className={styles.profileName}>{profile.name}</h3>
                                                <p className={styles.profileDetails}>
                                                    {formatted.birthDate} • {formatted.birthTime}
                                                </p>
                                                <p className={styles.profileLocation}>{profile.place}</p>
                                            </div>
                                            <div className={styles.radioBtn}>
                                                {selectedProfile?._id === profile._id ? "●" : "○"}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button className={styles.addProfileBtn} onClick={onAddProfile}>
                                + Add Profile
                            </button>

                            {showContinueButton && (
                                <button 
                                    className={styles.continueBtn} 
                                    onClick={onContinue}
                                    disabled={!selectedProfile}
                                >
                                    Continue
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Profile Modal */}
            {showAddProfile && (
                <div className={styles.modalOverlay} onClick={onCloseAdd}>
                    <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sheetHandle}></div>

                        <div className={styles.sheetContent}>
                            <button className={styles.closeBtn} onClick={onCloseAdd}>×</button>
                            <h2 className={styles.sheetTitle}>Add Profile</h2>

                            <form onSubmit={onSubmitProfile} className={styles.profileForm}>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter here"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Identity</label>
                                    <div className={styles.identityButtons}>
                                        <button
                                            type="button"
                                            className={formData.identity === "Male" ? styles.active : ""}
                                            onClick={() => setFormData({ ...formData, identity: "Male" })}
                                        >
                                            Male
                                        </button>
                                        <button
                                            type="button"
                                            className={formData.identity === "Female" ? styles.active : ""}
                                            onClick={() => setFormData({ ...formData, identity: "Female" })}
                                        >
                                            Female
                                        </button>
                                        <button
                                            type="button"
                                            className={formData.identity === "Others" ? styles.active : ""}
                                            onClick={() => setFormData({ ...formData, identity: "Others" })}
                                        >
                                            Others
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Relation</label>
                                    <select
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                        required
                                    >
                                        <option value="">Select relation</option>
                                        <option value="Self">Self</option>
                                        <option value="Brother">Brother</option>
                                        <option value="Sister">Sister</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Father">Father</option>
                                        <option value="Friend">Friend</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Date</label>
                                    <input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Time</label>
                                    <input
                                        type="time"
                                        value={formData.birthTime}
                                        onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                                        disabled={formData.unknownBirthTime}
                                    />
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={formData.unknownBirthTime}
                                            onChange={(e) => setFormData({ ...formData, unknownBirthTime: e.target.checked })}
                                        />
                                        Don't know the exact time of birth
                                    </label>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Place of Birth</label>
                                    <LocationSearch
                                        value={formData.birthPlace}
                                        onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                                        onPlaceSelect={(place) => setFormData({
                                            ...formData,
                                            birthPlace: place.address,
                                            latitude: place.lat,
                                            longitude: place.lng
                                        })}
                                    />
                                </div>

                                <button type="submit" className={styles.submitBtn} disabled={isCreating}>
                                    {isCreating ? "Adding..." : "Add Profile"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditProfile && (
                <div className={styles.modalOverlay} onClick={onCloseEdit}>
                    <div className={styles.sideSheet} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.sheetHandle}></div>

                        <div className={styles.sheetContent}>
                            <button className={styles.closeBtn} onClick={onCloseEdit}>×</button>
                            <h2 className={styles.sheetTitle}>Edit Profile</h2>

                            <form onSubmit={onSubmitEditProfile} className={styles.profileForm}>
                                <div className={styles.formGroup}>
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter here"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Identity</label>
                                    <div className={styles.identityButtons}>
                                        <button
                                            type="button"
                                            className={editFormData.identity === "Male" ? styles.active : ""}
                                            onClick={() => setEditFormData({ ...editFormData, identity: "Male" })}
                                        >
                                            Male
                                        </button>
                                        <button
                                            type="button"
                                            className={editFormData.identity === "Female" ? styles.active : ""}
                                            onClick={() => setEditFormData({ ...editFormData, identity: "Female" })}
                                        >
                                            Female
                                        </button>
                                        <button
                                            type="button"
                                            className={editFormData.identity === "Others" ? styles.active : ""}
                                            onClick={() => setEditFormData({ ...editFormData, identity: "Others" })}
                                        >
                                            Others
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Relation</label>
                                    <select
                                        value={editFormData.relation}
                                        onChange={(e) => setEditFormData({ ...editFormData, relation: e.target.value })}
                                        required
                                    >
                                        <option value="">Select relation</option>
                                        <option value="Self">Self</option>
                                        <option value="Brother">Brother</option>
                                        <option value="Sister">Sister</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Father">Father</option>
                                        <option value="Friend">Friend</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.birthDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Time</label>
                                    <input
                                        type="time"
                                        value={editFormData.birthTime}
                                        onChange={(e) => setEditFormData({ ...editFormData, birthTime: e.target.value })}
                                        disabled={editFormData.unknownBirthTime}
                                    />
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={editFormData.unknownBirthTime}
                                            onChange={(e) => setEditFormData({ ...editFormData, unknownBirthTime: e.target.checked })}
                                        />
                                        Don't know the exact time of birth
                                    </label>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Place of Birth</label>
                                    <LocationSearch
                                        value={editFormData.birthPlace}
                                        onChange={(e) => setEditFormData({ ...editFormData, birthPlace: e.target.value })}
                                        onPlaceSelect={(place) => setEditFormData({
                                            ...editFormData,
                                            birthPlace: place.address,
                                            latitude: place.lat,
                                            longitude: place.lng
                                        })}
                                    />
                                </div>

                                <button type="submit" className={styles.submitBtn} disabled={isCreating}>
                                    {isCreating ? "Updating..." : "Edit Profile"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfileModals;
