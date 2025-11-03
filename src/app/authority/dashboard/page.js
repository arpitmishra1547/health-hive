"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import Sidebar from "@/components/authority/Sidebar"
import StatCard from "@/components/authority/StatCard"
const CalendarView = dynamic(() => import("@/components/authority/CalendarView"), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading calendar...</div>
})
import { motion } from "framer-motion"
import { 
  Users2, Stethoscope, Activity, BedDouble, AlertTriangle, Gauge, TrendingUp, Plus, Trash2, Filter, RefreshCw,
  Building2, Clock, Calendar, MapPin, Edit, Save, X, UserPlus, Settings, Eye, ArrowRight, ArrowLeft
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Legend, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDateUTC } from "@/lib/format"

const COLORS = ["#007bff", "#28a745", "#10b981", "#60a5fa", "#34d399", "#f59e0b"]

function AuthorityDashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [opdRooms, setOpdRooms] = useState([])
  const [schedules, setSchedules] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientHistory, setPatientHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [showAddDepartment, setShowAddDepartment] = useState(false)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [calendarView, setCalendarView] = useState("list") // list, calendar
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    department: "",
    specialization: "",
    contact: ""
  })
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    headDoctor: ""
  })
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    departmentId: "",
    departmentName: ""
  })
  const [newSchedule, setNewSchedule] = useState({
    roomId: "",
    doctorId: "",
    date: "",
    startTime: "",
    endTime: "",
    isRecurring: false,
    recurringPattern: { type: "daily", interval: 1, endDate: "" },
    notes: ""
  })

  const departmentOptions = [
    'Cardiology', 'Dermatology', 'Orthopedics', 'General Medicine', 
    'Pediatrics', 'Neurology', 'Gynecology', 'Psychiatry'
  ]

  const fetchDoctors = useCallback(async (department = "") => {
    setLoading(true)
    try {
      const url = department ? `/api/doctors?department=${encodeURIComponent(department)}` : '/api/doctors'
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setDoctors(data.doctors)
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      if (data.success) {
        setDepartments(data.departments)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }, [])

  const fetchOpdRooms = useCallback(async (departmentId = "") => {
    try {
      const url = departmentId ? `/api/opd-rooms?departmentId=${encodeURIComponent(departmentId)}` : '/api/opd-rooms'
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setOpdRooms(data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch OPD rooms:', error)
    }
  }, [])

  const fetchSchedules = useCallback(async (date = selectedDate) => {
    try {
      const url = `/api/schedules?date=${date}`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setSchedules(data.schedules)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    }
  }, [selectedDate])

  const fetchAllPatients = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/patients')
      const data = await response.json()
      if (data.success) {
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPatientHistory = useCallback(async (patientId) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/history?patientId=${patientId}`)
      const data = await response.json()
      if (data.success) {
        setPatientHistory(data.prescriptions || [])
      }
    } catch (error) {
      console.error('Failed to fetch patient history:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addDoctor = async () => {
    if (!newDoctor.name || !newDoctor.department) {
      alert('Name and department are required')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...newDoctor
        })
      })
      const data = await response.json()
      console.log('Add doctor response:', data)
      if (data.success) {
        setNewDoctor({ name: "", department: "", specialization: "", contact: "" })
        setShowAddDoctor(false)
        fetchDoctors(selectedDepartment)
        alert('Doctor added successfully!')
      } else {
        alert(data.message || data.error || 'Failed to add doctor')
      }
    } catch (error) {
      console.error('Failed to add doctor:', error)
      alert('Failed to add doctor')
    } finally {
      setLoading(false)
    }
  }

  const removeDoctor = async (doctorId) => {
    if (!confirm('Are you sure you want to remove this doctor?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          doctorId
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchDoctors(selectedDepartment)
        alert('Doctor removed successfully!')
      } else {
        alert(data.message || 'Failed to remove doctor')
      }
    } catch (error) {
      console.error('Failed to remove doctor:', error)
      alert('Failed to remove doctor')
    } finally {
      setLoading(false)
    }
  }

  const seedTestDoctors = async () => {
    if (!confirm('Add test doctors for demo purposes?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      })
      const data = await response.json()
      if (data.success) {
        fetchDoctors(selectedDepartment)
        alert(`Added ${data.added} test doctors!`)
      } else {
        alert(data.message || 'Failed to seed doctors')
      }
    } catch (error) {
      console.error('Failed to seed doctors:', error)
      alert('Failed to seed doctors')
    } finally {
      setLoading(false)
    }
  }

  // Department Management Functions
  const addDepartment = async () => {
    if (!newDepartment.name) {
      alert('Department name is required')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...newDepartment
        })
      })
      const data = await response.json()
      if (data.success) {
        setNewDepartment({ name: "", description: "", headDoctor: "" })
        setShowAddDepartment(false)
        fetchDepartments()
        alert('Department added successfully!')
      } else {
        alert(data.message || 'Failed to add department')
      }
    } catch (error) {
      console.error('Failed to add department:', error)
      alert('Failed to add department')
    } finally {
      setLoading(false)
    }
  }

  const removeDepartment = async (departmentId) => {
    if (!confirm('Are you sure you want to remove this department?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          departmentId
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchDepartments()
        alert('Department removed successfully!')
      } else {
        alert(data.message || 'Failed to remove department')
      }
    } catch (error) {
      console.error('Failed to remove department:', error)
      alert('Failed to remove department')
    } finally {
      setLoading(false)
    }
  }

  // OPD Room Management Functions
  const addRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.departmentId) {
      alert('Room number and department are required')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/opd-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...newRoom
        })
      })
      const data = await response.json()
      if (data.success) {
        setNewRoom({ roomNumber: "", departmentId: "", departmentName: "" })
        setShowAddRoom(false)
        fetchOpdRooms()
        fetchDepartments()
        alert('OPD Room added successfully!')
      } else {
        alert(data.message || 'Failed to add room')
      }
    } catch (error) {
      console.error('Failed to add room:', error)
      alert('Failed to add room')
    } finally {
      setLoading(false)
    }
  }

  const removeRoom = async (roomId) => {
    if (!confirm('Are you sure you want to remove this room?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/opd-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          roomId
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchOpdRooms()
        alert('Room removed successfully!')
      } else {
        alert(data.message || 'Failed to remove room')
      }
    } catch (error) {
      console.error('Failed to remove room:', error)
      alert('Failed to remove room')
    } finally {
      setLoading(false)
    }
  }

  const assignDoctorToRoom = async (roomId, doctorId, doctorName) => {
    setLoading(true)
    try {
      const response = await fetch('/api/opd-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignDoctor',
          roomId,
          doctorId,
          doctorName
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchOpdRooms()
        alert('Doctor assigned to room successfully!')
      } else {
        alert(data.message || 'Failed to assign doctor')
      }
    } catch (error) {
      console.error('Failed to assign doctor:', error)
      alert('Failed to assign doctor')
    } finally {
      setLoading(false)
    }
  }

  // Schedule Management Functions
  const addSchedule = async () => {
    if (!newSchedule.roomId || !newSchedule.doctorId || !newSchedule.startTime || !newSchedule.endTime) {
      alert('Room, doctor, start time, and end time are required')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          ...newSchedule
        })
      })
      const data = await response.json()
      if (data.success) {
        setNewSchedule({
          roomId: "",
          doctorId: "",
          date: selectedDate,
          startTime: "",
          endTime: "",
          isRecurring: false,
          recurringPattern: { type: "daily", interval: 1, endDate: "" },
          notes: ""
        })
        setShowAddSchedule(false)
        fetchSchedules()
        alert('Schedule added successfully!')
      } else {
        alert(data.message || 'Failed to add schedule')
      }
    } catch (error) {
      console.error('Failed to add schedule:', error)
      alert('Failed to add schedule')
    } finally {
      setLoading(false)
    }
  }

  const removeSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to remove this schedule?')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          scheduleId
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchSchedules()
        alert('Schedule removed successfully!')
      } else {
        alert(data.message || 'Failed to remove schedule')
      }
    } catch (error) {
      console.error('Failed to remove schedule:', error)
      alert('Failed to remove schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    setIsClient(true)
    
    // Initialize with today's date only on client
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().split('T')[0]
      setSelectedDate(today)
      setNewSchedule(prev => ({ ...prev, date: today }))
      
      // Fetch initial data
      fetchDoctors(selectedDepartment)
      fetchDepartments()
      fetchOpdRooms()
      fetchSchedules(today)
      if (activeTab === 'patients') {
        fetchAllPatients()
      }
    }
  }, [])

  useEffect(() => {
    if (isClient && selectedDate) {
      fetchDoctors(selectedDepartment)
      fetchSchedules(selectedDate)
      if (activeTab === 'patients') {
        fetchAllPatients()
      }
    }
  }, [selectedDepartment, activeTab, isClient, fetchDoctors, fetchSchedules, fetchAllPatients, selectedDate])

  useEffect(() => {
    if (isClient && selectedDate) {
      fetchSchedules(selectedDate)
    }
  }, [selectedDate, isClient, fetchSchedules])

  const doctorBySpecialization = useMemo(() => {
    const deptCounts = doctors.reduce((acc, doctor) => {
      acc[doctor.department] = (acc[doctor.department] || 0) + 1
      return acc
    }, {})
    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
  }, [doctors])

  const patientGrowth = useMemo(() => ([
    { month: "Jan", patients: 420 },
    { month: "Feb", patients: 480 },
    { month: "Mar", patients: 520 },
    { month: "Apr", patients: 610 },
    { month: "May", patients: 700 },
    { month: "Jun", patients: 830 },
  ]), [])

  const patientsPerCity = useMemo(() => ([
    { city: "Bhopal", count: 240 },
    { city: "Indore", count: 210 },
    { city: "Delhi", count: 310 },
    { city: "Mumbai", count: 280 },
  ]), [])

  const diseaseDistribution = useMemo(() => ([
    { disease: "Cardio", value: 22 },
    { disease: "Derm", value: 18 },
    { disease: "Neuro", value: 15 },
    { disease: "Ortho", value: 20 },
    { disease: "Pedia", value: 25 },
  ]), [])

  const departmentsLoad = useMemo(() => ([
    { dept: "Cardiology", patients: 48 },
    { dept: "Dermatology", patients: 33 },
    { dept: "Neurology", patients: 27 },
    { dept: "Orthopedics", patients: 41 },
    { dept: "Pediatrics", patients: 56 },
  ]), [])

  const bedStats = { total: 500, occupied: 372 }
  const occupancy = Math.round((bedStats.occupied / bedStats.total) * 100)

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Authority Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-green-50">
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] min-h-screen">
        <Sidebar />
        <main className="p-4 lg:p-8 space-y-4 lg:space-y-8">
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">Authority Dashboard</h1>
              <p className="text-gray-600 mt-1">Smart overview of hospital operations</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-gray-900">
              <StatCard title="Total Patients" value="830" subtitle="↑ 18% vs last month" icon={Users2} color="blue" />
              <StatCard title="Total Doctors" value={doctors.length.toString()} subtitle={`Active ${doctors.filter(d => d.status === 'Active').length}`} icon={Stethoscope} color="green" />
              <StatCard title="Departments" value={departments.length.toString()} subtitle={`${opdRooms.length} OPD Rooms`} icon={Building2} color="purple" />
              <StatCard title="Alerts Today" value="6" subtitle="2 critical" icon={AlertTriangle} color="blue" />
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white/70 backdrop-blur-md rounded-xl p-1 border border-gray-200">
            {[
              { id: "dashboard", label: "Dashboard", icon: Activity },
              { id: "patients", label: "Patients", icon: Users2 },
              { id: "departments", label: "Departments", icon: Building2 },
              { id: "opd-rooms", label: "OPD Rooms", icon: MapPin },
              { id: "scheduling", label: "Scheduling", icon: Calendar },
              { id: "doctors", label: "Doctors", icon: Stethoscope }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Dashboard Tab Content */}
          {activeTab === "dashboard" && (
            <>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-900">Doctors by Specialization</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={doctorBySpecialization} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {doctorBySpecialization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Doctors Management</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.departmentId || dept.name} value={dept.departmentId || dept.name}>{dept.name}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => setShowAddDoctor(!showAddDoctor)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Doctor
                  </Button>
                  <Button
                    onClick={seedTestDoctors}
                    size="sm"
                    variant="outline"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Seed Test
                  </Button>
                </div>
              </div>

              {showAddDoctor && (
                <Card className="mb-4 border border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 text-gray-900">Add New Doctor</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Doctor Name"
                        value={newDoctor.name}
                        onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <select
                        value={newDoctor.department}
                        onChange={(e) => setNewDoctor(prev => ({ ...prev, department: e.target.value, specialization: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.departmentId || dept.name} value={dept.departmentId || dept.name}>{dept.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Specialization (optional)"
                        value={newDoctor.specialization}
                        onChange={(e) => setNewDoctor(prev => ({ ...prev, specialization: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Contact (optional)"
                        value={newDoctor.contact}
                        onChange={(e) => setNewDoctor(prev => ({ ...prev, contact: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={addDoctor}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        Add Doctor
                      </Button>
                      <Button
                        onClick={() => setShowAddDoctor(false)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="min-w-[600px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-700">
                      <th className="py-2">Doctor ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Specialization</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading doctors...
                        </td>
                      </tr>
                    ) : doctors.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500">
                          No doctors found. Add some doctors or seed test data.
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor) => (
                        <tr key={doctor.doctorId} className="hover:bg-gray-50/60 text-gray-900">
                          <td className="py-2 font-mono text-xs text-blue-600">{doctor.doctorId}</td>
                          <td className="font-medium">{doctor.name}</td>
                          <td>{doctor.department}</td>
                          <td>{doctor.specialization}</td>
                          <td>{doctor.contact || '-'}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs ${doctor.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                              {doctor.status}
                            </span>
                          </td>
                          <td>
                            <Button
                              onClick={() => removeDoctor(doctor.doctorId)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="patients" className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 lg:col-span-2">
              <h3 className="font-semibold mb-4 text-gray-900">Patient Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="patients" stroke="#007bff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-900">Disease Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={diseaseDistribution} dataKey="value" nameKey="disease" outerRadius={90}>
                      {diseaseDistribution.map((entry, index) => (
                        <Cell key={`cell2-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section id="resources" className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-900">Beds and Occupancy</h3>
              <div className="grid grid-cols-3 gap-4">
                <StatCard title="Total Beds" value={String(bedStats.total)} icon={BedDouble} />
                <StatCard title="Occupied" value={String(bedStats.occupied)} icon={Activity} />
                <StatCard title="Available" value={String(bedStats.total - bedStats.occupied)} icon={Users2} />
              </div>
              <div className="mt-6">
                <div className="text-sm text-gray-800 mb-2">Occupancy Gauge</div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-4 bg-green-500" style={{ width: `${occupancy}%` }} />
                </div>
                <p className="text-sm text-gray-800 mt-2">{occupancy}% occupied</p>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-900">Departments Load</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentsLoad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dept" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patients" fill="#28a745" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section id="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-900">AI Insights</h3>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                <li>Dermatology cases increasing this week (+8%)</li>
                <li>Highest Cardiology cases in Delhi</li>
                <li>Predicted patient inflow +12% next month</li>
              </ul>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 lg:col-span-2">
              <h3 className="font-semibold mb-4 text-gray-900">Patient Inflow Forecast</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...patientGrowth, { month: "Jul", patients: 910 }, { month: "Aug", patients: 980 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="patients" stroke="#28a745" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="patients" stroke="#007bff" strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

              <section className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900">Real-Time Alerts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { title: "High load in Pediatrics", severity: "critical" },
                    { title: "ICU beds below 10%", severity: "warning" },
                    { title: "Dr. Sharma has 23 cases today", severity: "info" },
                  ].map((n, i) => (
                    <motion.div key={i} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35, delay: i * 0.05 }} className={`rounded-xl p-4 border ${n.severity === "critical" ? "bg-red-50 border-red-200" : n.severity === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                        <p className="font-medium text-gray-800">{n.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Patients Tab Content */}
          {activeTab === "patients" && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Patient Management</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.departmentId || dept.name} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                    <Button
                      onClick={fetchAllPatients}
                      size="sm"
                      variant="outline"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Loading patients...</div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-gray-600">
                      Total Patients: {patients.length} | 
                      {selectedDepartment ? ` ${selectedDepartment} Department: ${patients.filter(p => p.department === selectedDepartment).length}` : ' All Departments'}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Patient ID</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Name</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Age</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Gender</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Department</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Mobile</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Registration Date</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Status</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients
                            .filter(patient => !selectedDepartment || patient.department === selectedDepartment)
                            .map((patient, index) => (
                            <tr key={patient.patientId || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-blue-600 font-medium">{patient.patientId || 'N/A'}</td>
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900">{patient.fullName || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{patient.aadhaarNumber || 'No Aadhaar'}</div>
                              </td>
                              <td className="py-3 px-2">{patient.age || 'N/A'}</td>
                              <td className="py-3 px-2">{patient.gender || 'N/A'}</td>
                              <td className="py-3 px-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {patient.department || 'General'}
                                </span>
                              </td>
                              <td className="py-3 px-2">{patient.mobileNumber || 'N/A'}</td>
                              <td className="py-3 px-2">
                                {patient.registrationDate ? formatDateUTC(patient.registrationDate) : 
                                 patient.createdAt ? formatDateUTC(patient.createdAt) : 'N/A'}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  patient.status === 'Registered' ? 'bg-green-100 text-green-800' :
                                  patient.tokenStatus === 'Token Generated' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {patient.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex space-x-1">
                                  <Button
                                    onClick={() => {
                                      setSelectedPatient(patient)
                                      fetchPatientHistory(patient.patientId)
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {patients.filter(patient => !selectedDepartment || patient.department === selectedDepartment).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {selectedDepartment ? `No patients found in ${selectedDepartment} department` : 'No patients found'}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Patient Details Modal */}
              {selectedPatient && (
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Patient Details - {selectedPatient.fullName}
                    </h3>
                    <Button
                      onClick={() => {
                        setSelectedPatient(null)
                        setPatientHistory([])
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Patient Information */}
                    <div>
                      <h4 className="font-semibold mb-4 text-gray-900">Personal Information</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Patient ID:</span>
                          <span className="font-medium">{selectedPatient.patientId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Full Name:</span>
                          <span className="font-medium">{selectedPatient.fullName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age:</span>
                          <span className="font-medium">{selectedPatient.age || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="font-medium">{selectedPatient.gender || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Blood Group:</span>
                          <span className="font-medium">{selectedPatient.bloodGroup || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mobile:</span>
                          <span className="font-medium">{selectedPatient.mobileNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aadhaar:</span>
                          <span className="font-medium">{selectedPatient.aadhaarNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">{selectedPatient.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Department:</span>
                          <span className="font-medium">{selectedPatient.department || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Token Number:</span>
                          <span className="font-medium">{selectedPatient.tokenNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div>
                      <h4 className="font-semibold mb-4 text-gray-900">Medical History</h4>
                      {loading ? (
                        <div className="text-center py-4 text-gray-500">Loading history...</div>
                      ) : patientHistory.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {patientHistory.map((prescription, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm text-gray-900">
                                  {prescription.doctorName || 'Dr. Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {prescription.createdAt ? formatDateUTC(prescription.createdAt) : 'N/A'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Diagnosis:</strong> {prescription.diagnosis || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Symptoms:</strong> {prescription.symptoms || 'N/A'}
                              </div>
                              {prescription.medicines && prescription.medicines.length > 0 && (
                                <div className="text-sm text-gray-700 mb-2">
                                  <strong>Medicines:</strong>
                                  <ul className="list-disc list-inside mt-1">
                                    {prescription.medicines.map((med, medIndex) => (
                                      <li key={medIndex} className="text-xs">
                                        {med.name} - {med.dosage} for {med.duration}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {prescription.notes && (
                                <div className="text-sm text-gray-700">
                                  <strong>Notes:</strong> {prescription.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No medical history found for this patient
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Management Tab */}
          {activeTab === "departments" && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Department Management</h3>
                  <Button
                    onClick={() => setShowAddDepartment(!showAddDepartment)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </div>

                {showAddDepartment && (
                  <Card className="mb-6 border border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 text-gray-900">Add New Department</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Department Name"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={newDepartment.description}
                          onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Head Doctor (optional)"
                          value={newDepartment.headDoctor}
                          onChange={(e) => setNewDepartment(prev => ({ ...prev, headDoctor: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={addDepartment}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Add Department
                        </Button>
                        <Button
                          onClick={() => setShowAddDepartment(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept, index) => (
                    <Card key={dept.departmentId || `dept-${index}`} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{dept.name || 'Unnamed Department'}</h4>
                            <p className="text-sm text-gray-600">{typeof dept.description === 'string' ? dept.description : 'No description'}</p>
                          </div>
                          <Button
                            onClick={() => removeDepartment(dept.departmentId)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Doctors:</span>
                            <span className="font-medium">{typeof dept.doctorCount === 'number' ? dept.doctorCount : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Patient Load:</span>
                            <span className="font-medium">{typeof dept.patientLoad === 'number' ? dept.patientLoad : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">OPD Rooms:</span>
                            <span className="font-medium">{Array.isArray(dept.opdRooms) ? dept.opdRooms.length : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              dept.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {typeof dept.status === 'string' ? dept.status : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OPD Room Management Tab */}
          {activeTab === "opd-rooms" && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">OPD Room Management</h3>
                  <Button
                    onClick={() => setShowAddRoom(!showAddRoom)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </div>

                {showAddRoom && (
                  <Card className="mb-6 border border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 text-gray-900">Add New OPD Room</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Room Number"
                          value={newRoom.roomNumber}
                          onChange={(e) => setNewRoom(prev => ({ ...prev, roomNumber: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select
                          value={newRoom.departmentId}
                          onChange={(e) => {
                            const selectedDept = departments.find(d => d.departmentId === e.target.value)
                            setNewRoom(prev => ({ 
                              ...prev, 
                              departmentId: e.target.value,
                              departmentName: selectedDept?.name || ''
                            }))
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.departmentId} value={dept.departmentId}>{dept.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Department Name"
                          value={newRoom.departmentName}
                          onChange={(e) => setNewRoom(prev => ({ ...prev, departmentName: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={addRoom}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Add Room
                        </Button>
                        <Button
                          onClick={() => setShowAddRoom(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-700 border-b">
                        <th className="py-3">Room No.</th>
                        <th>Department</th>
                        <th>Assigned Doctor</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {opdRooms.map((room) => (
                        <tr key={room.roomId} className="hover:bg-gray-50/60">
                          <td className="py-3 font-mono text-blue-600">{room.roomNumber || 'N/A'}</td>
                          <td className="text-gray-900">{typeof room.departmentName === 'string' ? room.departmentName : 'Unknown'}</td>
                          <td className="text-gray-900">
                            {room.doctorName ? (
                              <span className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                {typeof room.doctorName === 'string' ? room.doctorName : 'Unknown Doctor'}
                              </span>
                            ) : (
                              <span className="text-gray-500">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              room.status === 'Available' ? 'bg-green-100 text-green-700' : 
                              room.status === 'Occupied' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {typeof room.status === 'string' ? room.status : 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => removeRoom(room.roomId)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Scheduling Tab */}
          {activeTab === "scheduling" && (
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Doctor Scheduling</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCalendarView("list")}
                        variant={calendarView === "list" ? "default" : "outline"}
                        size="sm"
                      >
                        List View
                      </Button>
                      <Button
                        onClick={() => setCalendarView("calendar")}
                        variant={calendarView === "calendar" ? "default" : "outline"}
                        size="sm"
                      >
                        Calendar View
                      </Button>
                    </div>
                    {calendarView === "list" && (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value)
                          fetchSchedules(e.target.value)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                    <Button
                      onClick={() => setShowAddSchedule(!showAddSchedule)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule
                    </Button>
                  </div>
                </div>

                {showAddSchedule && (
                  <Card className="mb-6 border border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 text-gray-900">Add New Schedule</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <select
                          value={newSchedule.roomId}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, roomId: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Room</option>
                          {opdRooms.map(room => (
                            <option key={room.roomId} value={room.roomId}>
                              Room {room.roomNumber} - {room.departmentName}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newSchedule.doctorId}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, doctorId: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Doctor</option>
                          {doctors.map(doctor => (
                            <option key={doctor.doctorId} value={doctor.doctorId}>
                              {doctor.name} - {doctor.department}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={newSchedule.startTime}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="time"
                          value={newSchedule.endTime}
                          onChange={(e) => setNewSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newSchedule.isRecurring}
                            onChange={(e) => setNewSchedule(prev => ({ ...prev, isRecurring: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm">Recurring Schedule</span>
                        </label>
                        {newSchedule.isRecurring && (
                          <div className="flex items-center gap-2">
                            <select
                              value={newSchedule.recurringPattern.type}
                              onChange={(e) => setNewSchedule(prev => ({
                                ...prev,
                                recurringPattern: { ...prev.recurringPattern, type: e.target.value }
                              }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                            <input
                              type="date"
                              value={newSchedule.recurringPattern.endDate}
                              onChange={(e) => setNewSchedule(prev => ({
                                ...prev,
                                recurringPattern: { ...prev.recurringPattern, endDate: e.target.value }
                              }))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={addSchedule}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Add Schedule
                        </Button>
                        <Button
                          onClick={() => setShowAddSchedule(false)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {calendarView === "calendar" ? (
                  <CalendarView
                    schedules={schedules}
                    onDateChange={(date) => {
                      setSelectedDate(date.toISOString().split('T')[0])
                      fetchSchedules(date.toISOString().split('T')[0])
                    }}
                    onScheduleClick={(schedule) => {
                      setSelectedSchedule(schedule)
                    }}
                    onAddSchedule={(date) => {
                      setNewSchedule(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))
                      setShowAddSchedule(true)
                    }}
                    onEditSchedule={(schedule) => {
                      setSelectedSchedule(schedule)
                      // You can add edit functionality here
                    }}
                    onDeleteSchedule={(schedule) => {
                      removeSchedule(schedule.scheduleId)
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.map((schedule) => (
                      <Card key={schedule.scheduleId} className="border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                                                          <h4 className="font-semibold text-gray-900">Room {schedule.roomNumber || 'N/A'}</h4>
                            <p className="text-sm text-gray-600">{typeof schedule.doctorName === 'string' ? schedule.doctorName : 'Unknown Doctor'}</p>
                            <p className="text-xs text-gray-500">{typeof schedule.departmentName === 'string' ? schedule.departmentName : 'Unknown Department'}</p>
                            </div>
                            <Button
                              onClick={() => removeSchedule(schedule.scheduleId)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>{formatDateUTC(schedule.date)}</span>
                            </div>
                            {schedule.isRecurring && (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-600">Recurring</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                schedule.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                schedule.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {typeof schedule.status === 'string' ? schedule.status : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctors Tab - Existing Content */}
          {activeTab === "doctors" && (
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900">Doctors by Specialization</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={doctorBySpecialization} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3}>
                        {doctorBySpecialization.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Doctors Management</h3>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Departments</option>
                      {departmentOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <Button
                      onClick={() => setShowAddDoctor(!showAddDoctor)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Doctor
                    </Button>
                    <Button
                      onClick={seedTestDoctors}
                      size="sm"
                      variant="outline"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Seed Test
                    </Button>
                  </div>
                </div>

                {showAddDoctor && (
                  <Card className="mb-4 border border-blue-200 bg-blue-50/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 text-gray-900">Add New Doctor</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Doctor Name"
                          value={newDoctor.name}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <select
                          value={newDoctor.department}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, department: e.target.value, specialization: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select Department</option>
                          {departmentOptions.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Specialization (optional)"
                          value={newDoctor.specialization}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, specialization: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Contact (optional)"
                          value={newDoctor.contact}
                          onChange={(e) => setNewDoctor(prev => ({ ...prev, contact: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={addDoctor}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading}
                        >
                          Add Doctor
                        </Button>
                        <Button
                          onClick={() => setShowAddDoctor(false)}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="min-w-[600px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-700">
                        <th className="py-2">Doctor ID</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Specialization</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                            Loading doctors...
                          </td>
                        </tr>
                      ) : doctors.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No doctors found. Add some doctors or seed test data.
                          </td>
                        </tr>
                      ) : (
                        doctors.map((doctor) => (
                          <tr key={doctor.doctorId} className="hover:bg-gray-50/60 text-gray-900">
                            <td className="py-2 font-mono text-xs text-blue-600">{doctor.doctorId}</td>
                            <td className="font-medium">{doctor.name}</td>
                            <td>{doctor.department}</td>
                            <td>{doctor.specialization}</td>
                            <td>{doctor.contact || '-'}</td>
                            <td>
                              <span className={`px-2 py-1 rounded-full text-xs ${doctor.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                {doctor.status}
                              </span>
                            </td>
                            <td>
                              <Button
                                onClick={() => removeDoctor(doctor.doctorId)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AuthorityDashboardPage), {
  ssr: false
})


