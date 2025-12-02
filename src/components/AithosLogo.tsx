interface AithosLogoProps {
  size?: number;
  className?: string;
}

export const AithosLogo = ({ size = 24, className }: AithosLogoProps) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Stylized "A" shape */}
      <path d="M12 2L3 22h4l1.5-4h7l1.5 4h4L12 2z" />
      {/* Elevated crossbar */}
      <line x1="7.5" y1="14" x2="16.5" y2="14" />
      {/* AI node - central circle */}
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
};
