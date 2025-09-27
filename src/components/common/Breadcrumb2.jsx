import Link from "next/link";
import React from "react";

const Breadcrumb2 = ({ pagetitle, currentPage }) => {
  return (
    <div
      className="breadcrumb-section two"
      style={{
        backgroundImage:
          "linear-gradient(rgba(11, 12, 12, 0.6), rgba(11, 12, 12, 0.6)), url(/assets/img/inner-pages/breadcrumb-bg2.jpg)",
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="banner-content">
              <h1>{pagetitle}</h1>
              <ul className="breadcrumb-list">
                <li>
                  <Link href="/car-auction">Home</Link>
                </li>
                <li>{currentPage}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb2;
