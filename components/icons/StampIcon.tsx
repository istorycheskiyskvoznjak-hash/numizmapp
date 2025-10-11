import React from 'react';

const StampIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.868-1.114a2.25 2.25 0 0 1 1.183-1.981l-6.478-3.488m-1.183 1.981-6.478-3.488m14.513 14.513L18 21.75M3 21.75l2.632-2.632M3 3.75l2.632 2.632M18 3.75l2.632 2.632M21.75 15.062a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488a2.25 2.25 0 0 1-2.184 0l-6.478-3.488a2.25 2.25 0 0 1-1.183-1.981V8.938a2.25 2.25 0 0 1 1.183-1.981l6.478-3.488a2.25 2.25 0 0 1 2.184 0l6.478 3.488a2.25 2.25 0 0 1 1.183 1.981v6.124Z" />
  </svg>
);

export default StampIcon;
