import { CAT_COLORS, CAT_EYES, CAT_FACES, type CatEyes, type CatFace } from "@/lib/avatar";

function EyesGroup({ variant }: { variant: CatEyes }) {
  const LX = 36;
  const RX = 64;
  const CY = 48;

  switch (variant) {
    case "sleepy":
      return (
        <g stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d={`M ${LX - 6} ${CY} Q ${LX} ${CY + 4} ${LX + 6} ${CY}`} />
          <path d={`M ${RX - 6} ${CY} Q ${RX} ${CY + 4} ${RX + 6} ${CY}`} />
        </g>
      );
    case "wink":
      return (
        <g>
          <path
            d={`M ${LX - 6} ${CY} Q ${LX} ${CY + 5} ${LX + 6} ${CY}`}
            stroke="#1a1a1a"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx={RX} cy={CY} rx={4.5} ry={6.5} fill="#1a1a1a" />
          <circle cx={RX - 1.3} cy={CY - 2} r={1.4} fill="#fff" />
        </g>
      );
    case "wide":
      return (
        <g>
          <circle cx={LX} cy={CY} r={7.5} fill="#fff" stroke="#1a1a1a" strokeWidth={1.5} />
          <circle cx={RX} cy={CY} r={7.5} fill="#fff" stroke="#1a1a1a" strokeWidth={1.5} />
          <circle cx={LX} cy={CY} r={3.6} fill="#1a1a1a" />
          <circle cx={RX} cy={CY} r={3.6} fill="#1a1a1a" />
        </g>
      );
    case "angry":
      return (
        <g>
          <ellipse cx={LX} cy={CY} rx={4.5} ry={6} fill="#1a1a1a" transform={`rotate(15 ${LX} ${CY})`} />
          <ellipse cx={RX} cy={CY} rx={4.5} ry={6} fill="#1a1a1a" transform={`rotate(-15 ${RX} ${CY})`} />
          <path
            d={`M ${LX - 8} ${CY - 9} L ${LX + 6} ${CY - 5}`}
            stroke="#1a1a1a"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <path
            d={`M ${RX + 8} ${CY - 9} L ${RX - 6} ${CY - 5}`}
            stroke="#1a1a1a"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    case "heart":
      return (
        <g fill="#e0455f">
          <path d={`M ${LX} ${CY + 5} L ${LX - 6} ${CY - 1} A 3.2 3.2 0 0 1 ${LX} ${CY - 6} A 3.2 3.2 0 0 1 ${LX + 6} ${CY - 1} Z`} />
          <path d={`M ${RX} ${CY + 5} L ${RX - 6} ${CY - 1} A 3.2 3.2 0 0 1 ${RX} ${CY - 6} A 3.2 3.2 0 0 1 ${RX + 6} ${CY - 1} Z`} />
        </g>
      );
    case "normal":
    default:
      return (
        <g>
          <ellipse cx={LX} cy={CY} rx={4.5} ry={6.5} fill="#1a1a1a" />
          <ellipse cx={RX} cy={CY} rx={4.5} ry={6.5} fill="#1a1a1a" />
          <circle cx={LX - 1.3} cy={CY - 2} r={1.4} fill="#fff" />
          <circle cx={RX - 1.3} cy={CY - 2} r={1.4} fill="#fff" />
        </g>
      );
  }
}

function FaceGroup({ variant }: { variant: CatFace }) {
  const nose = <path d="M 47 60 L 53 60 L 50 64 Z" fill="#1a1a1a" />;
  const whiskers = (
    <g stroke="#1a1a1a" strokeWidth={1.2} strokeLinecap="round" opacity={0.55}>
      <path d="M 30 62 L 12 58" />
      <path d="M 30 66 L 12 66" />
      <path d="M 30 70 L 12 74" />
      <path d="M 70 62 L 88 58" />
      <path d="M 70 66 L 88 66" />
      <path d="M 70 70 L 88 74" />
    </g>
  );

  switch (variant) {
    case "smirk":
      return (
        <g>
          {nose}
          <path d="M 50 64 Q 58 70 64 65" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>
      );
    case "surprised":
      return (
        <g>
          {nose}
          <ellipse cx={50} cy={70} rx={4} ry={5} fill="#1a1a1a" />
        </g>
      );
    case "grumpy":
      return (
        <g>
          {nose}
          <path d="M 42 71 Q 50 65 58 71" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>
      );
    case "tongue":
      return (
        <g>
          {nose}
          <path d="M 42 64 Q 50 70 58 64" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
          <rect x={46} y={68} width={8} height={9} rx={4} fill="#e0455f" />
        </g>
      );
    case "whiskers":
      return (
        <g>
          {nose}
          <path d="M 42 64 Q 50 69 58 64" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
          {whiskers}
        </g>
      );
    case "smile":
    default:
      return (
        <g>
          {nose}
          <path d="M 42 64 Q 50 71 58 64" stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" fill="none" />
        </g>
      );
  }
}

export default function CatAvatar({
  color,
  eyes,
  face,
  size = 56,
  className = "",
}: {
  color: number;
  eyes: number;
  face: number;
  size?: number;
  className?: string;
}) {
  const fill = CAT_COLORS[color] ?? CAT_COLORS[0];
  const eyesVariant = CAT_EYES[eyes] ?? CAT_EYES[0];
  const faceVariant = CAT_FACES[face] ?? CAT_FACES[0];

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Cat avatar"
    >
      <polygon points="18,28 32,4 42,32" fill={fill} stroke="#1a1a1a" strokeWidth={2} strokeLinejoin="round" />
      <polygon points="82,28 68,4 58,32" fill={fill} stroke="#1a1a1a" strokeWidth={2} strokeLinejoin="round" />
      <polygon points="21,26 30,11 37,28" fill="#00000022" />
      <polygon points="79,26 70,11 63,28" fill="#00000022" />
      <ellipse cx={50} cy={56} rx={38} ry={36} fill={fill} stroke="#1a1a1a" strokeWidth={2.5} />
      <EyesGroup variant={eyesVariant} />
      <FaceGroup variant={faceVariant} />
    </svg>
  );
}
