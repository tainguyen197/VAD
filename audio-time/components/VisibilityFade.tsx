import { useState, useEffect } from "react";

const VisibilityFade = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    return () => {
      setIsVisible(false);
    };
  }, []);

  return (
    <div className={`${isVisible ? "animate-fadeIn" : "animate-fadeOut"}`}>
      {children}
    </div>
  );
};

export default VisibilityFade;
