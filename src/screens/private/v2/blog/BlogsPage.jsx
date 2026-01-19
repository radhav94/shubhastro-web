import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useBlogsData } from '../hooks/useBlogsData'
import TrendingSection from '../components/sections/TrendingSection'
import ContinueReadingSection from '../components/sections/ContinueReadingSection'
import CategorySection from '../components/sections/CategorySection'
import NewsSection from '../components/sections/NewsSection'
import PopularBlogsSection from '../components/sections/PopularBlogsSection'
import AllBlogsSection from '../components/sections/AllBlogsSection'
import './BlogsPage.css'

const BlogsPage = () => {
  const navigate = useNavigate()
  const { blogsData, loading, error, refetch } = useBlogsData()
  const scrollPositionRef = useRef(0)

  // Save scroll position before unmounting
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY
    }

    window.addEventListener('scroll', handleScroll)
    
    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem('blogsPageScrollPosition')
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10))
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      sessionStorage.setItem('blogsPageScrollPosition', scrollPositionRef.current.toString())
    }
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="blogs-page">
        <header className="blogs-header">
          <button className="back-button" onClick={handleBack} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title">Blogs and News</h1>
        </header>
        <div className="blogs-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading blogs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="blogs-page">
        <header className="blogs-header">
          <button className="back-button" onClick={handleBack} aria-label="Go back">
            <ChevronLeft size={24} />
          </button>
          <h1 className="page-title">Blogs and News</h1>
        </header>
        <div className="blogs-content">
          <div className="error-state">
            <p className="error-message">Unable to load blogs. Please check your connection.</p>
            <button className="retry-button" onClick={refetch}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!blogsData) return null

  // Sort categories by order
  const sortedCategories = [...(blogsData.categories || [])].sort((a, b) => a.order - b.order)

  return (
    <div className="blogs-page">
      <header className="blogs-header">
        <button className="back-button" onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">Blogs and News</h1>
      </header>

      <div className="blogs-content">
        <TrendingSection blogs={blogsData.trending} />
        <ContinueReadingSection blogs={blogsData.continueReading} />
        
        {sortedCategories.map((category) => (
          <CategorySection
            key={category.id}
            title={category.title}
            blogs={category.blogs}
          />
        ))}
        
        <NewsSection news={blogsData.news} />
        <PopularBlogsSection blogs={blogsData.popular} />
        <AllBlogsSection blogs={blogsData.allBlogs} />
      </div>
    </div>
  )
}

export default BlogsPage
