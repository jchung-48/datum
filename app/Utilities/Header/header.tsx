import React from 'react';
import Link from 'next/link';
import styles from './header.module.css';
import {LuCloudLightning} from 'react-icons/lu';
import {FaUserCircle} from 'react-icons/fa';
import {HeaderProps} from '../../types';

const Header: React.FC<HeaderProps> = ({department, isProfile}) => {
    return (
        <div className={styles.header}>
            <Link href="/home">
                <div className={styles.home}>
                    <LuCloudLightning className={styles.cloudIcon} />
                    DATUM
                </div>
            </Link>

            {department && (
                <div className={styles.department}>{department}</div>
            )}

            {!isProfile && (
                <div className={styles.profile}>
                    <Link href="/profile">
                        <FaUserCircle className={styles.profileIcon} />
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Header;
