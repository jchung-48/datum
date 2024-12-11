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
    
    // hardcoded ids of firebase collections
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'Eq2IDInbEQB5nI5Ar6Vj';
    const MANUDEPTID = 'ti7yNByDOzarVXoujOog';

    // tracks changes to file lists to trigger re-rendering
    const [fileListUpdated, setFileListUpdated] = useState(false);

    // toggles state to refresh file lists when files are added/removed
    const updateLists = () => {
        setFileListUpdated(prev => !prev)
    }

    // path for department files in firebase
    const deptFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'files',
    ] as [string, ...string[]];

    // path for inbox files in firebase
    const inboxFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        MANUDEPTID,
        'records',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            {/*renders the department header*/}
            <Header department="Quality Assurance" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    {/*uploads files to designated collection and updates*/}
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="QualityAssurance"
                        collections={['files']}
                        onUploadSuccess={updateLists}
                    />
                    {/*provides a search bar for files*/}
                    <SearchBar
                        paths={[
                            'Eq2IDInbEQB5nI5Ar6Vj',
                            'ti7yNByDOzarVXoujOog/records',
                        ]}
                    />
                </div>

                <div className={styles.files}>
                    <div className={styles.fileSection}>
                        {/*displays department, inbox files*/}
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
                {/*integrates AI tool*/}
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
