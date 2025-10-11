import React from 'react';

const PinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 8.25-1.5 1.5m-6.879 6.319.75.75a2.25 2.25 0 0 1-3.182 3.182l-3.75-3.75a2.25 2.25 0 0 1 0-3.182l.75-.75a2.25 2.25 0 0 1 3.182 0l3.75 3.75a2.25 2.25 0 0 1 0 3.182Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 12.75a2.25 2.25 0 0 0-3.182 0l-3.75 3.75a2.25 2.25 0 0 0 3.182 3.182l3.75-3.75a2.25 2.25 0 0 0 0-3.182ZM11.25 12.75l.75.75m-8.25-8.25.75.75a2.25 2.25 0 0 1 0 3.182l-3.75 3.75a2.25 2.25 0 0 1-3.182-3.182l3.75-3.75a2.25 2.25 0 0 1 3.182 0l.75.75m-4.5-4.5 1.5 1.5" />
  </svg>
);

export default PinIcon;