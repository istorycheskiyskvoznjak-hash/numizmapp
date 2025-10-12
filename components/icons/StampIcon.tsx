
import React from 'react';

const StampIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="1.565 1.565 20.87 20.87" fill="none" xmlns="http://www.w3.org/2000/svg">
    <title>Stamp / Outline</title>
    <g opacity="0.8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <circle cx="9.5" cy="12" r="2.25" />
        <path d="M13.5 10 C 14.5 9.5 15.5 10.5 16.5 10" />
        <path d="M13.5 12 C 14.5 11.5 15.5 12.5 16.5 12" />
        <path d="M13.5 14 C 14.5 13.5 15.5 14.5 16.5 14" />
    </g>
    <path d="M7 4.9v1.2M10 4.9v1.2M13 4.9v1.2M16 4.9v1.2M7 17.9v1.2M10 17.9v1.2M13 17.9v1.2M16 17.9v1.2M4.9 7h1.2M4.9 10h1.2M4.9 13h1.2M4.9 16h1.2M17.9 7h1.2M17.9 10h1.2M17.9 13h1.2M17.9 16h1.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.85"/>
    <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="1.75" stroke="currentColor" strokeWidth="1.75"/>
  </svg>
);

export default StampIcon;