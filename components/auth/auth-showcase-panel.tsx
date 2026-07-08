type ShowcaseChartsContent = {
  slide1Label: string;
  slide1Value: string;
  slide1Delta: string;
  slide1StageDraft: string;
  slide1StageSent: string;
  slide1StageWon: string;
  slide1Note: string;
  slide2Label: string;
  slide2Value: string;
  slide2Delta: string;
  slide2AxisStart: string;
  slide2AxisEnd: string;
  slide3Label: string;
  slide3Value: string;
  slide3Delta: string;
  slide3CategoryA: string;
  slide3CategoryB: string;
  slide3CategoryC: string;
  slide3CategoryD: string;
};

type AuthShowcasePanelProps = {
  brandName: string;
  brandSlogan: string;
  heroDescription: string;
  charts: ShowcaseChartsContent;
};

export function AuthShowcasePanel({
  brandName,
  brandSlogan,
  heroDescription,
  charts,
}: AuthShowcasePanelProps) {
  return (
    <div className="premium-brand-panel relative hidden h-full min-h-0 rounded-[1.3rem] p-5 lg:flex lg:flex-col lg:justify-between lg:rounded-[1.6rem] lg:px-8 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_18%_16%,hsl(var(--card)/0.78),transparent_34%),radial-gradient(circle_at_74%_20%,hsl(var(--primary)/0.28),transparent_42%),radial-gradient(circle_at_80%_76%,hsl(var(--info)/0.2),transparent_42%)]"
      />

      <div className="relative z-10 pt-2">
        <p className="brand-wordmark brand-wordmark-hero brand-wordmark-tech text-[clamp(2.55rem,6.8vw,5.7rem)] leading-[0.84] tracking-[0.24em] sm:tracking-[0.28em]">
          {brandName}
        </p>
        <p className="mt-2 text-[11px] font-semibold tracking-[0.22em] text-foreground/62 uppercase">
          {brandSlogan}
        </p>
      </div>

      <div
        aria-hidden
        className="relative z-10 my-4 w-full flex-1 overflow-hidden"
      >
        <div className="relative h-full min-h-80">
          <div className="hero-chart-slide hero-chart-slide-1 absolute inset-0 flex flex-col justify-center">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-foreground/65 uppercase">
                  {charts.slide1Label}
                </p>
                <p className="text-3xl font-semibold tracking-tight text-foreground/94">
                  {charts.slide1Value}
                </p>
              </div>
              <p className="text-base font-semibold text-info">
                {charts.slide1Delta}
              </p>
            </div>

            <div className="grid h-64 grid-cols-1 place-items-center gap-4">
              <div className="relative grid size-60 place-items-center">
                <div
                  className="size-full rounded-full"
                  style={{
                    background:
                      "conic-gradient(hsl(var(--primary) / 0.34) 0deg 108deg, hsl(var(--primary) / 0.84) 108deg 295deg, hsl(var(--info) / 0.82) 295deg 360deg)",
                    transform: "rotate(-90deg)",
                  }}
                />
                <div className="absolute inset-[17%] rounded-full bg-card/92 shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.08)]" />
                <div className="absolute text-center">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-foreground/62 uppercase">
                    {charts.slide1Note}
                  </p>
                  <p className="text-3xl font-semibold text-foreground/95">
                    32%
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-foreground/70 sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary/35" />
                  <span>{charts.slide1StageDraft}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary/75" />
                  <span>{charts.slide1StageSent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-info/80" />
                  <span>{charts.slide1StageWon}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-chart-slide hero-chart-slide-2 absolute inset-0 flex flex-col justify-center">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-foreground/65 uppercase">
                  {charts.slide2Label}
                </p>
                <p className="text-3xl font-semibold tracking-tight text-foreground/94">
                  {charts.slide2Value}
                </p>
              </div>
              <p className="text-base font-semibold text-success">
                {charts.slide2Delta}
              </p>
            </div>

            <div className="relative h-56">
              <svg viewBox="0 0 320 210" className="h-full w-full">
                <defs>
                  <linearGradient id="salesBars" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary) / 0.86)" />
                    <stop offset="100%" stopColor="hsl(var(--info) / 0.5)" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 176 C 42 172, 56 152, 86 146 C 116 140, 132 114, 162 110 C 198 106, 214 82, 244 80 C 274 78, 292 62, 312 54"
                  fill="none"
                  stroke="hsl(var(--foreground) / 0.22)"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                />
                <rect
                  x="26"
                  y="130"
                  width="24"
                  height="56"
                  rx="4"
                  fill="url(#salesBars)"
                />
                <rect
                  x="68"
                  y="118"
                  width="24"
                  height="68"
                  rx="4"
                  fill="url(#salesBars)"
                />
                <rect
                  x="110"
                  y="98"
                  width="24"
                  height="88"
                  rx="4"
                  fill="url(#salesBars)"
                />
                <rect
                  x="152"
                  y="108"
                  width="24"
                  height="78"
                  rx="4"
                  fill="url(#salesBars)"
                />
                <rect
                  x="194"
                  y="74"
                  width="24"
                  height="112"
                  rx="4"
                  fill="url(#salesBars)"
                  className="motion-safe:animate-pulse"
                />
                <rect
                  x="236"
                  y="92"
                  width="24"
                  height="94"
                  rx="4"
                  fill="url(#salesBars)"
                />
                <rect
                  x="278"
                  y="82"
                  width="24"
                  height="104"
                  rx="4"
                  fill="url(#salesBars)"
                />
              </svg>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-medium tracking-[0.12em] text-foreground/56 uppercase">
              <span>{charts.slide2AxisStart}</span>
              <span>{charts.slide2AxisEnd}</span>
            </div>
          </div>

          <div className="hero-chart-slide hero-chart-slide-3 absolute inset-0 flex flex-col justify-center">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-foreground/65 uppercase">
                  {charts.slide3Label}
                </p>
                <p className="text-3xl font-semibold tracking-tight text-foreground/94">
                  {charts.slide3Value}
                </p>
              </div>
              <p className="text-sm font-semibold text-warning">
                {charts.slide3Delta}
              </p>
            </div>

            <div className="grid h-56 grid-cols-4 items-end gap-3">
              <div className="flex h-full flex-col items-center justify-end gap-2">
                <span className="h-[88%] w-full rounded-t-sm bg-primary/86" />
                <span className="text-[10px] font-semibold tracking-[0.12em] text-foreground/56 uppercase">
                  {charts.slide3CategoryA}
                </span>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2">
                <span className="h-[76%] w-full rounded-t-sm bg-info/74" />
                <span className="text-[10px] font-semibold tracking-[0.12em] text-foreground/56 uppercase">
                  {charts.slide3CategoryB}
                </span>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2">
                <span className="h-[44%] w-full rounded-t-sm bg-primary/55 motion-safe:animate-pulse" />
                <span className="text-[10px] font-semibold tracking-[0.12em] text-foreground/56 uppercase">
                  {charts.slide3CategoryC}
                </span>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2">
                <span className="h-[28%] w-full rounded-t-sm bg-info/46 motion-safe:animate-pulse [animation-delay:180ms]" />
                <span className="text-[10px] font-semibold tracking-[0.12em] text-foreground/56 uppercase">
                  {charts.slide3CategoryD}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 w-full space-y-4 pb-1">
        <p className="w-full max-w-none text-base leading-relaxed text-foreground/86 lg:text-[1.06rem]">
          {heroDescription}
        </p>
      </div>
    </div>
  );
}
