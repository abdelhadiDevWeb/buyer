import Link from "next/link";
import React from "react";
export const metadata = {
  icons: {
    icon: "/assets/img/fav-icon.svg",
  },
}
const Breadcrumb7 = ({ currentPage, pagetitle }) => {
  return (
    <>
      <div
        className="breadcrumb-section seven"
        style={{
          backgroundImage: "url(/assets/img/inner-pages/breadcrumb-bg7.png)",
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="banner-content">
                <h1>{currentPage}</h1>
                <ul className="breadcrumb-list">
                  <li>
                    <Link href="/multipurpose2">Home</Link>
                  </li>
                  <li>{pagetitle}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Breadcrumb7;
