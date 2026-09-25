export function Brand() {
  return (
    <div className="brand">
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="sqGlobeClip">
              <circle cx="24" cy="29" r="12" />
            </clipPath>
          </defs>
          <circle cx="24" cy="29" r="12" fill="var(--blue)" />
          <g clipPath="url(#sqGlobeClip)">
            <ellipse cx="19" cy="24" rx="5.2" ry="3.3" fill="var(--green)" transform="rotate(-20 19 24)" />
            <ellipse cx="30" cy="27" rx="4.6" ry="3.1" fill="var(--green)" transform="rotate(15 30 27)" />
            <ellipse cx="20" cy="35" rx="4.2" ry="2.7" fill="var(--green)" transform="rotate(-8 20 35)" />
          </g>
          <g transform="translate(3,30) rotate(-18)">
            <path
              d="M0 3 L10 3 L13 0 L15 0 L13.4 3 L19 3 L21 4.5 L13.4 4.5 L15 7.5 L13 7.5 L10 4.5 L0 4.5 Z"
              fill="#FFFFFF"
              stroke="#241F1B"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          </g>
          <path d="M24 10 L42 17 L24 24 L6 17 Z" fill="#241F1B" />
          <circle cx="24" cy="17" r="1.8" fill="#241F1B" />
          <path d="M25.4 17.6 Q34 20 36 27" stroke="#F0B429" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="36.3" cy="28.4" r="1.9" fill="#F0B429" />
        </svg>
      </span>
      <span className="wordmark">
        <span className="c1">S</span>
        <span className="c2">c</span>
        <span className="c4">h</span>
        <span className="c3">o</span>
        <span className="c1">l</span>
        <span className="c4">a</span>
        <span className="c2">r</span>
        <span className="c3">s</span>
        <span className="c1">h</span>
        <span className="c2">i</span>
        <span className="c4">p</span> <span className="c3">Q</span>
        <span className="c1">u</span>
        <span className="c2">e</span>
        <span className="c4">s</span>
        <span className="c3">t</span>
      </span>
    </div>
  );
}
