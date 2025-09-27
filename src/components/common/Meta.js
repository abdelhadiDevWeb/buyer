// components/Meta.js

"use client";

import Head from 'next/head';

const Meta = ({ title, description, keywords }) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {/* Add more meta tags as needed */}
    </Head>
  );
};

export default Meta;
