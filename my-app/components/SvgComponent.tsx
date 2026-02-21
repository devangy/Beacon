import Svg, { SvgProps, Circle, Path, G } from "react-native-svg";

const SvgComponent = (props: SvgProps) => (
    <Svg
        viewBox="0 0 72 72"
        // Setting these to 100% allows the parent View to control the size
        width="100%"
        height="100%"
        {...props}
    >
        {/* Inner Antenna Circle - Set to White */}
        <Circle cx={36} cy={32} r={5} fill="#FFFFFF" />

        {/* The Stand - Set to White */}
        <Path fill="#FFFFFF" d="M34 62h4l-2-25z" />
        <Path fill="#FFFFFF" d="m36 37 2 25h-2.02L36 37" />

        <G
            fill="none"
            stroke="#000" // Rings and Outlines - Black
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={10}
            strokeWidth={2}
        >
            <Circle cx={36} cy={32} r={5} />
            <Path d="m35 38-2 25h6l-2-25" />
            {/* The Rings */}
            <Path d="M42.265 50.985C50.239 48.355 56 40.855 56 32c0-11.046-8.954-20-20-20s-20 8.954-20 20c0 8.855 5.761 16.354 13.735 18.985" />
            <Path d="M41.588 45.913C47.102 43.696 51 38.307 51 32c0-8.284-6.716-15-15-15s-15 6.716-15 15c0 6.307 3.898 11.696 9.412 13.913" />
            <Path d="M40.895 40.715A9.992 9.992 0 0 0 46 32c0-5.523-4.477-10-10-10s-10 4.477-10 10c0 3.743 2.06 7 5.105 8.715" />
        </G>
    </Svg>
);

export default SvgComponent;
