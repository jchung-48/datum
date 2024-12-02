export type SearchBarAIProps = {
    paths: string[];
    onFileSelect: (file: SummarySearchResult) => void;
};

export type SummarySearchResult = {
    name: string;
    downloadURL: string;
    author: string;
    uploadDate: string;
    tags: string[];
};
