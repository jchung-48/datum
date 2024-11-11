"use client";
import React from "react";
import { useState, useEffect } from "react";
import { sendVerificationCode, verifyAndUpdatePhoneNumber } from "../authentication";

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

  const handleVerificationCode = async () => {
    const verId = await sendVerificationCode(phoneNumber);
    if (verId) {
      setVerificationId(verId);
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
      <button onClick={handleVerificationCode}>Send Verification Code</button>
      
      {verificationId && (
        <>
          <input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <button onClick={() => verifyAndUpdatePhoneNumber(verificationCode,verificationId)}>Verify and Update</button>
        </>
      )}
      
      <div id="recaptcha-container"></div>
      {errorMessage && <p style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
    </div>
  );
};

export default Page;