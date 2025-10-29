import React, { useState } from "react";

const Avatar = ({
  src,
  name,
  size = 32,
  borderRadius = 8,
  className = "",
  alt,
}) => {
  const [error, setError] = useState(false);

  const initial = (name || "").trim().charAt(0).toUpperCase() || "?";

  const style = {
    width: size,
    height: size,
    borderRadius:
      typeof borderRadius === "number" ? borderRadius : borderRadius,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6c757d",
    color: "#fff",
    fontWeight: 600,
    fontSize: Math.max(12, Math.floor(size / 2.2)),
    flexShrink: 0,
    marginRight: 10,
  };

  if (!src || error) {
    return (
      <div className={className} style={style} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name || "avatar"}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius,
        objectFit: "cover",
        flexShrink: 0,
        marginRight: 20,
      }}
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
