import { ChevronLeft, LogOut, Sun, Moon, ArrowUp, Wallet, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import { useGetTransactionsQuery } from '../../../services/appServices/transactionService'
import { useGetAllKundlisQuery, useDeleteKundliMutation } from '../../../services/appServices/kundliServicesNew'
import { useWalletBalance } from '../../private/wallet/useWalletBalance'
import { getUserFromStorage } from '../../../utils/authStorage'
import styles from './Profile.module.scss'

const Profile = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Profile')
  const [transactionSubTab, setTransactionSubTab] = useState('Transaction History')
  const [pillStyle, setPillStyle] = useState({})
  const tabRefs = useRef({})
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
  const { balance, isFetching: isFetchingBalance, refreshWallet } = useWalletBalance()

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
    if (transactionsData?.data?.transactions) {
      if (currentPage === 1) {
        setAllLoadedTransactions(transactionsData.data.transactions)
      } else {
        setAllLoadedTransactions(prev => [...prev, ...transactionsData.data.transactions])
      }
    }
  }, [transactionsData, currentPage])
  
  // Reset pagination when switching to Transactions tab
  useEffect(() => {
    if (activeTab === 'Transactions' && transactionSubTab === 'Transaction History') {
      setCurrentPage(1)
      setAllLoadedTransactions([])
    }
  }, [activeTab, transactionSubTab])
  
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

  const tabs = ['Profile', 'Order History', 'Transactions', 'Support']

  useEffect(() => {
    const activeButton = tabRefs.current[activeTab]
    if (activeButton) {
      const container = activeButton.parentElement
      const containerRect = container.getBoundingClientRect()
      const buttonRect = activeButton.getBoundingClientRect()
      
      setPillStyle({
        width: `${buttonRect.width}px`,
        transform: `translateX(${buttonRect.left - containerRect.left - 4}px)`
      })
    }
  }, [activeTab])

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ChevronLeft size={24} />
        </button>
        
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{userName}</h1>
          <p className={styles.profileDetails}>{user?.phoneNumber || 'Phone not available'}</p>
        </div>
        
        <div className={styles.logoutSection}>
          <button className={styles.logoutButton}>
            <div className={styles.logoutIcon}>
              <LogOut size={20} />
            </div>
          </button>
          <span className={styles.logoutText}>Logout</span>
        </div>
      </div>
      
      <div className={styles.profileContainer}>
        <div className={styles.topSection}>
          <div className={styles.zodiacCards}>
            <div className={styles.zodiacCard}>
              <div className={styles.zodiacIcon}>
                <Sun size={28} />
              </div>
              <div className={styles.zodiacInfo}>
                <span className={styles.zodiacLabel}>Sun Sign</span>
                <span className={styles.zodiacValue}>Pisces</span>
              </div>
            </div>
            
            <div className={styles.zodiacCard}>
              <div className={styles.zodiacIcon}>
                <Moon size={28} />
              </div>
              <div className={styles.zodiacInfo}>
                <span className={styles.zodiacLabel}>Moon Sign</span>
                <span className={styles.zodiacValue}>Gemini</span>
              </div>
            </div>
            
            <div className={styles.zodiacCard}>
              <div className={styles.zodiacIcon}>
                <ArrowUp size={28} />
              </div>
              <div className={styles.zodiacInfo}>
                <span className={styles.zodiacLabel}>Moon Sign</span>
                <span className={styles.zodiacValue}>Gemini</span>
              </div>
            </div>
          </div>
          
          <div className={styles.balanceCard}>
            <div className={styles.balanceInfo}>
              <div className={styles.balanceHeader}>
                <Wallet size={20} className={styles.walletIcon} />
                <span className={styles.balanceLabel}>Balance</span>
              </div>
              <div className={styles.balanceAmount}>
                {isFetchingBalance ? '...' : `₹${balance || 0}`}
              </div>
            </div>
            
            <button className={styles.addMinutesButton} onClick={() => navigate('/recharge')}>
              Add Shubh Minutes
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        
        <div className={styles.bottomSection}>
          <div className={styles.tabsSection}>
            <div className={styles.tabsContainer}>
              <div className={styles.tabPill} style={pillStyle}></div>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  ref={(el) => (tabRefs.current[tab] = el)}
                  className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className={styles.tabContent}>
              {activeTab === 'Profile' && (
                <div className={styles.tabPanel}>
                  <div className={styles.profileContentWrapper}>
                    {isLoadingKundlis ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading profiles...</p>
                      </div>
                    ) : savedKundlis.length > 0 ? (
                      <>
                        <div className={styles.profileCards}>
                          {savedKundlis.map((kundli, index) => (
                            <div key={kundli._id} className={styles.profileItemCard}>
                              <div className={styles.profileItemHeader}>
                                <span className={styles.profileBadge}>
                                  {index === 0 ? 'Self' : kundli.relation || 'Family'}
                                </span>
                                <div className={styles.profileActions}>
                                  <button className={styles.actionIconBtn} onClick={() => navigate(`/kundli/${kundli._id}`)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button 
                                    className={styles.actionIconBtn} 
                                    onClick={() => handleDeleteClick(kundli._id)}
                                    disabled={isDeletingKundli}
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <h3 className={styles.profileItemName}>{kundli.name}</h3>
                              <p className={styles.profileItemDatetime}>
                                {dayjs(`${kundli.year}-${kundli.month}-${kundli.day}`).format('MMM DD, YYYY')} • {String(kundli.hour).padStart(2, '0')}:{String(kundli.min).padStart(2, '0')}
                              </p>
                              <p className={styles.profileItemLocation}>{kundli.place}</p>
                            </div>
                          ))}
                        </div>
                        
                        <button className={styles.addProfileButton} onClick={() => navigate('/kundli')}>
                          + Add Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                          <p>No profiles found</p>
                        </div>
                        <button className={styles.addProfileButton} onClick={() => navigate('/kundli')}>
                          + Add Profile
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'Order History' && (
                <div className={styles.tabPanel}>
                  <div className={styles.orderHistoryHeader}>
                    <span className={styles.orderCount}>10 Orders</span>
                    <div className={styles.orderFilters}>
                      <button className={styles.filterButton}>Filter By</button>
                      <button className={styles.filterButton}>Sort By</button>
                    </div>
                  </div>
                  
                  <div className={styles.ordersList}>
                    <h3 className={styles.yearDivider}>2025</h3>
                    <div className={styles.orderCard} onClick={() => navigate('/order-details/1896')} style={{ cursor: 'pointer' }}>
                      <div className={styles.orderMain}>
                        <div className={styles.orderAvatar}></div>
                        <div className={styles.orderInfo}>
                          <h4 className={styles.astrologerName}>Haridas Kumar</h4>
                          <p className={styles.orderDatetime}>Oct 01, 2025 • 04:36 PM</p>
                          <p className={styles.orderDuration}>Duration : 5 Min 30 Secs</p>
                          <p className={styles.orderAmount}>₹200</p>
                        </div>
                        <span className={`${styles.orderBadge} ${styles.chatBadge}`}>Call</span>
                      </div>
                      <div className={styles.orderActions}>
                        <button className={styles.rateConsultationBtn}>★★★★☆</button>
                        <button className={styles.consultAgainBtn}>Consult Again</button>
                      </div>
                    </div>
                    <div className={styles.orderCard} onClick={() => navigate('/order-details/1896')} style={{ cursor: 'pointer' }}>
                      <div className={styles.orderMain}>
                        <div className={styles.orderAvatar}></div>
                        <div className={styles.orderInfo}>
                          <h4 className={styles.astrologerName}>Haridas Kumar</h4>
                          <p className={styles.orderDatetime}>Oct 01, 2025 • 04:36 PM</p>
                          <p className={styles.orderDuration}>Duration : 5 Min 30 Secs</p>
                          <p className={styles.orderAmount}>₹200</p>
                        </div>
                        <span className={`${styles.orderBadge} ${styles.chatBadge}`}>Chat</span>
                      </div>
                      <div className={styles.orderActions}>
                        <button className={styles.rateConsultationBtn}>Rate Consultation</button>
                        <button className={styles.consultAgainBtn}>Consult Again</button>
                      </div>
                    </div>
                    <h3 className={styles.yearDivider}>2024</h3>
                    
                    <div className={styles.orderCard} onClick={() => navigate('/order-details/1896')} style={{ cursor: 'pointer' }}>
                      <div className={styles.orderMain}>
                        <div className={styles.orderAvatar}></div>
                        <div className={styles.orderInfo}>
                          <h4 className={styles.astrologerName}>Haridas Kumar</h4>
                          <p className={styles.orderDatetime}>Oct 01, 2025 • 04:36 PM</p>
                          <p className={styles.orderDuration}>Duration : 5 Min 30 Secs</p>
                          <p className={styles.orderAmount}>₹200</p>
                        </div>
                        <span className={`${styles.orderBadge} ${styles.chatBadge}`}>Chat</span>
                      </div>
                      <div className={styles.orderActions}>
                        <button className={styles.rateConsultationBtn}>Rate Consultation</button>
                        <button className={styles.consultAgainBtn}>Consult Again</button>
                      </div>
                    </div>
                    <div className={styles.orderCard} onClick={() => navigate('/order-details/1896')} style={{ cursor: 'pointer' }}>
                      <div className={styles.orderMain}>
                        <div className={styles.orderAvatar}></div>
                        <div className={styles.orderInfo}>
                          <h4 className={styles.astrologerName}>Haridas Kumar</h4>
                          <p className={styles.orderDatetime}>Oct 01, 2025 • 04:36 PM</p>
                          <p className={styles.orderDuration}>Duration : 5 Min 30 Secs</p>
                          <p className={styles.orderAmount}>₹200</p>
                        </div>
                        <span className={`${styles.orderBadge} ${styles.chatBadge}`}>Call</span>
                      </div>
                      <div className={styles.orderActions}>
                        <button className={styles.rateConsultationBtn}>Rate Consultation</button>
                        <button className={styles.consultAgainBtn}>Consult Again</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'Transactions' && (
                <div className={styles.tabPanel}>
                  <div className={styles.transactionsContentWrapper}>
                    <div className={styles.transactionSubtabs}>
                      <button
                        className={`${styles.transactionSubtab} ${transactionSubTab === 'Transaction History' ? styles.active : ''}`}
                        onClick={() => setTransactionSubTab('Transaction History')}
                      >
                        Transaction History
                      </button>
                      <button
                        className={`${styles.transactionSubtab} ${transactionSubTab === 'Payment Logs' ? styles.active : ''}`}
                        onClick={() => setTransactionSubTab('Payment Logs')}
                      >
                        Payment Logs
                      </button>
                    </div>
                    
                    <div 
                      className={styles.transactionsListContainer}
                      ref={transactionListRef}
                      onScroll={handleScroll}
                      style={{ maxHeight: '500px', overflowY: 'auto' }}
                    >
                      {transactionSubTab === 'Transaction History' && (
                        <>
                          <div className={styles.transactionsList}>
                            {allLoadedTransactions.length > 0 ? (
                              allLoadedTransactions.map((transaction) => (
                                <div key={transaction._id} className={styles.transactionItem}>
                                  <div className={styles.transactionDetails}>
                                    <p className={styles.transactionId}>
                                      #{transaction.transactionId || transaction._id} • {dayjs(transaction.createdAt).format('MMM DD, YYYY')} • {dayjs(transaction.createdAt).format('hh:mm A')}
                                    </p>
                                    <p className={styles.transactionDescription}>
                                      {transaction.description} {transaction?.displayProfile?.name}
                                    </p>
                                  </div>
                                  <span className={`${styles.transactionAmount} ${transaction?.billing?.user?.action === 'credit' ? styles.positive : styles.negative}`}>
                                    {transaction?.billing?.user?.action === 'credit' ? '+' : '-'} ₹{transaction?.billing?.user?.debitAmount}
                                  </span>
                                </div>
                              ))
                            ) : !isFetchingTransactions ? (
                              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                <p>No transactions found</p>
                              </div>
                            ) : null}
                          </div>
                          
                          {isFetchingTransactions && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                              <p>Loading...</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {transactionSubTab === 'Payment Logs' && (
                        <div className={styles.transactionsList}>
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Call with Hari Prasad</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.negative}`}>- ₹50</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                          
                          <div className={styles.transactionItem}>
                            <div className={styles.transactionDetails}>
                              <p className={styles.transactionId}>#1896 • Oct 01, 2025 • 04:36 PM</p>
                              <p className={styles.transactionDescription}>Added Balance</p>
                            </div>
                            <span className={`${styles.transactionAmount} ${styles.positive}`}>+ ₹200</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button className={styles.contactSupportButton}>
                      Contact Support
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'Support' && (
                <div className={styles.tabPanel}>
                  <div className={styles.supportGrid}>
                    <div className={styles.supportCard} onClick={() => navigate('/customer-support')} style={{ cursor: 'pointer' }}>
                      <div className={styles.supportIcon}></div>
                      <h3 className={styles.supportTitle}>Customer Support</h3>
                      <p className={styles.supportDescription}>Chat with our team for quick help on app or consultation queries.</p>
                    </div>
                    
                    <div className={styles.supportCard} onClick={() => navigate('/faqs')} style={{ cursor: 'pointer' }}>
                      <div className={styles.supportIcon}></div>
                      <h3 className={styles.supportTitle}>FAQs</h3>
                      <p className={styles.supportDescription}>Find quick answers to common astrology and app questions.</p>
                    </div>
                    
                    <div className={styles.supportCard} onClick={() => navigate('/recent-tickets')} style={{ cursor: 'pointer' }}>
                      <div className={styles.supportIcon}></div>
                      <h3 className={styles.supportTitle}>Recent Tickets</h3>
                      <p className={styles.supportDescription}>Track updates on your latest support requests.</p>
                    </div>
                    
                    <div className={styles.supportCard} onClick={() => navigate('/privacy-security')} style={{ cursor: 'pointer' }}>
                      <div className={styles.supportIcon}></div>
                      <h3 className={styles.supportTitle}>Privacy & Security</h3>
                      <p className={styles.supportDescription}>Manage your data and privacy preferences.</p>
                    </div>
                  </div>
                  
                  <div className={styles.supportOthers}>
                    <h3 className={styles.othersHeading}>Others</h3>
                    
                    <div className={styles.supportListItem}>
                      <div className={styles.supportListContent}>
                        <h4 className={styles.supportListTitle}>App Feedback</h4>
                        <p className={styles.supportListDescription}>Share suggestions to improve your astro experience.</p>
                      </div>
                      <button className={styles.supportArrowBtn}>
                        <ArrowRight size={24} />
                      </button>
                    </div>
                    
                    <div className={styles.supportListItem}>
                      <div className={styles.supportListContent}>
                        <h4 className={styles.supportListTitle}>Community Guidelines</h4>
                        <p className={styles.supportListDescription}>Learn how to use the platform safely and respectfully.</p>
                      </div>
                      <button className={styles.supportArrowBtn}>
                        <ArrowRight size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
