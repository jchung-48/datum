export type FileData = {
    id: string;
    fileName: string;
    download: string;
    filePath: string;
    thumbnail: string;
};

export type FileListProps = {
    collectionPath: [string, ...string[]];
    title: string;
    onSearch?: (query: string) => void;
    onFileSelect?: (fileId: string) => void;
};

