"use client";
import React from "react";
import { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithCredential, PhoneAuthProvider, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

interface Window {
  recaptchaVerifier: import("firebase/auth").RecaptchaVerifier;
}

const Page = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(""); // Clear error message after 3 seconds
      }, 5000);

      return () => clearTimeout(timer); // Cleanup timeout if component unmounts or error changes
    }
    return undefined;
  }, [errorMessage]);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setErrorMessage("Please enter a phone number.");
      return;
    }
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container");
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, verifier);
      setVerificationId(verificationId);
    } catch (error) {
      console.error(error);
    }
  };

  const verifyAndUpdatePhoneNumber = async () => {
    if (!verificationCode || !verificationId) {
      setErrorMessage("Enter OTP!");
    }
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
    }  catch (error) {
      console.error("Error verifying OTP:", error);
      setErrorMessage("Failed to verify OTP. Please try again.");
    }
  };

  return (
    <div>
      <h1>Update Phone Number</h1>
      <input
        type="text"
        placeholder="New Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button onClick={sendVerificationCode}>Send Verification Code</button>
      
      {verificationId && (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={verifyAndUpdatePhoneNumber}>Verify and Update</button>
        </>
      )}
      
      <div id="recaptcha-container"></div>
      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
    </div>
  );
};

export default Page;