import { Timestamp } from "firebase/firestore";
import { arrayOutputType } from "zod";

export type FileData = {
    id: string;
    fileName: string;
    download: string;
    filePath: string;
    tags: [];
    uploadTimeStamp: Timestamp;
    uploadedBy: string;
    userDisplayName: string;
    thumbnail: string;
};

export type FileListProps = {
    collectionPath: [string, ...string[]];
    title: string;
    onSearch?: (query: string) => void;
    onFileSelect?: (fileId: string) => void;
    display?: "list" | "horizontal" | "grid";
};

