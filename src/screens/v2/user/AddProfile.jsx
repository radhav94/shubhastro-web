import { ChevronLeft, Camera, Calendar, Clock, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCreateKundliMutation } from '../../../services/appServices/kundliServicesNew'
import { Toast } from '../../../component'
import LocationSearch from '../../../utils/location/locationSearchVedic'
import styles from './AddProfile.module.scss'

const AddProfile = () => {
  const navigate = useNavigate()
  const [createKundli, { isLoading }] = useCreateKundliMutation()
  
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    relation: '',
    birthDate: '',
    birthTime: '',
    placeOfBirth: '',
    unknownTime: false,
    latitude: null,
    longitude: null,
  })

  /*
   * Bumped when submission is blocked on a place with no coordinates, to bring
   * the suggestion list back up.
   *
   * `reopenSignal` has existed in locationSearchVedic.jsx for a while and is
   * wired into AddProfileModal and EditProfileModal, but this screen and
   * kundli/hooks/useProfileManager.js were left answering a blocked submit with
   * a bare `Toast.error('Please select a valid location from the dropdown')`.
   * Coordinates are only ever set by picking a suggestion, so that message names
   * a control that is not on screen — and focusing the input cannot bring it
   * back, because `focus()` fires no event on an already-focused field, which is
   * exactly the state someone is in when they tap submit straight after typing.
   *
   * Clarity dead clicks (session 1lkvwpx, Sep 4, Facebook in-app browser): five
   * minutes on this form, 39 clicks, "Please select a valid loc" at 02:34 and
   * again at 03:56, page refreshes at 03:14 and 04:28, then back to the homepage
   * without ever completing. Clarity truncated the text, but "select a valid"
   * matches this string and not GuestDetailsForm's "Please pick a location from
   * the dropdown", which already scrolls its inline error into view.
   */
  const [placeReopenSignal, setPlaceReopenSignal] = useState(0)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePlaceSelect = (place) => {
    setFormData(prev => ({
      ...prev,
      placeOfBirth: place.address,
      latitude: place.lat,
      longitude: place.lng,
    }))
  }

  const buildKundliPayload = () => {
    // Parse date from DD/MM/YYYY format
    const dateParts = formData.birthDate.split('/')
    const day = parseInt(dateParts[0])
    const month = parseInt(dateParts[1])
    const year = parseInt(dateParts[2])

    // Parse time from HH:MM format
    const timeParts = formData.birthTime ? formData.birthTime.split(':') : ['0', '0']
    const hour = formData.unknownTime ? "00" : String(parseInt(timeParts[0])).padStart(2, "0")
    const min = formData.unknownTime ? "00" : String(parseInt(timeParts[1])).padStart(2, "0")

    return {
      name: formData.name,
      gender: formData.gender.toLowerCase(),
      relation: formData.relation || 'self',
      day,
      month,
      year,
      hour,
      min,
      second: "00",
      place: formData.placeOfBirth,
      lat: formData.latitude || 0,
      lon: formData.longitude || 0,
      tzone: formData.timezone ?? 5.5,
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Toast.error('Please enter name')
      return
    }
    if (!formData.birthDate) {
      Toast.error('Please enter birth date')
      return
    }
    if (!formData.unknownTime && !formData.birthTime) {
      Toast.error('Please enter birth time or check unknown time')
      return
    }
    if (!formData.placeOfBirth) {
      Toast.error('Please select birth place')
      return
    }
    if (!formData.latitude || !formData.longitude) {
      Toast.error('Please select a valid location from the dropdown')
      // Put the dropdown the message refers to back on screen. See the note on
      // placeReopenSignal above.
      if (formData.placeOfBirth?.trim()) {
        setPlaceReopenSignal(n => n + 1)
      }
      return
    }

    try {
      const payload = buildKundliPayload()
      await createKundli(payload).unwrap()
      Toast.success('Profile added successfully')
      navigate('/profile')
    } catch (err) {
      console.error(err)
      Toast.error(err?.data?.message || 'Failed to add profile')
    }
  }

  return (
    <div className={styles.addProfilePage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>Add Profile</h1>
      </div>

      <div className={styles.content}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            <div className={styles.avatarIcon}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="20" r="12" fill="#F3AD3D" />
                <path d="M10 50C10 38 18 32 30 32C42 32 50 38 50 50" fill="#F3AD3D" />
              </svg>
            </div>
          </div>
          <button className={styles.cameraButton}>
            <Camera size={20} />
          </button>
        </div>

        {/* Name Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter here"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        {/* Gender Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Your Identity</label>
          <div className={styles.genderButtons}>
            <button
              className={`${styles.genderButton} ${formData.gender === 'male' ? styles.active : ''}`}
              onClick={() => handleInputChange('gender', 'male')}
            >
              <span className={styles.genderIcon}>♂</span>
              <span>Male</span>
            </button>
            <button
              className={`${styles.genderButton} ${formData.gender === 'female' ? styles.active : ''}`}
              onClick={() => handleInputChange('gender', 'female')}
            >
              <span className={styles.genderIcon}>♀</span>
              <span>Female</span>
            </button>
            <button
              className={`${styles.genderButton} ${formData.gender === 'others' ? styles.active : ''}`}
              onClick={() => handleInputChange('gender', 'others')}
            >
              <span className={styles.genderIcon}>⚥</span>
              <span>Others</span>
            </button>
          </div>
        </div>

        {/* Relation Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Relation</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={formData.relation}
              onChange={(e) => handleInputChange('relation', e.target.value)}
            >
              <option value="">Select here</option>
              <option value="self">Self</option>
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            <ChevronLeft size={20} className={styles.selectIcon} />
          </div>
        </div>

        {/* Birth Date Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Birth Date</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="01/01/2002"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
            />
            <Calendar size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Birth Time Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Birth Time</label>
          <div className={styles.inputWrapper}>
            <input
              type="time"
              className={styles.input}
              value={formData.birthTime}
              onChange={(e) => {
                if (formData.unknownTime) return;
                handleInputChange('birthTime', e.target.value);
              }}
              // A natively disabled input fires no events, so tapping it did
              // nothing at all. Keep it tappable and say why it's locked.
              readOnly={formData.unknownTime}
              aria-disabled={formData.unknownTime || undefined}
              onClick={() => {
                if (formData.unknownTime) {
                  Toast.info('Uncheck “Don’t know the exact time of birth” to pick a time');
                }
              }}
            />
            <Clock size={20} className={styles.inputIcon} />
          </div>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={formData.unknownTime}
              onChange={(e) => handleInputChange('unknownTime', e.target.checked)}
            />
            <span>Don't know the exact time of birth</span>
          </label>
        </div>

        {/* Place of Birth Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Place of Birth</label>
          <div className={styles.inputWrapper}>
            <LocationSearch
              reopenSignal={placeReopenSignal}
              value={formData.placeOfBirth}
              /*
                Typing clears the coordinates, matching the add form in
                ProfileModals.jsx and the note in birthPlaceCoords.js. Without
                this, picking "Delhi" and then editing the text to "Mumbai" kept
                Delhi's lat/lng: the guard above passed and the kundli was built
                from the wrong place. Clearing them turns a silently wrong chart
                into a visible "select a valid location". `LocationSearch` sets
                the value through `onPlaceSelect`, not `onChange`, so this only
                fires on real typing.
              */
              onChange={(e) => setFormData(prev => ({
                ...prev,
                placeOfBirth: e.target.value,
                latitude: null,
                longitude: null,
              }))}
              onPlaceSelect={handlePlaceSelect}
            />
            <MapPin size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Save Button */}
        <button 
          className={styles.saveButton} 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Profile'}
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  )
}

export default AddProfile
