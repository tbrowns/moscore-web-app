import React from "react";

const LoadingBar: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-accent z-50">
      <div className="h-full w-1/3 bg-primary animate-loading-bar rounded-full"></div>
    </div>
  );
};

export default LoadingBar;
