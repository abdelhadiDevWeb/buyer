import Link from 'next/link'
import React from 'react'
export const metadata = {
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
}
const Breadcrumb5 = ({ pagetitle, currentPage }) => {
  return (
    <>
      <div className="breadcrumb-section five" style={{ backgroundImage: 'url(/assets/img/inner-pages/breadcrumb-bg5.png), linear-gradient(rgba(215, 201, 254, 1), rgba(215, 201, 254, 1))' }}>
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

    </>
  )
}

export default Breadcrumb5
