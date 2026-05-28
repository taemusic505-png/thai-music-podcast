import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertCircle, BookOpen, Users, Calendar } from 'lucide-react';

export default function ClassroomManager() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('sheetUrl') || '');
  const [attendanceData, setAttendanceData] = useState([]);
  const [assignmentData, setAssignmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(!sheetUrl);
  const [formData, setFormData] = useState({ name: '', subject: '', status: 'present' });

  // ฟังก์ชัน Fetch ข้อมูลจาก Google Sheets API
  const fetchSheetData = async (sheetId, sheetName) => {
    try {
      setLoading(true);
      // ใช้ Google Sheets API v4 อย่างง่าย
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=YOUR_API_KEY`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลได้');
      
      const data = await response.json();
      const rows = data.values || [];
      
      // แปลง Array เป็น Object ตามชื่อคอลัมน์
      const headers = rows[0];
      const formatted = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });
      
      return formatted;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อ URL เปลี่ยน
  useEffect(() => {
    if (sheetUrl && !showSetup) {
      const sheetId = extractSheetId(sheetUrl);
      if (sheetId) {
        loadAllData(sheetId);
      }
    }
  }, [sheetUrl, showSetup]);

  const extractSheetId = (url) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const loadAllData = async (sheetId) => {
    const attendance = await fetchSheetData(sheetId, 'Attendance');
    const assignments = await fetchSheetData(sheetId, 'Assignments');
    
    setAttendanceData(attendance);
    setAssignmentData(assignments);
  };

  const handleSetupSheet = (e) => {
    e.preventDefault();
    if (sheetUrl) {
      localStorage.setItem('sheetUrl', sheetUrl);
      setShowSetup(false);
    }
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    // เพิ่มแถวใหม่ไป Google Sheets
    console.log('Add attendance:', formData);
    setFormData({ name: '', subject: '', status: 'present' });
  };

  // สถิติการเข้าเรียน
  const getAttendanceStats = () => {
    const present = attendanceData.filter(d => d.Status === 'present').length;
    const absent = attendanceData.filter(d => d.Status === 'absent').length;
    const late = attendanceData.filter(d => d.Status === 'late').length;
    
    return [
      { name: 'มาเรียน', value: present, fill: '#10b981' },
      { name: 'ขาด', value: absent, fill: '#ef4444' },
      { name: 'มาสาย', value: late, fill: '#f59e0b' }
    ];
  };

  // สถิติงาน
  const getAssignmentStats = () => {
    const completed = assignmentData.filter(d => d.Status === 'completed').length;
    const pending = assignmentData.filter(d => d.Status === 'pending').length;
    const overdue = assignmentData.filter(d => d.Status === 'overdue').length;
    
    return [
      { name: 'เสร็จแล้ว', value: completed, fill: '#10b981' },
      { name: 'อยู่ระหว่าง', value: pending, fill: '#3b82f6' },
      { name: 'เกินกำหนด', value: overdue, fill: '#ef4444' }
    ];
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">📚 ระบบจัดการชั้นเรียน</h1>
          <p className="text-gray-600 mb-6">เชื่อมต่อกับ Google Sheets ของคุณ</p>
          
          <form onSubmit={handleSetupSheet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL ของ Google Sheet
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ แชร์ Sheet เป็น "ใครก็ได้ดูได้" ก่อน
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition"
            >
              เชื่อมต่อ
            </button>
          </form>

          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📋 สร้าง Google Sheet ดังนี้:</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li><strong>Sheet 1: "Attendance"</strong><br/>
                {'{Name, Subject, Date, Status}'}
              </li>
              <li><strong>Sheet 2: "Assignments"</strong><br/>
                {'{Name, Subject, Assignment, DueDate, Status}'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">📚 ระบบจัดการชั้นเรียน</h1>
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ⚙️ ตั้งค่า
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Calendar size={20} /> ตรวจสอบการเข้าเรียน
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={20} /> ตรวจสอบงาน
          </button>
        </div>

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Add Attendance Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">➕ เพิ่มการเข้าเรียน</h2>
              <form onSubmit={handleAddAttendance} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="ชื่อนักเรียน"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="วิชา"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="present">มาเรียน</option>
                  <option value="absent">ขาด</option>
                  <option value="late">มาสาย</option>
                </select>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                >
                  บันทึก
                </button>
              </form>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getAttendanceStats().map(stat => (
                <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{stat.name}</p>
                      <p className="text-3xl font-bold" style={{color: stat.fill}}>{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full" style={{backgroundColor: stat.fill, opacity: 0.2}}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">📝 รายการเข้าเรียน</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วิชา</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วันที่</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceData.length > 0 ? (
                      attendanceData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{row.Name || '-'}</td>
                          <td className="px-6 py-4 text-sm">{row.Subject || '-'}</td>
                          <td className="px-6 py-4 text-sm">{row.Date || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              row.Status === 'present' ? 'bg-green-100 text-green-800' :
                              row.Status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {row.Status === 'present' ? '✓ มาเรียน' : 
                               row.Status === 'absent' ? '✗ ขาด' : 
                               '⏰ มาสาย'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          ยังไม่มีข้อมูล - กรุณาตั้งค่า Google Sheet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Assignment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getAssignmentStats().map(stat => (
                <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">{stat.name}</p>
                      <p className="text-3xl font-bold" style={{color: stat.fill}}>{stat.value}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full" style={{backgroundColor: stat.fill, opacity: 0.2}}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Assignment List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">📖 รายการงาน</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ชื่อ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">วิชา</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">งาน</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">กำหนดส่ง</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assignmentData.length > 0 ? (
                      assignmentData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{row.Name || '-'}</td>
                          <td className="px-6 py-4 text-sm">{row.Subject || '-'}</td>
                          <td className="px-6 py-4 text-sm">{row.Assignment || '-'}</td>
                          <td className="px-6 py-4 text-sm">{row.DueDate || '-'}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                              row.Status === 'completed' ? 'bg-green-100 text-green-800' :
                              row.Status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {row.Status === 'completed' ? <CheckCircle size={14} /> : 
                               row.Status === 'overdue' ? <AlertCircle size={14} /> : '⏳'}
                              {row.Status === 'completed' ? 'เสร็จแล้ว' : 
                               row.Status === 'overdue' ? 'เกินกำหนด' : 
                               'อยู่ระหว่าง'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          ยังไม่มีข้อมูล - กรุณาตั้งค่า Google Sheet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>🎓 ระบบจัดการชั้นเรียนฟรี - ใช้งาน Google Sheets เป็นฐานข้อมูล</p>
        </div>
      </footer>
    </div>
  );
}
