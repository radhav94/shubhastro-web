import { ChevronLeft, Camera, Calendar, Clock, MapPin } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useGetAllKundlisQuery } from '../../../services/appServices/kundliServicesNew'
import toast from 'react-hot-toast'
import styles from './AddProfile.module.scss'

const EditProfile = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    relation: '',
    birthDate: '',
    birthTime: '',
    placeOfBirth: '',
  })

  // Fetch kundli data
  const { data: kundliData, isLoading } = useGetAllKundlisQuery(id, {
    skip: !id,
  })

  // // Update mutation
  // const [updateKundli, { isLoading: isUpdating }] = useUpdateKundliMutation()
  const isUpdating = false;
  // Populate form when data is loaded
  useEffect(() => {
    if (kundliData?.data) {
      const kundli = kundliData.data
      setFormData({
        name: kundli.name || '',
        gender: kundli.gender || 'female',
        relation: kundli.relation || '',
        birthDate: kundli.day && kundli.month && kundli.year 
          ? `${String(kundli.day).padStart(2, '0')}/${String(kundli.month).padStart(2, '0')}/${kundli.year}`
          : '',
        birthTime: kundli.hour !== undefined && kundli.min !== undefined
          ? `${String(kundli.hour).padStart(2, '0')}:${String(kundli.min).padStart(2, '0')}`
          : '',
        placeOfBirth: kundli.place || '',
      })
    }
  }, [kundliData])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      // Parse date and time
      const [day, month, year] = formData.birthDate.split('/')
      const [hour, min] = formData.birthTime.split(':')

      const payload = {
        name: formData.name,
        gender: formData.gender,
        relation: formData.relation,
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        hour: parseInt(hour),
        min: parseInt(min),
        place: formData.placeOfBirth,
      }

      // await updateKundli({ id, data: payload }).unwrap()
      toast.success('Profile updated successfully')
      navigate('/profile')
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.addProfilePage}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Edit Profile</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.loadingState}>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.addProfilePage}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        <h1 className={styles.title}>Edit Profile</h1>
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
              placeholder="12:01 PM"
              value={formData.birthTime}
              onChange={(e) => handleInputChange('birthTime', e.target.value)}
            />
            <Clock size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Place of Birth Field */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Place of Birth</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="New Delhi, India"
              value={formData.placeOfBirth}
              onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
            />
            <MapPin size={20} className={styles.inputIcon} />
          </div>
        </div>

        {/* Save Button */}
        <button 
          className={styles.saveButton} 
          onClick={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Profile'}
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  )
}

export default EditProfile
