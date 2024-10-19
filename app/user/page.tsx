"use client";
import { useState } from "react";
import { createUser, signInUser } from "../authentication"; // Import the sign-in function

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [departments, setDepartments] = useState("");
  const [role, setRole] = useState("");
  const [isSignUp, setIsSignUp] = useState(true); // Track whether the user is signing up or signing in

  const handleSignUp = async () => {
    try {
      const additionalData = {
        name,
        phone,
        departments, // Changed to plural as required
        role,
      };
      await createUser(email, password, additionalData);
      alert("User created successfully!");
    } catch (error) {
      alert("Error creating user: ");
    }
  };

  const handleSignIn = async () => {
    try {
      await signInUser(email, password);
      alert("User signed in successfully!");
    } catch (error) {
      alert("Error signing in: ");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{isSignUp ? "Create New Employee" : "Sign In"}</h2>
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

      {isSignUp && (
        <>
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
              placeholder="Departments"
              value={departments}
              onChange={(e) => setDepartments(e.target.value)}
              style={{ marginRight: "10px" }}
            />
            <input
              type="text"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </>
      )}

      <button onClick={isSignUp ? handleSignUp : handleSignIn}>
        {isSignUp ? "Create Employee" : "Sign In"}
      </button>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Switch to Sign In" : "Switch to Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Page;
