import { Timestamp } from "firebase/firestore";
import { arrayOutputType } from "zod";

export type FirestorePath = {
    collectionType: "Departments" | "Buyers" | "Manufacturers";
    companyId: string;
    departmentId?: string;
    buyerId?: string;
    manufacturerId?: string;
    collectionName?: string;
}

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
    initialDisplay?: "list" | "horizontal" | "grid";
    refreshTrigger?: boolean;
    enableShare?: boolean;
};

export type UploadComponentProps = {
    companyId: string;
    departmentId: string;
    departmentName: string;
    collections?: string[]; 
    onUploadSuccess?: () => void;
};

