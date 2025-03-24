"use client";

import { useEffect, useState } from "react";
import { get } from "idb-keyval";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const emotionMap = {
    angry: { value: -3, emoji: "😠" },
    disgust: { value: -2, emoji: "🤢" },
    sad: { value: -1, emoji: "😢" },
    fear: { value: 0, emoji: "😨" },
    neutral: { value: 1, emoji: "😐" },
    surprise: { value: 2, emoji: "😲" },
    happy: { value: 3, emoji: "😃" },
};

export default function Attendance() {
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [presentStudents, setPresentStudents] = useState([]);
    const [absentStudents, setAbsentStudents] = useState([]);
    const [selectedStudentData, setSelectedStudentData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedSubjects = await get("subjects");
                const storedStudents = await get("CS1students");

                if (storedSubjects) setSubjects(storedSubjects);

                if (storedStudents) {
                    const mappedStudents = storedStudents.map((student) => ({
                        student_id: student.id,
                        name: student.name,
                    }));
                    setStudents(mappedStudents);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        fetchData();
    }, []);

    const handleSubjectChange = async (subject) => {
        setSelectedSubject(subject);

        if (subject) {
            try {
                const attendanceData = await get(`attendance_${subject}`);
                console.log("Attendance Data:", attendanceData);

                const presentIds = attendanceData
                    .filter((entry) => entry.present)
                    .map((entry) => entry.student_id);

                const present = students.filter((student) =>
                    presentIds.includes(student.student_id)
                );
                const absent = students.filter(
                    (student) => !presentIds.includes(student.student_id)
                );

                setPresentStudents(present);
                setAbsentStudents(absent);
            } catch (error) {
                console.error(`Failed to fetch attendance for ${subject}:`, error);
            }
        }
    };

    const handleSeeEmotions = async (studentId) => {
        try {
            const attendanceData = await get(`attendance_${selectedSubject}`);
            const studentData = attendanceData.find(
                (entry) => entry.student_id === studentId
            );

            if (studentData) {
                const emotionData = studentData.emotions.map((e) => ({
                    time: new Date(e.timestamp).toLocaleTimeString(),
                    emotion: emotionMap[e.emotion]?.value || 0,
                    emoji: emotionMap[e.emotion]?.emoji || "❓",
                }));

                setSelectedStudentData({ ...studentData, emotionData });
            }
        } catch (error) {
            console.error("Failed to load emotions:", error);
        }
    };

    const handleCloseModal = () => {
        setSelectedStudentData(null);
    };

    const handleContactParents = (studentId) => {
        console.log(`Contact parents for ${studentId}`);
    };

    return (
        <div className="p-4 max-w-3xl mx-auto bg-[#eeece2] h-dvh">
            {/* Subject Dropdown */}
            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                    Select Subject
                </label>
                <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="mt-1 font-semibold block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="" disabled>
                        Select a subject
                    </option>
                    {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                            {subject}
                        </option>
                    ))}
                </select>
            </div>

            {/* Present Students Table */}
            <div className="mb-8 bg-[#eeece2]">
                <h2 className="text-lg font-semibold mb-2">✅ Present Students</h2>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 font-semibold">Name</th>
                            <th className="border border-gray-300 p-2 font-semibold">ID</th>
                            <th className="border border-gray-300 p-2 font-semibold">Present</th>
                            <th className="border border-gray-300 p-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {presentStudents.map((student) => (
                            <tr key={student.student_id} className="text-center">
                                <td className="border border-gray-300 p-2 font-semibold">{student.name}</td>
                                <td className="border border-gray-300 p-2 font-semibold">{student.student_id}</td>
                                <td className="border border-gray-300 p-2 font-semibold">✅</td>
                                <td className="border border-gray-300 p-2">
                                    <button
                                        onClick={() => handleSeeEmotions(student.student_id)}
                                        className="bg-[#c05f3c] hover:bg-[#a14d34] text-sm font-semibold text-white px-3 py-1 rounded-md"
                                    >
                                        See Emotions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Absent Students Table */}
            <div className="mb-8 bg-[#eeece2]">
                <h2 className="text-lg font-semibold mb-2">❌ Absent Students</h2>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 font-semibold">Name</th>
                            <th className="border border-gray-300 p-2 font-semibold">ID</th>
                            <th className="border border-gray-300 p-2 font-semibold">Present</th>
                            <th className="border border-gray-300 p-2 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {absentStudents.map((student) => (
                            <tr key={student.student_id} className="text-center">
                                <td className="border border-gray-300 p-2 font-semibold">{student.name}</td>
                                <td className="border border-gray-300 p-2 font-semibold">{student.student_id}</td>
                                <td className="border border-gray-300 p-2 font-semibold">❌</td>
                                <td className="border border-gray-300 p-2">
                                    <button
                                        onClick={() => handleContactParents(student.student_id)}
                                        disabled
                                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded-md opacity-50"
                                    >
                                        Contact Parents
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Emotion Graph Modal */}
            {selectedStudentData && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
                    <div className="bg-[#eeece2] p-8 rounded-lg shadow-lg w-full max-w-lg flex flex-col items-center">
                        <h2 className="text-lg font-semibold mb-2 text-center">
                            {selectedStudentData.name}'s Emotions During Class
                        </h2>

                        <LineChart width={400} height={200} data={selectedStudentData.emotionData}>
                            <CartesianGrid stroke="#ccc" />

                            {/* X-Axis (timestamps) */}
                            <XAxis dataKey="time" />

                            {/* Y-Axis (only show defined emotion values) */}
                            <YAxis
                                domain={[-3, 3]} // Restrict to defined emotion values
                                ticks={Object.values(emotionMap).map(e => e.value)} // Only show defined ticks
                                tickFormatter={(value) => {
                                    const emotion = Object.values(emotionMap).find(e => e.value === value);
                                    return emotion ? emotion.emoji : "";
                                }}
                            />

                            {/* Tooltip (show emoji instead of raw value) */}
                            <Tooltip
                                formatter={(value) => {
                                    const emotion = Object.values(emotionMap).find(e => e.value === value);
                                    return emotion ? `${emotion.emoji}` : value;
                                }}
                            />

                            {/* Line Data */}
                            <Line
                                type="monotone"
                                dataKey="emotion"
                                stroke="#8884d8"
                                dot={{ stroke: "#8884d8", strokeWidth: 2 }}
                            />
                        </LineChart>


                        <button
                            onClick={handleCloseModal}
                            className="mt-4 bg-[#c05f3c] hover:bg-[#a14d34] text-white px-6 py-2 rounded-full font-semibold text-center self-center"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
