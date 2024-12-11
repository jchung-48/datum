import React, {useState, useEffect, useRef} from 'react';
import {FaEllipsisV} from 'react-icons/fa';
import styles from './dropdownMenu.module.css';

type MenuItem = {
    icon: React.ReactNode;
    label: string;
    action: () => void;
};

type DropdownMenuProps = {
    menuItems: MenuItem[];
    // Takes the color as input, since the inheritance structure makes it so it can't
    // infer from the parent page. 
    iconColor?: string;
};

const DropdownMenu: React.FC<DropdownMenuProps> = ({
    menuItems,
    iconColor = 'inherit',
}) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsDropdownVisible(!isDropdownVisible);
    };

    useEffect(() => {
        // closes the dropdown when a click happens outside it
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownVisible(false);
            }
        };

        if (isDropdownVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownVisible]);

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
                className={styles.menuButton}
                onClick={toggleDropdown}
            >
                <FaEllipsisV color={iconColor} />
            </button>

            {isDropdownVisible && (
                <div className={styles.dropdownMenu}>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            className={styles.dropdownItem}
                            onClick={() => {
                                item.action();
                                setIsDropdownVisible(false);
                            }}
                        >
                            {React.cloneElement(
                                item.icon as React.ReactElement,
                                {color: iconColor},
                            )}
                            <span
                                className={styles.label}
                                style={{color: iconColor}}
                            >
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
