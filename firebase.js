import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";


import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


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

// Initialize Firestore
const db = getFirestore(app);



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


// Add a company to Firestore
async function addCompany(companyId, companyData) {
    await setDoc(doc(db, "companies", companyId), companyData);
}

// Example usage
addCompany("uuid-12345", {
    name: "Supply Chain Inc.",
    email: "info@supplychain.com",
    website: "www.supplychain.com",
    phone: "+1234567890",
    address: "1234 Main St, City, Country"
});

async function addDepartment(companyId, departmentId, departmentData) {
    await setDoc(doc(db, `companies/${companyId}/departments`, departmentId), departmentData);
}

// Example usage
addDepartment("uuid-12345", "dept-001", {
    name: "Logistics",
    manager: "John Doe",
    description: "Responsible for transportation and warehousing",
    employees: ["emp1", "emp2"]  // You can use employee IDs here
});

async function addEmployee(companyId, employeeId, employeeData) {
    await setDoc(doc(db, `companies/${companyId}/employees`, employeeId), employeeData);
}

// Example usage
addEmployee("uuid-12345", "emp1", {
    name: "Alice Johnson",
    phone: "+1122334455",
    email: "alice@company.com",
    role: "Manager",
    joinDate: "2024-01-01",
    department: "Logistics"
});

async function addBuyer(buyerId, buyerData) {
    await setDoc(doc(db, "buyers", buyerId), buyerData);
}

// Example usage
addBuyer("buyer-001", {
    company: "Retail Corp",
    industry: "Retail",
    contacts: {
        email: "contact@retailcorp.com",
        phone: "+9876543210",
        role: "Procurement Officer"
    },
    quotes: [
        { product: "10000 golf carts", price: "$100000" }
    ]
});

async function addManufacturer(manufacturerId, manufacturerData) {
    await setDoc(doc(db, "manufacturers", manufacturerId), manufacturerData);
}

// Example usage
addManufacturer("mfg-001", {
    companyName: "Golf Cart Suppliers",
    industry: "Manufacturing",
    contacts: {
        email: "contact@golfcartsuppliers.com",
        phone: "+1234567890"
    },
    productCatalog: [
        { description: "Golf Cart Model A", metadata: "Color: Red, Electric: Yes" },
        { description: "Golf Cart Model B", metadata: "Color: Blue, Gas-powered: Yes" }
    ]
});

