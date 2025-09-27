import Link from 'next/link'
import React from 'react'
export const metadata = {
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
}
const Breadcrumb6 = ({ pagetitle, currentPage }) => {
  return (
    <>
      <div className="breadcrumb-section six" style={{ backgroundImage: 'linear-gradient(rgba(11, 12, 12, 0.72), rgba(11, 12, 12, 0.72)), url(/assets/img/inner-pages/breadcrumb-bg6.png)' }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="banner-content">
                <h1>{pagetitle}</h1>
                <ul className="breadcrumb-list">
                  <li><Link href="/book-and-comic">Home</Link></li>
                  <li>{currentPage}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default Breadcrumb6
