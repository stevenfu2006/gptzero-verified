export function generateBadgeSvg(humanScore: number, verifyUrl: string): string {
  const scoreText = `${Math.round(humanScore)}%`;
  const urlDisplay =
    verifyUrl.length > 44 ? verifyUrl.slice(0, 41) + "..." : verifyUrl;

  const safeUrl = urlDisplay
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
    .map((deg) => `<line x1="0" y1="-9.5" x2="0" y2="-12" stroke="#1D7A5F" stroke-width="0.9" transform="rotate(${deg})"/>`)
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="40" viewBox="0 0 220 40">` +
    `<defs><clipPath id="c"><rect width="220" height="40" rx="20"/></clipPath></defs>` +
    `<g clip-path="url(#c)">` +
    `<rect width="220" height="40" fill="#0D1B2A"/>` +
    `<g transform="translate(22,20)">` +
    `<circle r="12" fill="none" stroke="#1D7A5F" stroke-width="1.2"/>` +
    ticks +
    `<circle r="7" fill="none" stroke="#1D7A5F" stroke-width="0.8" stroke-dasharray="1.5 1.5"/>` +
    `<circle r="2" fill="#1D7A5F"/>` +
    `</g>` +
    `<line x1="44" y1="8" x2="44" y2="32" stroke="#1B3040"/>` +
    `<line x1="162" y1="8" x2="162" y2="32" stroke="#1B3040"/>` +
    `<text x="53" y="15" font-family="Arial,sans-serif" font-size="7.5" fill="#6B7280" letter-spacing="0.8">GPTZERO</text>` +
    `<text x="53" y="28" font-family="Georgia,serif" font-size="10" font-weight="bold" fill="white">VERIFIED HUMAN</text>` +
    `<text x="191" y="25" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">${scoreText}</text>` +
    `</g></svg>`
  );
}
