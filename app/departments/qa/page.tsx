'use client';

import React, {useState} from 'react';
import deptStyles from '../departments.module.css';
import qaStyles from './qa.module.css';
import {FileList} from '@/app/Utilities/ListFiles/listFiles';
import UploadComponent from '@/app/Utilities/Upload/uploadComponent';
import AIButton from '@/app/aiAddon/aiButton';
import SearchBar from '@/app/Utilities/SearchBar/searchBar';
import Header from '@/app/Utilities/Header/header';
import '@/app/globals.css';
import FileTitle from '@/app/Utilities/FileTitle/fileTitle';

const qaDepartment = () => {
    const styles = {...deptStyles, ...qaStyles};
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj';
    const MANUDEPTID = 'ti7yNByDOzarVXoujOog';

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

    const inboxFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        MANUDEPTID,
        'records',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            <Header department="Quality Assurance" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="QualityAssurance"
                        collections={['files']}
                        onUploadSuccess={updateLists}
                    />
                    <SearchBar
                        paths={[
                            'Eq2IDInbEQB5nI5Ar6Vj',
                            'ti7yNByDOzarVXoujOog/records',
                        ]}
                    />
                </div>

                <div className={styles.files}>
                    <div className={styles.fileSection}>
                        <FileTitle title="Department Files" />
                        <div className={styles.fileBox}>
                            <FileList
                                collectionPath={deptFilesPath}
                                title=""
                                initialDisplay="grid"
                                refreshTrigger={fileListUpdated}
                                enableShare={true}
                                onListUpdate={updateLists}
                            />
                        </div>
                    </div>
                    <div className={styles.fileSection}>
                        <FileTitle title="Inbox" />
                        <div className={styles.fileBox}>
                            <FileList
                                collectionPath={inboxFilesPath}
                                title=""
                                refreshTrigger={fileListUpdated}
                                onListUpdate={updateLists}
                            />
                        </div>
                    </div>
                </div>
                <AIButton
                    paths={[
                        'Eq2IDInbEQB5nI5Ar6Vj',
                        'ti7yNByDOzarVXoujOog/records',
                    ]}
                />
            </div>
        </div>
    );
};

export default qaDepartment;
