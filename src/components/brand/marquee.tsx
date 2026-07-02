const items = [
  "БEGI", "ДВЖ", "ТУСОВКА", "ЧЕЛЛЕНДЖ",
  "ХАМОВНИКИ", "СОКОЛ", "АРБАТ", "ДВЖ",
  "ИВЕНТ", "КЛУБ", "РЯДОМ", "ДВЖ",
  "ВОЛОНТЁРСТВО", "ТЕННИС", "КОФЕ", "ДВЖ",
];

export function TrendMarquee() {
  const repeated = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-lime/[0.04] py-2.5">
      <div className="flex w-max marquee-inner">
        {repeated.map((item, i) => (
          <span key={i} className="shrink-0 mx-4 text-[11px] font-heading text-lime/60 tracking-[0.2em]">
            {item}
          </span>
        ))}
      </div>
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
