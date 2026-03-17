// Uses react-icons, color comes from CSS variable --icon-color
import * as MdIcons from "react-icons/md";
import * as FaIcons from "react-icons/fa";

function DynamicIcon({ name, size = 20, className = "" }) {
    const Icon =
        MdIcons[name] ||
        FaIcons[name] ||
        MdIcons.MdApps;

    return <Icon size={size} className={`theme-icon ${className}`} />;
}

export default DynamicIcon;
