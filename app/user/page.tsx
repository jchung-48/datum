"use client";
// page.tsx
import { useState } from "react";
import { createUser } from "../authentication"; // Import your updated createUser function

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState(""); // Changed to single value for now
  const [role, setRole] = useState("");

  const handleSignUp = async () => {
    console.log("Department:", department); // Check if department is properly set

    try {
      const additionalData = {
        name,
        phone,
        departments: department, // Ensure this matches your Firestore schema
        role,
      };

      await createUser(email, password, additionalData);
      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:"); // Log the error message
      alert("Error creating user: ");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create New Employee</h2>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)} // Make sure this is being set correctly
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>
      <button onClick={handleSignUp}>Create Employee</button>
    </div>
  );
};

export default Page;
