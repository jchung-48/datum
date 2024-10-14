import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
apiKey: "AIzaSyCIg5BlkNSuxBgdnxgshvF2Lq9D75sNP4o",
authDomain: "datum-115a.firebaseapp.com",
projectId: "datum-115a",
storageBucket: "datum-115a.appspot.com",
messagingSenderId: "676156721682",
appId: "1:676156721682:web:7c37c624c2a074651e66cb",
measurementId: "G-BZW74VCDEQ"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);


//-----------------------------Upload image to firebase storage-----------------------------//
async function uploadImage(){
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if(file){
        const storageRef = ref(storage, '/' + file.name);
        await uploadBytes(storageRef, file);
        
    }
}

const uploadButton = document.getElementById('uploadButton');
uploadButton.addEventListener('click', uploadImage);


//-----------------------------Display, download, & delete items in firebase storage-----------------------------//

async function listFiles(){
    const listRef = ref(storage,'/');

    try {
        const res = await listAll(listRef);
        const fileListElement = document.getElementById('file-list');
        fileListElement.innerHTML = ''; //reset the list

        for (const itemRef of res.items){
            const itemURL = await getDownloadURL(itemRef);
            const listElement = document.createElement('li');
            const linkElement = document.createElement('a');
            const deleteButton = document.createElement('button');

            linkElement.href = itemURL;
            linkElement.textContent = itemRef.name;

            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', async () => {
                await deleteFile(itemRef.fullPath);
                listFiles(); // Refresh the list after deletion
            });

            listElement.appendChild(linkElement);
            listElement.appendChild(deleteButton);
            fileListElement.appendChild(listElement);
        }
    } catch (error){
        console.error("Error listing files", error);
    }
}

async function deleteFile(fileName){
    const fileRef = ref(storage, fileName);
    await deleteObject(fileRef);
}

window.addEventListener('load', listFiles);




