import React from 'react';

const BanknoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m-3-3.75l-3 1.5m3-1.5l3 1.5m-3-1.5V15m3 2.25v-1.5m3-6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8.25a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V9Z" />
  </svg>
);

export default BanknoteIcon;
