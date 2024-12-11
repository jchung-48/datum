'use client';

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

    // hardcoded ids of firebase collections
    const COMPANYID = 'mh3VZ5IrZjubXUCZL381';
    const DEPARTMENTID = 'KZm56fUOuTobsTRCfknJ';

    // tracks changes to file lists to trigger re-rendering
    const [fileListUpdated, setFileListUpdated] = useState(false);

    // toggles state to refresh file lists when files are added/removed
    const updateLists = () => {
        setFileListUpdated(prev => !prev)
    }

    // path for customs files in firebase
    const customsFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'customsFiles',
    ] as [string, ...string[]];

    // path for financial files in firebase
    const financialFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'financialFiles',
    ] as [string, ...string[]];

    // path for transportation files in firebase
    const transportationFilesPath = [
        'Company',
        COMPANYID,
        'Departments',
        DEPARTMENTID,
        'transportationFiles',
    ] as [string, ...string[]];

    return (
        <div className={styles.page}>
            {/*renders the department header*/}
            <Header department="Logistics" isProfile={false} />
            <div className={styles.body}>
                <div className={styles.topComponentContainer}>
                    {/*uploads files to designated collection and updates*/}
                    <UploadComponent
                        companyId={COMPANYID}
                        departmentId={DEPARTMENTID}
                        departmentName="Logistics"
                        collections={[
                            'transportationFiles',
                            'customsFiles',
                            'financialFiles',
                        ]}
                        onUploadSuccess={updateLists}
                    />
                    <div className={styles.search}>
                        {/*provides a search bar for files*/}
                        <SearchBar paths={['KZm56fUOuTobsTRCfknJ']} />
                    </div>
                </div>
                
                <div className={styles.files}>
                    {/*displays transportation, customs, and financial files*/}
                    <FileTitle title="Transportation Files" />
                    <FileList
                        collectionPath={transportationFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                    <FileTitle title="Customs Files" />
                    <FileList
                        collectionPath={customsFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                    <FileTitle title="Financial Files" />
                    <FileList
                        collectionPath={financialFilesPath}
                        title=""
                        refreshTrigger={fileListUpdated}
                        enableShare={true}
                        onListUpdate={updateLists}
                    />
                </div>

                {/*integrates AI tool*/}
                <div className={styles.aiFeatures}>
                    <AIButton paths={['KZm56fUOuTobsTRCfknJ']} />
                </div>
            </div>
        </div>
    );
};

export default LogisticsDepartment;
