export type FileData = {
    id: string;
    fileName: string;
    download: string;
    filePath: string;
};

export type FileListProps = {
    collectionPath: [string, ...string[]];
    title: string;
};

