export default function HalfStar({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="half-grad">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <path
        d="M12 2l2.9 6.3L22 9.2l-5 4.9 1.2 7.1L12 17.8l-6.2 3.4L7 14l-5-4.9 7.1-1z"
        fill="url(#half-grad)"
      />
      <path d="M12 2l2.9 6.3L22 9.2l-5 4.9 1.2 7.1L12 17.8l-6.2 3.4L7 14l-5-4.9 7.1-1z" />
    </svg>
  );
}