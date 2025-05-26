
import type React from 'react';

const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="120" height="50" viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="120" height="50" rx="8" ry="8" className="fill-primary" />
    <text 
      x="50%" 
      y="50%" 
      fontFamily="var(--font-geist-sans), Arial, sans-serif" 
      fontSize="20" 
      className="fill-primary-foreground" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontWeight="600"
    >
      Maw'id
    </text>
  </svg>
);

export default LogoIcon;
