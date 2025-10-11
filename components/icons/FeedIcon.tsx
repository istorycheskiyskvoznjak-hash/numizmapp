import React from 'react';

const FeedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.73 9h16.54M3.73 15h16.54M9 3.73a15.8 15.8 0 0 1 6 0M9 20.27a15.8 15.8 0 0 0 6 0" />
  </svg>
);

export default FeedIcon;