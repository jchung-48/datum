// components/Header.tsx

import React from 'react';
import Link from 'next/link';
import styles from './header.module.css'; // Ensure the correct path
import { LuCloudLightning } from 'react-icons/lu';
import { FaUserCircle } from 'react-icons/fa';
import { useRouter } from 'next/router';

interface HeaderProps {
  department?: string;
  isProfile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ department, isProfile }) => {

  return (
    <div className={styles.header}>
      {/* Home Link */}
      <Link href="/home">
        <div className={styles.home}>
          <LuCloudLightning className={styles.cloudIcon} />
          DATUM
        </div>
      </Link>

      {/* Department Display */}
      {department && <div className={styles.department}>{department}</div>}

      {/* Profile Icon */}
      {!isProfile  && (
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