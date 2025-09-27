import Link from 'next/link'
import React from 'react'
export const metadata = {
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
}
const Breadcrumb3 = ({ currentPage, pagetitle }) => {
  return (
    <div className="breadcrumb-section three" style={{ backgroundImage: 'url(/assets/img/inner-pages/breadcrumb-bg3.jpg)' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="banner-content">
              <h1>{pagetitle}</h1>
              <ul className="breadcrumb-list">
                <li><Link href="/antiques-auction">Home</Link></li>
                <li>{currentPage}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Breadcrumb3
