import LocationSearch from "../../../../utils/location/locationSearchVedic";
import styles from "./ProfileModals.module.scss";
import DateTimePicker from "../../../../component/UI/dateTimePicker/DateTimePicker";

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
    onEditProfile,
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
                            <button className={`${styles.closeBtn} notranslate`} onClick={onCloseSelect} translate="no">×</button>
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
                                            <div className={styles.profileActions}>
                                                <div className={styles.radioBtn}>
                                                    {selectedProfile?._id === profile._id ? "●" : "○"}
                                                </div>
                                                <button
                                                    className={styles.editBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditProfile(profile);
                                                    }}
                                                    title="Edit profile"
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
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
                            <button className={`${styles.closeBtn} notranslate`} onClick={onCloseAdd} translate="no">×</button>
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
                                    {/* <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} required /> */}
                                    <DateTimePicker
                                        mode="date"
                                        selected={formData.birthDate ? new Date(formData.birthDate) : null}
                                        onChange={(date) => {
                                            if (date) {
                                                const yyyy = date.getFullYear();
                                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                                const dd = String(date.getDate()).padStart(2, "0");
                                                setFormData({ ...formData, birthDate: `${yyyy}-${mm}-${dd}` });
                                            } else {
                                                setFormData({ ...formData, birthDate: "" });
                                            }
                                        }}
                                        placeholder="DD/MM/YYYY"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Time</label>
                                    {/* <input type="time" value={formData.birthTime} onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })} disabled={formData.unknownBirthTime} /> */}
                                    <DateTimePicker
                                        mode="time"
                                        selected={formData.birthTime ? (() => { const [h, m] = formData.birthTime.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                                        onChange={(date) => {
                                            if (date) {
                                                const hh = String(date.getHours()).padStart(2, "0");
                                                const mm = String(date.getMinutes()).padStart(2, "0");
                                                setFormData({ ...formData, birthTime: `${hh}:${mm}` });
                                            } else {
                                                setFormData({ ...formData, birthTime: "" });
                                            }
                                        }}
                                        placeholder="Select time"
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
                            <button className={`${styles.closeBtn} notranslate`} onClick={onCloseEdit} translate="no">×</button>
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
                                    {/* <input type="date" value={editFormData.birthDate} onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })} required /> */}
                                    <DateTimePicker
                                        mode="date"
                                        selected={editFormData.birthDate ? new Date(editFormData.birthDate) : null}
                                        onChange={(date) => {
                                            if (date) {
                                                const yyyy = date.getFullYear();
                                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                                const dd = String(date.getDate()).padStart(2, "0");
                                                setEditFormData({ ...editFormData, birthDate: `${yyyy}-${mm}-${dd}` });
                                            } else {
                                                setEditFormData({ ...editFormData, birthDate: "" });
                                            }
                                        }}
                                        placeholder="DD/MM/YYYY"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Birth Time</label>
                                    {/* <input type="time" value={editFormData.birthTime} onChange={(e) => setEditFormData({ ...editFormData, birthTime: e.target.value })} disabled={editFormData.unknownBirthTime} /> */}
                                    <DateTimePicker
                                        mode="time"
                                        selected={editFormData.birthTime ? (() => { const [h, m] = editFormData.birthTime.split(":"); const d = new Date(); d.setHours(h, m, 0, 0); return d; })() : null}
                                        onChange={(date) => {
                                            if (date) {
                                                const hh = String(date.getHours()).padStart(2, "0");
                                                const mm = String(date.getMinutes()).padStart(2, "0");
                                                setEditFormData({ ...editFormData, birthTime: `${hh}:${mm}` });
                                            } else {
                                                setEditFormData({ ...editFormData, birthTime: "" });
                                            }
                                        }}
                                        placeholder="Select time"
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
