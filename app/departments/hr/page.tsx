'use client';

import React, {useState} from 'react';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import deptStyles from '../departments.module.css';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const hrDepartment: React.FC = () => {
    const styles = {...deptStyles};
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'NpaV1QtwGZ2MDNOGAlXa';

    const [fileListUpdated, setFileListUpdated] = useState(false);


    const updateLists = () => {
        setFileListUpdated(prev => !prev)
    }

    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    const incidentFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'incident',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Human Resources" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="HumanResources"
                        collections={['files', 'incident']}
                        onUploadSuccess={updateLists}
                    />
                    <div className={styles.search}>
                        <SearchBar paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                    </div>
                </div>
                <div className={styles.files}>
                    <FileTitle title="Department Files" />
                    <FileList
                        collectionPath={deptFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                    <FileTitle title="Incident Files" />
                    <FileList
                        collectionPath={incidentFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                </div>
                <div className={styles.aiFeatures}>
                    <AIButton paths={['NpaV1QtwGZ2MDNOGAlXa']} />
                </div>
            </div>
        </div>
    );
};

export default hrDepartment;
