interface BadgeProps {
  humanScore: number;
  verifyUrl: string;
}

export default function Badge({ humanScore, verifyUrl }: BadgeProps) {
  const scoreText = `${Math.round(humanScore)}%`;
  const urlDisplay =
    verifyUrl.length > 44 ? verifyUrl.slice(0, 41) + "..." : verifyUrl;
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="220"
      height="40"
      viewBox="0 0 220 40"
      role="img"
      aria-label={`GPTZero Verified — ${scoreText} Human`}
    >
      <defs>
        <clipPath id="badge-clip">
          <rect width="220" height="40" rx="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#badge-clip)">
        <rect width="220" height="40" fill="#0D1B2A" />

        {/* Emblem centered in left 44px zone */}
        <g transform="translate(22, 20)">
          <circle r="12" fill="none" stroke="#1D7A5F" strokeWidth="1.2" />
          {ticks.map((deg) => (
            <line
              key={deg}
              x1="0" y1="-9.5" x2="0" y2="-12"
              stroke="#1D7A5F" strokeWidth="0.9"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle r="7" fill="none" stroke="#1D7A5F" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
          <circle r="2" fill="#1D7A5F" />
        </g>

        {/* Left/right dividers */}
        <line x1="44" y1="8" x2="44" y2="32" stroke="#1B3040" />
        <line x1="162" y1="8" x2="162" y2="32" stroke="#1B3040" />

        {/* Middle: brand + claim */}
        <text x="53" y="15" fontFamily="Arial, sans-serif" fontSize="7.5" fill="#6B7280" letterSpacing="0.8">
          GPTZERO
        </text>
        <text x="53" y="28" fontFamily="Georgia, serif" fontSize="10" fontWeight="bold" fill="white">
          VERIFIED HUMAN
        </text>

        {/* Right: score */}
        <text
          x="191" y="25"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="15"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          {scoreText}
        </text>
      </g>
    </svg>
  );
}
