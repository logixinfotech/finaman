const IconButton = ({ title, onClick, variant = "default", children }) => {
  return (
    <button
      type="button"
      title={title}
      className={`icon-btn icon-btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default IconButton;
