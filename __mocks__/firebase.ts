export const db = jest.fn();
export const storage = jest.fn();

export const getDocs = jest.fn().mockResolvedValue([]);
export const collection = jest.fn();
export const ref = jest.fn();
export const getDownloadURL = jest.fn().mockResolvedValue('mock-url');
