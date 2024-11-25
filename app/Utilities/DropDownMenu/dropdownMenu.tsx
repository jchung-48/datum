import React, { useState, useEffect, useRef } from 'react';
import { FaEllipsisV } from 'react-icons/fa'; // You can customize the icon as per your needs
import styles from './dropdownMenu.module.css';

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  action: () => void;
};

type DropdownMenuProps = {
  menuItems: MenuItem[];
  iconColor?: string;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({ menuItems, iconColor = 'inherit' }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref to the dropdown container

  // Toggle the dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false); // Close the dropdown if the click is outside
      }
    };

    if (isDropdownVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside); // Clean up event listener on unmount
    };
  }, [isDropdownVisible]);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {/* Button with three dots to toggle the dropdown */}
      <button className={styles.menuButton} onClick={toggleDropdown}>
        <FaEllipsisV color={iconColor} />
      </button>

      {/* Dropdown menu */}
      {isDropdownVisible && (
        <div className={styles.dropdownMenu}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={styles.dropdownItem}
              onClick={() => {
                item.action();
                setIsDropdownVisible(false); // Close the menu after clicking
              }}
            >
              {React.cloneElement(item.icon as React.ReactElement, { color: iconColor })}
              <span className={styles.label} style={{ color: iconColor }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
