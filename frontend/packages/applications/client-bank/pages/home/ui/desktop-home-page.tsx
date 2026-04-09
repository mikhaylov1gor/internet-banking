import { HomeDashboard } from './home-dashboard'
import './style.css'

export const DesktopHomePage = () => {
  return (
    <div className="home-page-container desktop-home-page">
      <HomeDashboard buttonsRowClassName="desktop-home-buttons" />
    </div>
  )
}

