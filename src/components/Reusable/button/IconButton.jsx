const IconButton = ({ children, variant = "default", onClick, title }) => {

  const variants = {
    edit: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    delete: "bg-red-50 text-red-600 hover:bg-red-100",
    view: "bg-green-50 text-green-600 hover:bg-green-100",
    default: "bg-gray-50 text-gray-600 hover:bg-gray-100"
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        p-1 rounded
        transition-colors
        ${variants[variant]}
      `}
    >
      {children}
    </button>
  );
};

export default IconButton;