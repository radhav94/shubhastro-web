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
    const hour = formData.unknownTime ? 0 : parseInt(timeParts[0])
    const min = formData.unknownTime ? 0 : parseInt(timeParts[1])

    return {
      name: formData.name,
      gender: formData.gender.toLowerCase(),
      relation: formData.relation || 'self',
      day,
      month,
      year,
      hour,
      min,
      second: 0,
      place: formData.placeOfBirth,
      lat: formData.latitude || 0,
      lon: formData.longitude || 0,
      tzone: 5.5,
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
              type="text"
              className={styles.input}
              placeholder="Select here"
              value={formData.birthTime}
              onChange={(e) => handleInputChange('birthTime', e.target.value)}
              disabled={formData.unknownTime}
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
              value={formData.placeOfBirth}
              onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
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
