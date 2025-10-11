import React from 'react';

const CommandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h9v9h-9v-9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h3v3h-3v-3zm12 0h3v3h-3v-3zm0 12h3v3h-3v-3zm-12 0h3v3h-3v-3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5v3m0 9v3m9-15v3m0 9v3m-15-9h3m9 0h3" />
  </svg>
);

export default CommandIcon;
