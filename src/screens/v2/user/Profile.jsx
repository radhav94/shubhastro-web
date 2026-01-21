import { ChevronLeft, LogOut, Edit2, Sun, Moon, Sparkles, Delete } from 'lucide-react'
import { TiUserDelete } from 'react-icons/ti'
import { LuPencilLine } from "react-icons/lu"
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import { useGetTransactionsQuery } from '../../../services/appServices/transactionService'
import { useGetAllKundlisQuery, useDeleteKundliMutation } from '../../../services/appServices/kundliServicesNew'
import { useWalletBalance } from '../../private/wallet/useWalletBalance'
import { getUserFromStorage } from '../../../utils/authStorage'
import styles from './Profile.module.scss'
import profileWallet from '../../../assets/images/profile-wallet.jpg'

const Profile = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Profile')
  const [transactionSubTab, setTransactionSubTab] = useState('Transaction History')
  const transactionListRef = useRef(null)
  const user = getUserFromStorage()
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest User'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [allLoadedTransactions, setAllLoadedTransactions] = useState([])

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [kundliToDelete, setKundliToDelete] = useState(null)

  // Fetch saved kundli profiles
  const { data: kundliData, isLoading: isLoadingKundlis, refetch: refetchKundlis } = useGetAllKundlisQuery()
  const savedKundlis = kundliData?.data || []

  // Delete kundli mutation
  const [deleteKundli, { isLoading: isDeletingKundli }] = useDeleteKundliMutation()

  // Fetch wallet balance
  const { balance, isFetching: isFetchingBalance } = useWalletBalance()

  // Fetch transactions data with pagination - only when on Transactions tab
  const shouldFetch = activeTab === 'Transactions' && transactionSubTab === 'Transaction History'

  const { data: transactionsData, isFetching: isFetchingTransactions } = useGetTransactionsQuery(
    { page: currentPage, limit: 10 },
    { skip: !shouldFetch }
  )

  const pagination = transactionsData?.data?.pagination
  const hasNextPage = pagination?.hasNextPage || false

  // Update loaded transactions when new data arrives
  useEffect(() => {
    if (transactionsData?.data?.transactions && shouldFetch) {
      if (currentPage === 1) {
        setAllLoadedTransactions(transactionsData.data.transactions)
      } else {
        setAllLoadedTransactions(prev => [...prev, ...transactionsData.data.transactions])
      }
    }
  }, [transactionsData, currentPage, shouldFetch])

  // Infinite scroll handler
  const handleScroll = (e) => {
    const element = e.target
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50

    if (isAtBottom && hasNextPage && !isFetchingTransactions) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // Delete kundli handlers
  const handleDeleteClick = (kundliId) => {
    setKundliToDelete(kundliId)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (kundliToDelete) {
      try {
        await deleteKundli(kundliToDelete).unwrap()
        refetchKundlis()
      } catch (error) {
        console.error('Failed to delete profile:', error)
      }
    }
    setShowDeleteConfirm(false)
    setKundliToDelete(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setKundliToDelete(null)
  }

  const handleLogout = () => {
    // Clear all authentication related data from localStorage
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_role");
    localStorage.removeItem("shubhtalk_user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("astro_wallet_balance");
    
    // Navigate to home page
    navigate("/");
  };

  const tabs = ['Profile', 'Order History', 'Transactions', 'Support']

  // Get initials for avatar
  const getInitials = (name) => {
    const names = name.split(' ')
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>

        <div className={styles.headerCenter}>
          <div className={styles.userAvatar}>
            <span>🐏</span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.profileName}>{userName}</h1>
            <p className={styles.profileDetails}>
              {savedKundlis[0] ? `${dayjs(`${savedKundlis[0].year}-${savedKundlis[0].month}-${savedKundlis[0].day}`).format('MMM DD, YYYY')} • ${String(savedKundlis[0].hour).padStart(2, '0')}:${String(savedKundlis[0].min).padStart(2, '0')}` : 'Jan 01, 2002 • 18:00'}
            </p>
          </div>
        </div>

        <button className={styles.logoutButton} onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Zodiac Cards */}
      <div className={styles.zodiacSection}>
        <div className={styles.zodiacCard} style={{ background: '#E9D7F6', color: '#49196D' }}>
          <div className={styles.zodiacIcon}>
            <Sun size={32} fill="#49196D" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Pisces</span>
            <span className={styles.zodiacValue}>Sun Sign</span>
          </div>
        </div>

        <div className={styles.zodiacCard} style={{ background: '#D8E9F4', color: '#1C4863' }}>
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#1C4863" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Gemini</span>
            <span className={styles.zodiacValue}>Moon Sign</span>
          </div>
        </div>

        <div className={styles.zodiacCard} style={{ background: '#D5F5E3', color: '#271C50' }}>
          <div className={styles.zodiacIcon}>
            <Moon size={32} fill="#271C50" />
          </div>
          <div className={styles.zodiacInfo}>
            <span className={styles.zodiacLabel}>Gemini</span>
            <span className={styles.zodiacValue}>Ascendant Sign</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className={styles.balanceCard} style={{ backgroundImage: `url(${profileWallet})` }}>
        <div className={styles.balanceLeft}>
          <div className={styles.balanceHeader}>
            <div className={styles.coinIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" fill="#FFA500"/>
                <text x="12" y="16" textAnchor="middle" fill="#FFF" fontSize="10" fontWeight="bold">₹</text>
              </svg>
            </div>
            <Sparkles size={16} fill="#FFF" color="#FFF" />
            <span className={styles.balanceLabel}>Balance</span>
          </div>
          <div className={styles.balanceAmount}>
            ₹{isFetchingBalance ? '...' : balance || 100}
          </div>
        </div>

        <button className={styles.addMinutesButton} onClick={() => navigate('/recharge')}>
          Add Shubh Minutes
          <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'Profile' && (
          <div className={styles.profileContent}>
            {isLoadingKundlis ? (
              <div className={styles.loadingState}>
                <p>Loading profiles...</p>
              </div>
            ) : savedKundlis.length > 0 ? (
              savedKundlis.map((kundli, index) => (
                <div key={kundli._id} className={styles.profileCard}>
                  <div className={styles.avatarCircle}>
                    <span>{getInitials(kundli.name)}</span>
                  </div>
                  
                  <div className={styles.profileCardContent}>
                    <div className={styles.profileCardHeader}>
                      <div className={styles.badge}>
                        {index === 0 ? 'Self' : kundli.relation || 'Brother'}
                      </div>
                      <div className={styles.profileActions}>
                        <button className={styles.iconButton} onClick={() => navigate(`/edit-profile/${kundli._id}`)}>
                          <LuPencilLine size={18} />
                        </button>
                        <button 
                          className={styles.iconButton} 
                          onClick={() => handleDeleteClick(kundli._id)}
                          disabled={isDeletingKundli}
                        >
                          <TiUserDelete size={18} />
                        </button>
                      </div>
                    </div>

                    <h3 className={styles.profileCardName}>{kundli.name}</h3>
                    <p className={styles.profileCardDate}>
                      {dayjs(`${kundli.year}-${kundli.month}-${kundli.day}`).format('DD MMM YYYY')} • {String(kundli.hour).padStart(2, '0')}:{String(kundli.min).padStart(2, '0')} PM
                    </p>
                    <p className={styles.profileCardLocation}>{kundli.place}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No profiles found</p>
              </div>
            )}
            
            {/* Sticky Add Profile Button */}
            <div className={styles.stickyButtonContainer}>
              <button className={styles.addProfileButtonSticky} onClick={() => navigate('/add-profile')}>
                Add Profile +
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Order History' && (
          <div className={styles.orderContent}>
            <p>Order History content</p>
          </div>
        )}

        {activeTab === 'Transactions' && (
          <div className={styles.transactionsContent}>
            <p>Transactions content</p>
          </div>
        )}

        {activeTab === 'Support' && (
          <div className={styles.supportContent}>
            <p>Support content</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Profile</h3>
            <p className={styles.modalMessage}>Are you sure you want to delete this profile? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={`${styles.modalBtn} ${styles.cancelBtn}`} onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button 
                className={`${styles.modalBtn} ${styles.deleteBtn}`} 
                onClick={handleDeleteConfirm}
                disabled={isDeletingKundli}
              >
                {isDeletingKundli ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
