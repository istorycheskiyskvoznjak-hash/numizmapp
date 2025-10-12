import React from 'react';

const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>Coin / Outline</title>
    <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"></circle>
    <circle cx="12" cy="12" r="4.75" stroke="currentColor" strokeWidth="1.25" opacity="0.6"></circle>
    <path d="M18.25 12a6.25 6.25 0 0 1-2.1 4.67" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.75"></path>
    <path d="M16.9 8.2l.7-1.2M18.0 10.0l1.3-.5M18.2 12.0h1.35M17.8 14.0l1.25.45M16.8 15.9l.75 1.15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.65"></path>
  </svg>
);

export default CoinIcon;