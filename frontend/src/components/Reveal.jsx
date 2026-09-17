import { useReveal } from "../hooks/useReveal";

export default function Reveal({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} data-reveal className={className} {...rest}>
      {children}
    </Tag>
  );
}
