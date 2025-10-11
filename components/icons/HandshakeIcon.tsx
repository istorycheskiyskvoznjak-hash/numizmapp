import React from 'react';

const HandshakeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 0 0-5.84-2.56m0 0a14.982 14.982 0 0 1-5.84 2.56m5.84-2.56V21m-5.84-7.38v-4.82a6 6 0 0 1 11.68 0v4.82" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.875a9 9 0 0 0 18 0" />
  </svg>
);

export default HandshakeIcon;