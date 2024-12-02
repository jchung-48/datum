import React, { useState, useRef } from 'react';
import styles from './fileCard.module.css';
import { FileData } from '@/app/types';
import { FaStar, FaTrash, FaShare } from 'react-icons/fa';
import DropdownMenu from '@/app/Utilities/DropDownMenu/dropdownMenu';
import ShareFileModal from '@/app/Utilities/ShareFiles/shareFile';

type FileCardProps = {
  file: FileData;
  isSelected: boolean;
  currentUserUid: string | null;
  onSelect: (fileId: string) => void;
  onDelete?: (file: { id: string; fileName: string; filePath: string }) => void;
};

const FileCard: React.FC<FileCardProps> = ({
  file,
  isSelected,
  currentUserUid,
  onSelect,
  onDelete,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Menu items for the dropdown menu
  const menuItems = [
    {
      icon: <FaShare />,
      label: 'Share',
      action: () => {
        console.log(`Share action for file: ${file.fileName}`);
        setIsShareModalOpen(true); // Open the share modal
      },
    },
    {
      icon: <FaTrash />,
      label: 'Delete',
      action: () => {
        console.log(`Delete action for file: ${file.fileName}`);
        if (onDelete) {
          onDelete({
            id: file.id,
            fileName: file.fileName,
            filePath: file.filePath,
          });
        }
      },
    },
  ];

  return (
    <>
      <div
        key={file.id}
        className={`${styles.fileItem} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => {
          if (
            !(e.target as HTMLElement).closest(`.${styles.dropdownMenuWrapper}`)
          ) {
            onSelect(file.id);
          }
        }}
      >
        {/* Dropdown menu positioned at the top-right */}
        <div
          className={styles.dropdownMenuWrapper}
          onClick={(e) => e.stopPropagation()} // Prevents click propagation to parent
        >
          <DropdownMenu menuItems={menuItems} iconColor="#333333" />
        </div>

        {/* Thumbnail image */}
        <img
          src={file.thumbnail}
          alt={file.fileName}
          className={styles.fileThumbnail}
          onClick={(e) => {
            e.stopPropagation();
            window.open(file.download, '_blank');
          }}
        />

        {/* File name */}
        <p className={styles.fileName}>{file.fileName}</p>

        {/* Optional star icon for files uploaded by the current user */}
        {currentUserUid === file.uploadedBy && <FaStar className={styles.star} />}
      </div>

      {/* Share file modal */}
      <ShareFileModal
        companyId={file.companyId} // Assuming `companyId` is part of the `file` data
        filesToShare={[file]}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        buttonRef={buttonRef}
      />
    </>
  );
};

export default FileCard;
