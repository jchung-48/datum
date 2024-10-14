import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getStorage, ref, uploadBytes, getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

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