import React, { useState } from "react";
import Webcam from "react-webcam";
import { get, set, clear } from "idb-keyval";

const RegisterForm = () => {
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [capturedImages, setCapturedImages] = useState([]);
  const [loading, setLoading] = useState(false); // New state for loading
  const webcamRef = React.useRef(null);

  const capturePhoto = () => {
    if (capturedImages.length >= 10) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImages([...capturedImages, imageSrc]);
  };

  const handleSubmit = async () => {
    if (name === "" || id === "" || capturedImages.length < 5) {
      alert("Please fill all fields and capture at least 5 images!");
      return;
    }

    // Check for existing student
    const existingStudents = (await get("CS1students")) || [];
    if (existingStudents.some((student) => student.id === id)) {
      alert("Student ID already exists!");
      return;
    }

    // Add new student to IndexedDB
    const newStudent = { id, name };
    const updatedStudents = [...existingStudents, newStudent];
    await set("CS1students", updatedStudents);

    // Start loading state
    setLoading(true);

    try {
      const response = await fetch("https://localhost/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id, images: capturedImages }),
      });

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Error registering student:", error);
      alert("Registration failed!");
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white max-w-3xl mx-auto rounded-lg shadow-md m-8 flex flex-col items-center justify-center w-full">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-8">Register Student</h2>

      <div className="w-full max-w-md space-y-6">
        {/* Name Input */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-lg font-semibold text-gray-700">Full Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your full name"
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Student ID Input */}
        <div className="space-y-2">
          <label htmlFor="student-id" className="text-lg font-semibold text-gray-700">Student ID</label>
          <input
            type="text"
            id="student-id"
            placeholder="Enter your student ID"
            className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>

        {/* Webcam Section */}
        <div className="space-y-2">
          <label htmlFor="webcam" className="text-lg font-semibold text-gray-700">Photo</label>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "user",
            }}
            className="w-full max-w-sm border-2 border-gray-300 rounded-lg shadow-md"
          />
          <button
            onClick={capturePhoto}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-all disabled:opacity-50"
            disabled={capturedImages.length >= 10}
          >
            Capture {10 - capturedImages.length} more
          </button>
        </div>

        {/* Captured Images Preview */}
        <div className="flex flex-wrap gap-4 mt-4">
          {capturedImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Capture ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
              onClick={() => {
                setCapturedImages(capturedImages.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>

        {/* Spacing between buttons */}
        <div className="space-y-4">
          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className={`w-full py-3 text-white font-semibold rounded-lg shadow-md transition-all ${
              loading
                ? "bg-[#c05f3c] cursor-not-allowed disabled:opacity-50"
                : "bg-[#c05f3c] hover:bg-[#a14d34]"
            }`}
            disabled={capturedImages.length < 5 || loading}
          >
            {loading ? "Please wait..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
