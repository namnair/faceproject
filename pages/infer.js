import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { get, set } from "idb-keyval";

const FaceRecognition = () => {
    const [deviceId, setDeviceId] = useState({});
    const [devices, setDevices] = useState([]);
    const [className, setClassName] = useState("CS1");
    const [teacherName, setTeacherName] = useState("");
    const [subject, setSubject] = useState("");
    const [finalSubjectName, setFinalSubjectName] = useState("");
    const [isStarted, setIsStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [students, setStudents] = useState({});

    const webcamRef = useRef(null);

    const handleDevices = useCallback(
        mediaDevices =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(
        () => {
            navigator.mediaDevices.enumerateDevices().then(handleDevices);
        },
        [handleDevices]
    );

    useEffect(() => {
        let interval;
        if (isStarted) {
            interval = setInterval(() => {
                if (!fetching) captureAndIdentify();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isStarted, fetching]);

    const captureAndIdentify = async () => {
        if (fetching || !webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        await sendToServer(imageSrc);
    };

    const sendToServer = async (imageSrc) => {
        if (!imageSrc || fetching) return;

        setFetching(true);
        setLoading(true);

        try {
            const response = await fetch("https://localhost/infer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageSrc }),
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            if (Array.isArray(data)) {
                updateStudentRecords(data);
            }
        } catch (error) {
            console.error("Error sending image:", error);
        } finally {
            setFetching(false);
            setLoading(false);
        }
    };

    const updateStudentRecords = (data) => {
        setStudents((prevStudents) => {
            const updatedStudents = { ...prevStudents };

            data.forEach(({ name, student_id, emotion }) => {
                if (name && student_id) {
                    const timestamp = new Date().toISOString();

                    if (!updatedStudents[student_id]) {
                        updatedStudents[student_id] = {
                            name,
                            count: 1,
                            emotionHistory: [{ emotion, timestamp }],
                            markedPresent: false,
                        };
                    } else {
                        // Increase count
                        updatedStudents[student_id].count += 1;

                        // Add to emotion history if timestamp is unique
                        if (
                            !updatedStudents[student_id].emotionHistory.some(
                                (e) => e.timestamp === timestamp
                            )
                        ) {
                            updatedStudents[student_id].emotionHistory.push({
                                emotion,
                                timestamp,
                            });
                        }

                        // ✅ Update markedPresent in real-time
                        updatedStudents[student_id].markedPresent =
                            updatedStudents[student_id].count > 4;
                    }
                }
            });

            console.log("Updated students:", updatedStudents); // ✅ Debug log
            return updatedStudents;
        });
    };

    const handleStop = async () => {
        setIsStarted(false);

        setStudents((prevStudents) => {
            const updatedStudents = { ...prevStudents };

            for (const id in updatedStudents) {
                // ✅ Mark as present if count exceeds 4
                updatedStudents[id].markedPresent =
                    updatedStudents[id].count > 4;
            }

            console.log("Final attendance:", updatedStudents); // ✅ Debug log
            return updatedStudents;
        });

        // Save data after marking attendance
        await resolveSubjectName();
    };


    const resolveSubjectName = async () => {
        if (!subject) return;

        let subjects = (await get("subjects")) || [];

        // Handle duplicates by adding a number suffix
        let newSubjectName = subject;
        let count = 1;
        while (subjects.includes(newSubjectName)) {
            count++;
            newSubjectName = `${subject}${count}`;
        }

        // Add to subjects list and update state
        subjects.push(newSubjectName);
        await set("subjects", subjects);

        setFinalSubjectName(newSubjectName);
        await saveAttendanceData(newSubjectName);
    };

    const saveAttendanceData = async (subjectName) => {
        const attendanceData = Object.entries(students).map(
            ([id, { name, count, markedPresent, emotionHistory }]) => ({
                student_id: id,
                name,
                class: className,
                teacher: teacherName,
                subject: subjectName,
                present: markedPresent,
                emotions: emotionHistory,
            })
        );

        try {
            await set(`attendance_${subjectName}`, attendanceData);
            console.log(`Attendance data saved under: ${subjectName}`);
        } catch (error) {
            console.error("Failed to save attendance data:", error);
        }
    };

    const loadAttendanceData = async () => {
        try {
            const data = await get(`attendance_${finalSubjectName}`);
            console.log("Loaded data:", data);
        } catch (error) {
            console.error("Failed to load attendance data:", error);
        }
    };

    return (
        <div className="flex flex-col items-center p-6 space-y-4 bg-[#eeece2] h-dvh">
            <h1 className="text-xl font-extrabold">Face Recognition Attendance</h1>
            <div className="flex space-x-4">
                <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="border p-2 rounded font-extrabold"
                >
                    <option value="CS1">CS1</option>
                </select>
                <select
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="border p-2 rounded font-extrabold"
                >
                    <option value="">Select Camera</option>
                    {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Device ${device.deviceId}`}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Teacher Name"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="border p-2 rounded font-extrabold"
                />
                <input
                    type="text"
                    placeholder="Subject Name"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="border p-2 rounded font-extrabold"
                />
                <button
                    disabled={!teacherName || !subject}
                    onClick={() =>
                        isStarted ? handleStop() : setIsStarted(true)
                    }
                    className={`px-4 py-2 text-white rounded-lg shadow-md font-extrabold ${isStarted
                        ? "bg-[#c05f3c] hover:bg-[#a14d34]"
                        : "bg-[#c05f3c] hover:bg-[#a14d34]"
                        } ${!teacherName || !subject ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isStarted ? "Stop" : "Start"}
                </button>
            </div>
            {isStarted && (
                <>
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                            deviceId: deviceId,
                            facingMode: "user",
                        }}
                        className="w-full max-w-xl border-2 border-gray-300 rounded-lg shadow-md"
                    />
                    <p className={`transition-opacity font-extrabold text-gray-800 ${loading ? "opacity-100" : "opacity-0"}`}>
                        Taking photo...
                    </p>
                    <table className="mt-4 w-full max-w-xl border-collapse border border-gray-400">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border px-4 py-2 font-extrabold">Student ID</th>
                                <th className="border px-4 py-2 font-extrabold">Name</th>
                                <th className="border px-4 py-2 font-extrabold">Present</th>
                                <th className="border px-4 py-2 font-extrabold">Emotions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(students).map(([id, student]) => (
                                <tr key={id}>
                                    <td className="border px-4 py-2 font-extrabold">{id}</td>
                                    <td className="border px-4 py-2 font-extrabold">{student.name}</td>
                                    <td className="border px-4 py-2 font-extrabold">{student.markedPresent ? "✅" : "❌"}</td>
                                    <td className="border px-4 py-2 font-extrabold">{student.emotionHistory.map(e => `${e.emotion} (${new Date(e.timestamp).toLocaleTimeString()})`).join(", ")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default FaceRecognition;
