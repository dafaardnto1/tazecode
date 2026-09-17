import { useState } from "react";

export default function PasswordInput({ id, value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        style={{ paddingRight: 60, width: "100%" }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
          border: "none", background: "none", color: "var(--muted)", fontFamily: "var(--mono)",
          fontSize: 11, textTransform: "uppercase", letterSpacing: ".03em", cursor: "pointer", padding: "4px 6px"
        }}
        tabIndex={-1}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
