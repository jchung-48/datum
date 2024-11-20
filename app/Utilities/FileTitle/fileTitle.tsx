import React from 'react';
import styles from './FileTitle.module.css';
import { FileTitleProps } from '../../types';

const FileTitle: React.FC<FileTitleProps> = ({ title }) => {
    return <div className={styles.fileTitle}>{title}</div>;
};

export default FileTitle;
