"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  User, 
  Stethoscope, 
  FileText, 
  BarChart3, 
  Settings, 
  Bell, 
  Plus,
  Minus,
  Save,
  Clock,
  Heart,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  Pill,
  Clipboard,
  Eye,
  Edit
} from "lucide-react"
import { formatDateUTC, formatTimeUTC } from "@/lib/format"

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [tokenInput, setTokenInput] = useState("")
  const [currentPatient, setCurrentPatient] = useState(null)
  const [currentToken, setCurrentToken] = useState(null)
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [prescriptionForm, setPrescriptionForm] = useState({
    symptoms: "",
    diagnosis: "",
    medicines: [{ name: "", dosage: "", duration: "" }],
    notes: ""
  })
  const [showAnalytics, setShowAnalytics] = useState(true)
  const [assignedPatients, setAssignedPatients] = useState([])
  const [waitingEmergency, setWaitingEmergency] = useState([])
  const [waitingNormal, setWaitingNormal] = useState([])

  // Queues state
  const [queue, setQueue] = useState({ emergencyQueue: [], normalQueue: [], currentEmergency: null })
  const [queueLoading, setQueueLoading] = useState(false)
  const [emergencyFlash, setEmergencyFlash] = useState(false)
  const [lastEmergencyCount, setLastEmergencyCount] = useState(0)

  // Mock patient data
  const mockPatient = {
    id: "P-001234",
    name: "John Doe",
    age: 35,
    gender: "Male",
    bloodGroup: "O+",
    allergies: "Penicillin, Nuts",
    medicalHistory: "Hypertension (2020), Diabetes Type 2 (2021)",
    problemDescription: "Severe headache and fever for the past 3 days",
    contact: "+91 98765 43210",
    address: "123 Healthcare Avenue, Mumbai, Maharashtra"
  }

  // Mock analytics data
  const analyticsData = {
    today: 12,
    yesterday: 15,
    thisWeek: 89,
    thisMonth: 342,
    diseaseDistribution: [
      { name: "Fever", count: 45, percentage: 25 },
      { name: "Cold", count: 38, percentage: 21 },
      { name: "Diabetes", count: 32, percentage: 18 },
      { name: "Hypertension", count: 28, percentage: 16 },
      { name: "Others", count: 35, percentage: 20 }
    ]
  }

  // Mock patient records
  const patientRecords = [
    {
      tokenId: "A-001",
      patientName: "Sarah Johnson",
      age: 28,
      date: "2024-01-15",
      diagnosis: "Upper Respiratory Infection",
      prescriptionStatus: "Completed"
    },
    {
      tokenId: "A-002",
      patientName: "Michael Chen",
      age: 42,
      date: "2024-01-15",
      diagnosis: "Hypertension",
      prescriptionStatus: "Completed"
    },
    {
      tokenId: "A-003",
      patientName: "Emily Rodriguez",
      age: 31,
      date: "2024-01-14",
      diagnosis: "Migraine",
      prescriptionStatus: "Completed"
    }
  ]

  useEffect(() => {
    // Load doctor info from localStorage
    const storedDoctor = localStorage.getItem('doctorInfo')
    if (storedDoctor) {
      setDoctorInfo(JSON.parse(storedDoctor))
    } else {
      // Redirect to login if no doctor info
      window.location.href = '/doctor/login'
    }
  }, [])

  // Poll queues for this doctor
  useEffect(() => {
    let timer
    async function fetchQueue() {
      if (!doctorInfo?.doctorId) return
      try {
        setQueueLoading(true)
        const res = await fetch(`/api/queue?doctorId=${encodeURIComponent(doctorInfo.doctorId)}`)
        const data = await res.json()
        if (data?.success) {
          setQueue(data.queue)
          const currentCount = (data.queue?.emergencyQueue || []).length + (data.queue?.currentEmergency ? 1 : 0)
          if (currentCount > lastEmergencyCount) {
            setEmergencyFlash(true)
            setTimeout(() => setEmergencyFlash(false), 2500)
          }
          setLastEmergencyCount(currentCount)
        }
      } catch (e) {
      } finally {
        setQueueLoading(false)
      }
    }
    fetchQueue()
    timer = setInterval(fetchQueue, 4000)
    return () => { if (timer) clearInterval(timer) }
  }, [doctorInfo?.doctorId, lastEmergencyCount])

  // Load assigned patients for this doctor
  useEffect(() => {
    async function fetchAssigned() {
      if (!doctorInfo?.doctorId) return
      try {
        const res = await fetch(`/api/patients?assignedDoctorId=${encodeURIComponent(doctorInfo.doctorId)}&status=waiting`)
        const data = await res.json()
        if (data?.success) {
          setAssignedPatients(data.patients || [])
          const emergency = (data.patients || []).filter(p => (p.type === 'emergency'))
          const normal = (data.patients || []).filter(p => (p.type !== 'emergency'))
          setWaitingEmergency(emergency)
          setWaitingNormal(normal)
        }
      } catch {}
    }
    fetchAssigned()
    const t = setInterval(fetchAssigned, 4000)
    return () => clearInterval(t)
  }, [doctorInfo?.doctorId])

  async function completePatient(mobileNumber) {
    if (!mobileNumber) return
    try {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updatePatient',
          mobileNumber,
          patientData: { status: 'completed' }
        })
      })
    } catch {}
  }

  async function startEmergency() {
    if (!doctorInfo?.doctorId) return
    await fetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'startEmergency', doctorId: doctorInfo.doctorId }) })
  }

  async function resolveEmergency() {
    if (!doctorInfo?.doctorId) return
    await fetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolveEmergency', doctorId: doctorInfo.doctorId }) })
  }

  async function serveNextNormal() {
    if (!doctorInfo?.doctorId) return
    await fetch('/api/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'dequeueNormal', doctorId: doctorInfo.doctorId }) })
  }

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim()) {
      setError("Please enter a token number")
      return
    }

    setLoading(true)
    setError("")
    setCurrentPatient(null)
    setCurrentToken(null)

    try {
      const response = await fetch(`/api/tokens/verify?tokenNumber=${encodeURIComponent(tokenInput.trim())}`)
      const data = await response.json()
      
      if (data.success) {
        setCurrentPatient(data.patient)
        setCurrentToken(data.token)
        setError("")
      } else {
        setError(data.message || "Token verification failed")
      }
    } catch (error) {
      console.error('Token verification error:', error)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addMedicine = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: "", dosage: "", duration: "" }]
    }))
  }

  const removeMedicine = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }))
  }

  const updateMedicine = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const handleSavePrescription = async () => {
    if (!currentToken || !doctorInfo) {
      alert("No active patient or doctor session")
      return
    }

    if (!prescriptionForm.diagnosis.trim()) {
      alert("Please enter a diagnosis")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenNumber: currentToken.tokenNumber,
          doctorId: doctorInfo.doctorId,
          prescription: prescriptionForm
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Auto-complete token after successful prescription
        try {
          const tokenResponse = await fetch('/api/tokens/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenNumber: currentToken.tokenNumber,
              doctorId: doctorInfo.doctorId,
              prescriptionId: data.prescriptionId
            })
          })
          
          const tokenData = await tokenResponse.json()
          
          if (tokenData.success) {
            alert("Prescription saved and token completed successfully! The patient's token has been automatically removed from the queue.")
          } else {
            alert("Prescription saved successfully, but failed to complete token automatically. Please complete manually if needed.")
          }
        } catch (tokenError) {
          console.error('Auto-token completion error:', tokenError)
          alert("Prescription saved successfully, but failed to complete token automatically. Please complete manually if needed.")
        }
        
        // Reset form
        setPrescriptionForm({
          symptoms: "",
          diagnosis: "",
          medicines: [{ name: "", dosage: "", duration: "" }],
          notes: ""
        })
        setCurrentPatient(null)
        setCurrentToken(null)
        setTokenInput("")
      } else {
        alert(data.message || "Failed to save prescription")
      }
    } catch (error) {
      console.error('Save prescription error:', error)
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 min-h-16">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Doctor Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {doctorInfo ? `${doctorInfo.name} • ${doctorInfo.department}` : 'Loading...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardContent className="p-6">
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "dashboard" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("patients")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "patients" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Patients</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "reports" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Reports</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "settings" 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-8">
            {/* Emergency & Normal Queues */}
            <Card className={`backdrop-blur-sm border-0 shadow-xl ${emergencyFlash ? 'animate-pulse ring-2 ring-red-500' : 'bg-white/80'}`}>
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Queue Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emergencyFlash && (
                  <div className="mb-4 px-4 py-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
                    🚨 Emergency case arrived — review now.
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Emergency Column */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">Emergency</span>
                        {queueLoading && <span className="text-xs text-gray-500">Updating...</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!queue.currentEmergency && (queue.emergencyQueue?.length > 0) && (
                          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={startEmergency}>Start</Button>
                        )}
                        {queue.currentEmergency && (
                          <Button size="sm" variant="outline" className="border-red-600 text-red-700" onClick={resolveEmergency}>Resolve</Button>
                        )}
                      </div>
                    </div>
                    {queue.currentEmergency && (
                      <div className="mb-3 p-3 rounded-lg border-2 border-red-400 bg-red-50">
                        <div className="text-sm text-red-700 font-semibold">Current Emergency</div>
                        <div className="text-gray-900 text-sm">Ticket: {queue.currentEmergency.ticketId}</div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {(queue.emergencyQueue || []).length === 0 && !queue.currentEmergency && (
                        <div className="text-sm text-gray-500">No emergency patients waiting</div>
                      )}
                      {(queue.emergencyQueue || []).map((p) => (
                        <div key={p.ticketId} className="p-2 rounded border bg-white">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{p.patientName}</span>
                            <span className="text-red-600 font-mono">{p.ticketId.slice(-6)}</span>
                          </div>
                          {p.emergencyReason && (
                            <div className="text-xs text-red-700 mt-1">Reason: {p.emergencyReason}</div>
                          )}
                          {p.emergencyVerified && (
                            <div className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700">Verified Emergency</div>
                          )}
                          {p.emergencyAttachment?.dataUrl && (
                            <div className="mt-1 text-xs">
                              <a href={p.emergencyAttachment.dataUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View Attachment</a>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">{formatTimeUTC(p.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Normal Column */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">Normal</span>
                        {queueLoading && <span className="text-xs text-gray-500">Updating...</span>}
                      </div>
                      <div>
                        <Button size="sm" onClick={serveNextNormal} disabled={!!queue.currentEmergency || (queue.emergencyQueue?.length > 0)}>
                          Serve Next
                        </Button>
                      </div>
                    </div>
                    { (!!queue.currentEmergency || (queue.emergencyQueue?.length > 0)) && (
                      <div className="mb-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
                        Normal queue paused: handling emergency
                      </div>
                    )}
                    <div className="space-y-2">
                      {(queue.normalQueue || []).length === 0 && (
                        <div className="text-sm text-gray-500">No normal patients waiting</div>
                      )}
                      {(queue.normalQueue || []).map((p) => (
                        <div key={p.ticketId} className="p-2 rounded border bg-white">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{p.patientName}</span>
                            <span className="text-gray-600 font-mono">{p.ticketId.slice(-6)}</span>
                          </div>
                          <div className="text-xs text-gray-500">{formatTimeUTC(p.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Token Input Section */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Search className="w-5 h-5 mr-2 text-blue-600" />
                  Patient Token Lookup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Enter Patient Token (e.g., A-042)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-mono"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <Button 
                    onClick={handleTokenSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Search className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Verifying...' : 'Lookup'}
                  </Button>
                </div>
                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm text-center">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Details Section */}
            {currentPatient && (
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Patient Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pb-4 border-b">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{currentPatient.fullName || currentPatient.name}</h3>
                        <p className="text-sm sm:text-base text-gray-600 truncate">Patient ID: {currentPatient.patientId || currentPatient.id}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">Token: {currentToken?.tokenNumber}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Visit Date</div>
                        <div className="text-gray-900 font-medium">{formatDateUTC(new Date())}</div>
                      </div>
                    </div>

                    {/* Patient Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Age:</span>
                            <span className="text-gray-900">{currentPatient.age} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Gender:</span>
                            <span className="text-gray-900">{currentPatient.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Blood Group:</span>
                            <span className="text-red-600 font-medium">{currentPatient.bloodGroup || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">Marital Status:</span>
                            <span className="text-gray-900">{currentPatient.maritalStatus || "Not specified"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-600">DOB:</span>
                            <span className="text-gray-900">{currentPatient.dateOfBirth || "Not specified"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start">
                            <Phone className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                            <div>
                              <div className="font-medium text-gray-600">Mobile:</div>
                              <div className="text-gray-900">{currentPatient.mobileNumber || currentPatient.contact}</div>
                            </div>
                          </div>
                          {currentPatient.email && (
                            <div className="flex items-start">
                              <Mail className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                              <div>
                                <div className="font-medium text-gray-600">Email:</div>
                                <div className="text-gray-900">{currentPatient.email}</div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                            <div>
                              <div className="font-medium text-gray-600">Address:</div>
                              <div className="text-gray-900">{currentPatient.address}</div>
                              {currentPatient.city && currentPatient.state && (
                                <div className="text-gray-600 text-xs mt-1">
                                  {currentPatient.city}, {currentPatient.state} {currentPatient.pincode}
                                </div>
                              )}
                            </div>
                          </div>
                          {currentPatient.emergencyContactName && (
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <div className="font-medium text-orange-800 text-xs mb-1">Emergency Contact</div>
                              <div className="text-orange-900 font-medium">{currentPatient.emergencyContactName}</div>
                              <div className="text-orange-700 text-sm">{currentPatient.emergencyContactPhone}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 border-b pb-2">Medical Information</h4>
                        <div className="space-y-3 text-sm">
                          {currentPatient.allergies && (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <div className="font-medium text-red-800 mb-1">⚠️ Allergies</div>
                              <div className="text-red-900 text-sm">{currentPatient.allergies}</div>
                            </div>
                          )}
                          {currentPatient.existingConditions && (
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Existing Conditions:</div>
                              <div className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{currentPatient.existingConditions}</div>
                            </div>
                          )}
                          {currentPatient.currentMedications && (
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Current Medications:</div>
                              <div className="text-gray-900 bg-blue-50 p-2 rounded text-sm">{currentPatient.currentMedications}</div>
                            </div>
                          )}
                          {currentPatient.pastSurgeries && (
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Past Surgeries:</div>
                              <div className="text-gray-900 bg-gray-50 p-2 rounded text-sm">{currentPatient.pastSurgeries}</div>
                            </div>
                          )}
                          {currentPatient.familyMedicalHistory && (
                            <div>
                              <div className="font-medium text-gray-600 mb-1">Family History:</div>
                              <div className="text-gray-900 bg-purple-50 p-2 rounded text-sm">{currentPatient.familyMedicalHistory}</div>
                            </div>
                          )}
                          {currentPatient.paymentMethod && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600">Payment Method:</span>
                              <span className="text-gray-900">{currentPatient.paymentMethod}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current Visit Information */}
                    {(currentPatient.reasonForVisit || currentPatient.problemDescription) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Current Visit</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="font-medium text-yellow-800 mb-2">Reason for Visit / Symptoms</div>
                          <div className="text-yellow-900">{currentPatient.reasonForVisit || currentPatient.problemDescription}</div>
                        </div>
                      </div>
                    )}

                    {/* Hospital & Department Info */}
                    {(currentPatient.hospitalName || currentPatient.department) && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          {currentPatient.hospitalName && (
                            <div>
                              <span className="font-medium text-gray-600">Hospital:</span>
                              <div className="text-gray-900">{currentPatient.hospitalName}</div>
                            </div>
                          )}
                          {currentPatient.department && (
                            <div>
                              <span className="font-medium text-gray-600">Department:</span>
                              <div className="text-gray-900">{currentPatient.department}</div>
                            </div>
                          )}
                          {currentPatient.preferredDoctor && (
                            <div>
                              <span className="font-medium text-gray-600">Preferred Doctor:</span>
                              <div className="text-gray-900">{currentPatient.preferredDoctor}</div>
                            </div>
                          )}
                          {currentPatient.appointmentDate && (
                            <div>
                              <span className="font-medium text-gray-600">Preferred Date:</span>
                              <div className="text-gray-900">{currentPatient.appointmentDate} {currentPatient.appointmentTime}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescription Form Section */}
            {currentPatient && (
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Clipboard className="w-5 h-5 mr-2 text-purple-600" />
                    Write Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe patient symptoms..."
                          value={prescriptionForm.symptoms}
                          onChange={(e) => setPrescriptionForm(prev => ({ ...prev, symptoms: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter diagnosis..."
                          value={prescriptionForm.diagnosis}
                          onChange={(e) => setPrescriptionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">Prescribed Medicines</label>
                        <Button
                          type="button"
                          onClick={addMedicine}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Medicine
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {prescriptionForm.medicines.map((medicine, index) => (
                          <div key={index} className="grid md:grid-cols-4 gap-3 items-center">
                            <input
                              type="text"
                              placeholder="Medicine name"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={medicine.name}
                              onChange={(e) => updateMedicine(index, "name", e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="Dosage"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="Duration"
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              value={medicine.duration}
                              onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                            />
                            <Button
                              type="button"
                              onClick={() => removeMedicine(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Any additional instructions or notes..."
                        value={prescriptionForm.notes}
                        onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSavePrescription}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="w-5 h-5 mr-2" />
                        )}
                        {loading ? 'Saving...' : 'Save Prescription'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            

            {/* Analytics Section */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                    Analytics & Insights
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                  >
                    {showAnalytics ? "Hide" : "Show"} Analytics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAnalytics && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{analyticsData.today}</div>
                        <div className="text-sm text-blue-700">Today</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{analyticsData.yesterday}</div>
                        <div className="text-sm text-green-700">Yesterday</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{analyticsData.thisWeek}</div>
                        <div className="text-sm text-purple-700">This Week</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{analyticsData.thisMonth}</div>
                        <div className="text-sm text-orange-700">This Month</div>
                      </div>
                    </div>

                    {/* Disease Distribution Chart */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-4">Disease Distribution</h4>
                      <div className="space-y-3">
                        {analyticsData.diseaseDistribution.map((disease, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-purple-500' :
                                index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="text-sm font-medium text-gray-700">{disease.name}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    index === 0 ? 'bg-blue-500' :
                                    index === 1 ? 'bg-green-500' :
                                    index === 2 ? 'bg-purple-500' :
                                    index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                                  }`}
                                  style={{ width: `${disease.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">{disease.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Records Table */}
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <FileText className="w-5 h-5 mr-2 text-gray-600" />
                  Patient Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Token ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Patient Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Age</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Diagnosis</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientRecords.map((record, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-mono text-blue-600">{record.tokenId}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.patientName}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{record.age}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{record.diagnosis}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              {record.prescriptionStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button className="p-1 text-blue-600 hover:text-blue-700">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:text-green-700">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

