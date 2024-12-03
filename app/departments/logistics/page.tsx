'use client'; // Mark as a Client Component

import React, {useState} from 'react';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import deptStyles from '../departments.module.css';
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import Header from '@/app/Utilities/Header/header';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const LogisticsDepartment: React.FC = () => {
    const styles = {...deptStyles};

    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'KZm56fUOuTobsTRCfknJ'; // Update to the Logistics department ID

    const [fileListUpdated, setFileListUpdated] = useState(false);

    // Firestore paths for different file types
    const customsFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'customsFiles',
    ] as [string, ...string[]];

    const financialFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'financialFiles',
    ] as [string, ...string[]];

    const transportationFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'transportationFiles',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Logistics" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="Logistics"
                        collections={[
                            'transportationFiles',
                            'customsFiles',
                            'financialFiles',
                        ]}
                        onUploadSuccess={() =>
                            setFileListUpdated(prev => !prev)
                        }
                    />
                    <div className={styles.search}>
                        <SearchBar paths={['KZm56fUOuTobsTRCfknJ']} />
                    </div>
                </div>

                <div className={styles.files}>
                    <FileTitle title="Transportation Files" />
                    <FileList
                        collectionPath={transportationFilesPath}
                        title=""
                        horizontal
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                    />
                    <FileTitle title="Customs Files" />
                    <FileList
                        collectionPath={customsFilesPath}
                        title=""
                        horizontal
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                    />
                    <FileTitle title="Financial Files" />
                    <FileList
                        collectionPath={financialFilesPath}
                        title=""
                        horizontal
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                    />
                </div>

                <div className={styles.aiFeatures}>
                    <AIButton paths={['KZm56fUOuTobsTRCfknJ']} />
                </div>
            </div>
        </div>
    );
};

export default LogisticsDepartment;
