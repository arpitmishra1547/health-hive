"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart, 
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react"

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    // Basic Information
    fullName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    
    // Contact Details
    mobileNumber: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    address: "",
    houseNo: "",
    city: "",
    state: "",
    pincode: "",
    
    // Identification
    patientId: "",
    aadhaarNumber: "",
    passportNumber: "",
    drivingLicense: "",
    idProofType: "",
    
    // Medical Information
    existingConditions: "",
    allergies: "",
    currentMedications: "",
    pastSurgeries: "",
    familyMedicalHistory: "",
    
    // Payment & Hospital
    paymentMethod: "",
    hospitalCity: "",
    hospitalName: "",
    department: "",
    preferredDoctor: "",
    reasonForVisit: "",
    appointmentDate: "",
    appointmentTime: "",
    
    // Consent
    consentAgreed: false
  })
  
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [error, setError] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [hospitals, setHospitals] = useState([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [hospitalCoordinates, setHospitalCoordinates] = useState(null)
  const [loadingCoordinates, setLoadingCoordinates] = useState(false)
  const [coordinatesError, setCoordinatesError] = useState("")
  
  const [filteredCities, setFilteredCities] = useState(["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Bhopal", "Indore", "Surat", "Kanpur", "Nagpur", "Visakhapatnam", "Patna", "Vadodara", "Ludhiana", "Coimbatore"])

  // Doctors data for department and alternative selection
  const [deptDoctors, setDeptDoctors] = useState([])
  const [showDoctorChoice, setShowDoctorChoice] = useState(false)
  const [alternativeDoctors, setAlternativeDoctors] = useState([])
  const [selectedAlternativeId, setSelectedAlternativeId] = useState("")
  const [selectedDoctorStatus, setSelectedDoctorStatus] = useState("")
  const [patientWillingToWait, setPatientWillingToWait] = useState(false)

  // Check for pending mobile number from login
  useEffect(() => {
    const pendingMobile = localStorage.getItem('pendingMobileNumber')
    if (pendingMobile) {
      setFormData(prev => ({ ...prev, mobileNumber: pendingMobile }))
      localStorage.removeItem('pendingMobileNumber')
    }
  }, [])

  
  // Sample hospital data by city
  const hospitalsByCity = {
    "Bhopal": [
      { id: "1", name: "All India Institute of Medical Sciences (AIIMS)", address: "Saket Nagar, Bhopal" },
      { id: "2", name: "Hamidia Hospital", address: "Hamidia Road, Bhopal" },
      { id: "3", name: "People's Hospital", address: "Berasia Road, Bhopal" },
      { id: "4", name: "Bansal Hospital", address: "C-Sector, Shahpura, Bhopal" }
    ],
    "Delhi": [
      { id: "5", name: "All India Institute of Medical Sciences (AIIMS)", address: "Ansari Nagar, New Delhi" },
      { id: "6", name: "Safdarjung Hospital", address: "Safdarjung, New Delhi" },
      { id: "7", name: "Apollo Hospital", address: "Sarita Vihar, New Delhi" },
      { id: "8", name: "Fortis Hospital", address: "Shalimar Bagh, New Delhi" }
    ],
    "Mumbai": [
      { id: "9", name: "King Edward Memorial Hospital", address: "Parel, Mumbai" },
      { id: "10", name: "Tata Memorial Hospital", address: "Parel, Mumbai" },
      { id: "11", name: "Lilavati Hospital", address: "Bandra West, Mumbai" },
      { id: "12", name: "Hinduja Hospital", address: "Mahim, Mumbai" }
    ],
    "Indore": [
      { id: "13", name: "Maharaja Yeshwantrao Hospital", address: "M.G. Road, Indore" },
      { id: "14", name: "Apollo Hospital", address: "Vijay Nagar, Indore" },
      { id: "15", name: "Bombay Hospital", address: "Indore" },
      { id: "16", name: "Greater Kailash Hospital", address: "Indore" }
    ]
  }
  

  // Age calculation from DOB
  const calculateAge = (dob) => {
    if (!dob) return ""
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  // Generate patient ID
  const generatePatientId = () => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `P${timestamp}${randomStr}`
  }

  // Handle hospital city change
  const handleHospitalCityChange = (city) => {
    setFormData(prev => ({
      ...prev,
      hospitalCity: city,
      hospitalName: "",
      department: "",
      preferredDoctor: ""
    }))
    setHospitals(hospitalsByCity[city] || [])
    setHospitalCoordinates(null)
    setCoordinatesError("")
    setDeptDoctors([])
    setShowDoctorChoice(false)
    setAlternativeDoctors([])
    setSelectedAlternativeId("")
    setSelectedDoctorStatus("")
    setPatientWillingToWait(false)
  }

  // Get hospital coordinates using Google Places API
  const getHospitalCoordinates = async (hospitalName, city) => {
    if (!hospitalName || !city) return

    setLoadingCoordinates(true)
    setCoordinatesError("")
    
    try {
      const response = await fetch(`/api/places?query=${encodeURIComponent(hospitalName + ' ' + city)}`)
      const data = await response.json()
      
      if (data.success && data.hospitals.length > 0) {
        // Find the best match for the hospital name
        const bestMatch = data.hospitals.find(hospital => 
          hospital.name.toLowerCase().includes(hospitalName.toLowerCase()) ||
          hospitalName.toLowerCase().includes(hospital.name.toLowerCase())
        ) || data.hospitals[0]
        
        setHospitalCoordinates({
          lat: bestMatch.location.lat,
          lng: bestMatch.location.lng
        })
        setCoordinatesError("")
      } else {
        setCoordinatesError("Could not find coordinates for this hospital. Please try a different hospital.")
        setHospitalCoordinates(null)
      }
    } catch (error) {
      console.error('Error fetching hospital coordinates:', error)
      setCoordinatesError("Failed to get hospital location. Please try again.")
      setHospitalCoordinates(null)
    } finally {
      setLoadingCoordinates(false)
    }
  }

  // Handle hospital name change
  const handleHospitalNameChange = (hospitalName) => {
    setFormData(prev => ({
      ...prev,
      hospitalName: hospitalName
    }))
    
    // Get coordinates for the selected hospital
    if (hospitalName && formData.hospitalCity) {
      getHospitalCoordinates(hospitalName, formData.hospitalCity)
    }
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-calculate age from DOB
    if (field === "dateOfBirth") {
      const age = calculateAge(value)
      setFormData(prev => ({
        ...prev,
        age: age
      }))
    }
    
    // Auto-generate patient ID
    if (field === "fullName" && value && !formData.patientId) {
      setFormData(prev => ({
        ...prev,
        patientId: generatePatientId()
      }))
    }
    
    // Handle city input for suggestions
    if (field === "hospitalCity") {
      const citySuggestions = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Bhopal", "Indore", "Surat", "Kanpur", "Nagpur", "Visakhapatnam", "Patna", "Vadodara", "Ludhiana", "Coimbatore"]
      const filtered = citySuggestions.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCities(filtered)
      setShowCitySuggestions(value.length > 0 && filtered.length > 0)
    }
  }
  
  // Handle city selection from suggestions
  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      hospitalCity: city,
      hospitalName: "",
      department: "",
      preferredDoctor: ""
    }))
    setShowCitySuggestions(false)
    handleHospitalCityChange(city)
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }
  // Load doctors when department changes
  useEffect(() => {
    async function loadDeptDoctors() {
      if (!formData.department) { setDeptDoctors([]); return }
      try {
        const res = await fetch(`/api/doctors?department=${encodeURIComponent(formData.department)}`)
        const data = await res.json()
        if (data.success) setDeptDoctors(data.doctors)
      } catch {}
    }
    loadDeptDoctors()
    // reset selection state when department changes
    setShowDoctorChoice(false)
    setAlternativeDoctors([])
    setSelectedAlternativeId("")
    setSelectedDoctorStatus("")
    setPatientWillingToWait(false)
  }, [formData.department])


  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // Handle registration submission
  const handleRegistrationSubmit = async () => {
    try {
      setLoading(true)
      setError("")

      // Validate required fields
      if (!formData.fullName || !formData.dateOfBirth || !formData.gender || !formData.mobileNumber || !formData.hospitalCity || !formData.hospitalName || !formData.department || !formData.consentAgreed) {
        setError("Please fill in all required fields and agree to terms & conditions")
        return
      }

      // Generate patient ID if not already generated
      const patientId = formData.patientId || generatePatientId()

      const registrationData = {
        ...formData,
        patientId,
        hospitalCoordinates: hospitalCoordinates,
        registrationDate: new Date().toISOString(),
        status: "waiting",
        type: "normal"
      }

      // Preferred doctor assignment logic (inline UI already handled waiting/alternative selection)
      if (formData.preferredDoctor) {
        const doc = deptDoctors.find(d => d.name?.toLowerCase() === formData.preferredDoctor.toLowerCase())
        const st = (doc?.status === 'Active') ? 'available' : (doc?.status || '')
        const isAvailable = st === 'available'
        if (doc && isAvailable) {
          registrationData.assignedDoctorId = doc.doctorId
          registrationData.assignedDoctorName = doc.name
        }
        // If busy/emergency and patient chose to wait, we proceed without assigning
      }

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createPatient',
          mobileNumber: formData.mobileNumber,
          patientData: registrationData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setRegistrationSuccess(true)
        // Store patient data in localStorage for dashboard
        localStorage.setItem('patientData', JSON.stringify(registrationData))
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    value={formData.age}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )
        
      case 2:
        return (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Phone className="w-5 h-5 mr-2 text-green-600" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    value={formData.mobileNumber}
                    readOnly
                    placeholder="Mobile number (from login)"
                    required
                  />
                  {formData.mobileNumber && (
                    <p className="text-xs text-blue-600 mt-1">✓ Mobile number verified from login</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    placeholder="Emergency contact person"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">House No</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.houseNo}
                    onChange={(e) => handleInputChange("houseNo", e.target.value)}
                    placeholder="House/Flat No"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Your city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Your state"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    placeholder="6-digit pincode"
                    maxLength="6"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complete Address *</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Complete residential address"
                  required
                />
              </div>
            </CardContent>
          </Card>
        )
        
      case 3:
        return (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  value={formData.patientId || generatePatientId()}
                  readOnly
                  placeholder="Auto-generated Patient ID"
                />
                <p className="text-xs text-gray-500 mt-1">This ID will be automatically generated</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Government ID Proof Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.idProofType}
                  onChange={(e) => handleInputChange("idProofType", e.target.value)}
                >
                  <option value="">Select ID Proof Type</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>
              
              {formData.idProofType === "aadhaar" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange("aadhaarNumber", e.target.value.replace(/\D/g, ''))}
                    placeholder="12-digit Aadhaar number"
                    maxLength="12"
                  />
                </div>
              )}
              
              {formData.idProofType === "passport" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.passportNumber}
                    onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                    placeholder="Passport number"
                  />
                </div>
              )}
              
              {formData.idProofType === "driving_license" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driving License Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.drivingLicense}
                    onChange={(e) => handleInputChange("drivingLicense", e.target.value)}
                    placeholder="Driving license number"
                  />
                </div>
              )}
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Upload ID Proof (Optional)</h4>
                <p className="text-sm text-blue-700">You can upload a scan/photo of your ID proof for verification purposes.</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </CardContent>
          </Card>
        )
        
      case 4:
        return (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Heart className="w-5 h-5 mr-2 text-red-600" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Existing Medical Conditions</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.existingConditions}
                  onChange={(e) => handleInputChange("existingConditions", e.target.value)}
                  placeholder="e.g., Diabetes, Hypertension, Heart Disease (if any)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Known Allergies</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
                  placeholder="Food allergies, drug allergies, etc. (if any)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.currentMedications}
                  onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                  placeholder="List any medications you are currently taking"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Past Surgeries/Medical History</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.pastSurgeries}
                  onChange={(e) => handleInputChange("pastSurgeries", e.target.value)}
                  placeholder="Previous surgeries, major illnesses, hospitalizations"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Family Medical History</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.familyMedicalHistory}
                  onChange={(e) => handleInputChange("familyMedicalHistory", e.target.value)}
                  placeholder="Family history of genetic diseases, chronic conditions"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method Preference</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card (Credit/Debit)</option>
                  <option value="UPI">UPI</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )
        
      case 5:
        return (
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                Hospital & Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital City *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.hospitalCity}
                  onChange={(e) => handleInputChange("hospitalCity", e.target.value)}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  placeholder="Enter city name (e.g., Delhi, Mumbai, Bhopal)"
                  required
                />
                
                {/* City Suggestions Dropdown */}
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.hospitalCity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Hospital *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.hospitalName}
                    onChange={(e) => handleHospitalNameChange(e.target.value)}
                    required
                  >
                    <option value="">Select Hospital</option>
                    {hospitals.map(hospital => (
                      <option 
                        key={hospital.id} 
                        value={hospital.name}
                      >
                        {hospital.name} - {hospital.address}
                      </option>
                    ))}
                  </select>
                  
                  {/* Hospital Coordinates Status */}
                  {formData.hospitalName && (
                    <div className="mt-2">
                      {loadingCoordinates ? (
                        <div className="flex items-center text-blue-600 text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting hospital location...
                        </div>
                      ) : hospitalCoordinates ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Hospital location found: {hospitalCoordinates.lat.toFixed(6)}, {hospitalCoordinates.lng.toFixed(6)}
                          {formData.hospitalName === "All India Institute of Medical Sciences (AIIMS)" && formData.hospitalCity === "Bhopal" && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Token always available
                            </span>
                          )}
                        </div>
                      ) : coordinatesError ? (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {coordinatesError}
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500 text-sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          Hospital location will be fetched automatically
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Psychiatry">Psychiatry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Doctor</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={formData.preferredDoctor}
                    onChange={(e) => {
                      const val = e.target.value
                      handleInputChange("preferredDoctor", val)
                      const doc = deptDoctors.find(d => (d.name === val))
                      const normalized = (doc?.status === 'Active') ? 'available' : (doc?.status || '')
                      setSelectedDoctorStatus(normalized)
                      setPatientWillingToWait(false)
                      if (normalized === 'busy' || normalized === 'emergency') {
                        const avail = deptDoctors.filter(d => {
                          const st = d.status === 'Active' ? 'available' : (d.status || '')
                          return st === 'available' && d.name !== val
                        })
                        setAlternativeDoctors(avail)
                        setShowDoctorChoice(true)
                      } else {
                        setShowDoctorChoice(false)
                        setAlternativeDoctors([])
                        setSelectedAlternativeId("")
                      }
                    }}
                  >
                    <option value="">Select preferred doctor (optional)</option>
                    {deptDoctors.map((d) => {
                      const st = d.status === 'Active' ? 'available' : (d.status || 'available')
                      return (
                        <option key={d.doctorId} value={d.name}>{`${d.name} - [${st}]`}</option>
                      )
                    })}
                  </select>

                  {(selectedDoctorStatus === 'busy' || selectedDoctorStatus === 'emergency') && (
                    <div className="mt-3 p-3 border rounded-lg bg-yellow-50">
                      <div className="text-sm text-yellow-800 mb-2">
                        {selectedDoctorStatus === 'emergency' ? 'Your selected doctor is currently handling an emergency.' : 'Your selected doctor is currently busy.'}
                        {" "}You can wait or choose another available doctor.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => { setPatientWillingToWait(true); setShowDoctorChoice(false) }}
                        >
                          I will wait
                        </Button>
                        <Button
                          onClick={() => { setPatientWillingToWait(false); setShowDoctorChoice(true) }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Choose another doctor
                        </Button>
                      </div>
                    </div>
                  )}

                  {showDoctorChoice && alternativeDoctors.length > 0 && (
                    <div className="mt-3 p-3 border rounded-lg bg-blue-50">
                      <div className="text-sm text-blue-800 mb-2">Available doctors:</div>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 px-3 py-2 border rounded bg-white"
                          value={selectedAlternativeId}
                          onChange={(e) => setSelectedAlternativeId(e.target.value)}
                        >
                          <option value="">Select doctor</option>
                          {alternativeDoctors.map((d) => (
                            <option key={d.doctorId} value={d.doctorId}>{d.name}</option>
                          ))}
                        </select>
                        <Button
                          onClick={async () => {
                            if (!selectedAlternativeId) return
                            const chosen = alternativeDoctors.find(d => d.doctorId === selectedAlternativeId)
                            const registrationData = {
                              ...formData,
                              assignedDoctorId: chosen?.doctorId,
                              assignedDoctorName: chosen?.name,
                              patientId: formData.patientId || generatePatientId(),
                              hospitalCoordinates: hospitalCoordinates,
                              registrationDate: new Date().toISOString(),
                              status: "waiting",
                              type: "normal"
                            }
                            setLoading(true)
                            const resp = await fetch('/api/patients', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'createPatient',
                                mobileNumber: formData.mobileNumber,
                                patientData: registrationData
                              })
                            })
                            const data = await resp.json()
                            setLoading(false)
                            if (data.success) {
                              setRegistrationSuccess(true)
                              localStorage.setItem('patientData', JSON.stringify(registrationData))
                            } else {
                              setError(data.message || 'Registration failed. Please try again.')
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Assign and Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit/Symptoms</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.reasonForVisit}
                  onChange={(e) => handleInputChange("reasonForVisit", e.target.value)}
                  placeholder="Describe your symptoms or reason for consultation"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Appointment Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange("appointmentDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.appointmentTime}
                    onChange={(e) => handleInputChange("appointmentTime", e.target.value)}
                  >
                    <option value="">Select Time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={formData.consentAgreed}
                    onChange={(e) => handleInputChange("consentAgreed", e.target.checked)}
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the <span className="text-blue-600 underline">Terms & Conditions</span> and 
                    <span className="text-blue-600 underline"> Privacy Policy</span>. I consent to the collection 
                    and processing of my personal and medical data for healthcare purposes.
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )
        
      default:
        return null
    }
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/80 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your registration has been completed. A token will be automatically generated when you arrive within 100 meters of the hospital.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Visit the hospital location</li>
                <li>• Enable location services on your device</li>
                <li>• Token will be generated automatically</li>
                <li>• Check your dashboard for updates</li>
              </ul>
            </div>
            <Button 
              onClick={() => window.location.href = "/patient/login"}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h1>
          <p className="text-gray-600">Complete your registration to get started with our hospital management system</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-sm text-gray-600">
              Step {currentStep} of 5: {
                currentStep === 1 ? 'Basic Information' :
                currentStep === 2 ? 'Contact Details' :
                currentStep === 3 ? 'Identification' :
                currentStep === 4 ? 'Medical Information' :
                'Hospital & Appointment'
              }
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Form Content */}
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 5 ? (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleRegistrationSubmit}
                disabled={loading || !formData.consentAgreed}
                className="bg-green-600 hover:bg-green-700 flex items-center"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Complete Registration
              </Button>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}