import React from 'react';

const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25l-4.148 2.18.788-4.867L5.636 11.9l4.908-.71L12 6.75l2.456 4.44 4.908.71-3.552 3.473.788 4.867L12 17.25Z" />
  </svg>
);

export default CoinIcon;
