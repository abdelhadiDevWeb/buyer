import Link from 'next/link'
import React from 'react'
export const metadata = {
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
}
const Breadcrumb4 = ({ pagetitle, currentPage }) => {
  return (
    <div className="breadcrumb-section four" style={{ backgroundImage: 'url(/assets/img/inner-pages/breadcrumb-bg4.png), linear-gradient(rgba(10, 10, 10, 1), rgba(10, 10, 10, 1))' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="banner-content">
              <ul className="breadcrumb-list">
                <li><Link href="/art-auction">Home</Link></li>
                <li>{pagetitle}</li>
              </ul>
              <h1>{currentPage}</h1>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}

export default Breadcrumb4
