import { HomeDashboard } from './home-dashboard'
import './style.css'

export const MobileHomePage = () => {
  return (
    <div className="home-page-container mobile-home-page">
      <HomeDashboard
        titleClassName="mobile-home-title"
        buttonsRowClassName="mobile-home-buttons"
        buttonClassName="mobile-home-button"
      />
    </div>
  )
}

