import logoLight from "../assets/logos/logo-expertoya-light.svg";
import logoDark from "../assets/logos/logo-expertoya-dark.svg";

interface LogoProps {
  className?: string;
  alt?: string;
}

export const Logo = ({ className = "h-9 w-auto", alt = "ExpertoYa" }: LogoProps) => {
  return (
    <div className="inline-flex items-center select-none">
      {/* Variante para tema claro */}
      <img
        src={logoLight}
        alt={alt}
        className={`block dark:hidden object-contain ${className}`}
      />
      {/* Variante para tema oscuro */}
      <img
        src={logoDark}
        alt={alt}
        className={`hidden dark:block object-contain ${className}`}
      />
    </div>
  );
};

export default Logo;
