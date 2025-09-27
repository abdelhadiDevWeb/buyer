import Link from 'next/link'
import React from 'react'

const Breadcrumb1 = ({ currentPage, pagetitle }) => {
  return (
    <div className="breadcrumb-section" style={{ backgroundImage: 'url(/assets/img/inner-pages/breadcrumb-bg1.png), linear-gradient(87.29deg, #FDF8E7 0%, #E4FFF0 99.71%)' }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12 d-flex justify-content-center">
            <div className="banner-content">
              <h1>{pagetitle}</h1>
              <ul className="breadcrumb-list">
                <li><Link href="/">Home</Link></li>
                <li>{currentPage}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Breadcrumb1
