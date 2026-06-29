export function Mascot({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <ellipse cx="50" cy="88" rx="22" ry="5" fill="rgba(0,0,0,.25)" />
      <path d="M50 20 C46 8 60 6 56 18" stroke="#00D9FF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="13" r="4" fill="#00D9FF" />
      <path d="M28 58 C28 36 72 36 72 58 C72 80 56 86 50 86 C44 86 28 80 28 58Z" fill="#C8FF57" />
      <path d="M28 58 C28 36 72 36 72 58 C72 70 60 74 50 74 C40 74 28 70 28 58Z" fill="#9AFF00" opacity="0.5" />
      <circle cx="41" cy="56" r="5.5" fill="#fff" />
      <circle cx="59" cy="56" r="5.5" fill="#fff" />
      <circle cx="42" cy="57" r="2.8" fill="#0A0A0F" />
      <circle cx="60" cy="57" r="2.8" fill="#0A0A0F" />
      <circle cx="43" cy="56" r="1" fill="#fff" />
      <circle cx="61" cy="56" r="1" fill="#fff" />
      <path d="M44 66 Q50 71 56 66" stroke="#0A0A0F" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="64" r="3.5" fill="rgba(200,255,87,.35)" />
      <circle cx="66" cy="64" r="3.5" fill="rgba(200,255,87,.35)" />
    </svg>
  );
}
