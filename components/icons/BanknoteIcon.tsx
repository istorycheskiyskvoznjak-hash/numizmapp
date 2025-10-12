import React from 'react';

const BanknoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.75" y="6.75" width="16.5" height="10.5" rx="2.25" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"></rect>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75"></circle>
    <path d="M5.5 9.25c1.1 0 1.75-.65 1.75-1.75M18.5 14.75c-1.1 0-1.75.65-1.75 1.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.6"></path>
    <path d="M6.25 14.5h2.0M15.75 9.5h2.0" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.7"></path>
  </svg>
);

export default BanknoteIcon;