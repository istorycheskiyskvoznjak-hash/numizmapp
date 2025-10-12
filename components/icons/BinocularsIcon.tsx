import React from 'react';

const BinocularsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Проверить спрос / Бинокль</title>
    <circle cx="8.5" cy="13.5" r="3" stroke="currentColor" strokeWidth="1.75"/>
    <circle cx="15.5" cy="13.5" r="3" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M6.5 10l2-4M17.5 10l-2-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    <path d="M10.5 9.5h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export default BinocularsIcon;