import logo from "../../assets/logo_website.webp";

const SIZE = {
  md: "h-16 w-32 lg:h-25 lg:w-50",
  sm: "h-22.5 w-45",
};

const Logo = ({ size }: { size: "md" | "sm" }) => (
  <img src={logo} alt="Bayerischer Stock-Car Verband" className={`object-contain ${SIZE[size]}`} />
);

export default Logo;
