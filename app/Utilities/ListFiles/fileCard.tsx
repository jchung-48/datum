import React from 'react';
import styles from './fileCard.module.css';
import {FileData} from '@/app/types';
import {FaStar} from 'react-icons/fa';

type FileCardProps = {
  file: FileData;
  isSelected: boolean;
  currentUserUid: string | null;
  onSelect: (fileId: string) => void;
  onDelete?: (file: {id: string; fileName: string; filePath: string}) => void;
};

const FileCard: React.FC<FileCardProps> = ({
  file,
  isSelected,
  currentUserUid,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      key={file.id}
      className={`${styles.fileItem} ${isSelected ? styles.selected : ''}`}
      onClick={e => {
        if (
          !(e.target as HTMLElement).closest(`.${styles.fileCheckboxThumbnail}`)
        ) {
          onSelect(file.id);
        }
      }}
    >
      <input
        type="checkbox"
        className={styles.fileCheckboxThumbnail}
        onChange={() => onSelect(file.id)}
        checked={isSelected}
      />
      <img
        src={file.thumbnail}
        alt={file.fileName}
        className={styles.fileThumbnail}
        onClick={e => {
          e.stopPropagation();
          window.open(file.download, '_blank');
        }}
      />
      <p className={styles.fileName}>{file.fileName}</p>
      {currentUserUid === file.uploadedBy && 
        <FaStar className={styles.star}
      />}
    </div>
  );
};

export default FileCard;
