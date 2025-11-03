"use client"

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  MapPin, 
  Clock, 
  Phone, 
  Hospital,
  FileText,
  HelpCircle,
  X
} from "lucide-react"

export default function PatientAssistantBot() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const [conversationState, setConversationState] = useState('main_menu')
  const [userData, setUserData] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial welcome message (translated)
      addBotMessage(`👋 ${t('bot.greeting')}

${t('bot.chooseOption')}
1️⃣ ${t('menu.register')}
2️⃣ ${t('menu.token')}
3️⃣ ${t('menu.appointment')}
4️⃣ ${t('menu.doctors')}
5️⃣ ${t('menu.location')} / Distance
6️⃣ ${t('menu.help')}

${t('bot.typeNumber')}`)
    }
  }, [isOpen])

  const addBotMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      content,
      sender: 'bot',
      timestamp: new Date()
    }])
  }

  const addUserMessage = (content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      content,
      sender: 'user',
      timestamp: new Date()
    }])
  }

  const resetConversation = () => {
    setConversationState('main_menu')
    setUserData({})
    addBotMessage(`👋 ${t('bot.greeting')}

${t('bot.chooseOption')}
1️⃣ ${t('menu.register')}
2️⃣ ${t('menu.token')}
3️⃣ ${t('menu.appointment')}
4️⃣ ${t('menu.doctors')}
5️⃣ ${t('menu.location')} / Distance
6️⃣ ${t('menu.help')}

${t('bot.typeNumber')}`)
  }

  const handleMainMenu = (input) => {
    const choice = input.trim()
    
    switch(choice) {
      case '1':
        setConversationState('register_name')
        addBotMessage(`📝 ${t('reg.start')}`)
        break
      case '2':
        setConversationState('token_phone')
        addBotMessage('📱 Please enter your Mobile Number (used during registration):')
        break
      case '3':
        setConversationState('appointment_phone')
        addBotMessage('📱 Please enter your Mobile Number:')
        break
      case '4':
        setConversationState('doctor_info')
        showDoctorInfo()
        break
      case '5':
        setConversationState('location_request')
        addBotMessage('📍 Please share your current location. You can use the "Share Location" button below or enter your coordinates manually (latitude, longitude):')
        break
      case '6':
        setConversationState('help')
        showHelp()
        break
      default:
        addBotMessage('❌ Please enter a valid option (1-6). Let me show you the menu again:')
        resetConversation()
    }
  }

  const handleRegistration = async (input) => {
    switch(conversationState) {
      case 'register_name':
        setUserData(prev => ({ ...prev, fullName: input }))
        setConversationState('register_dob')
        addBotMessage(`📅 ${t('reg.askDob')}`)
        break
      case 'register_dob':
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
          addBotMessage(`❌ ${t('error.invalidDob')}`)
          return
        }
        const [day, month, year] = input.split('/')
        const dob = new Date(year, month - 1, day)
        const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000))
        setUserData(prev => ({ ...prev, dateOfBirth: input, age }))
        setConversationState('register_gender')
        addBotMessage(`⚧ ${t('reg.askGender')}`)
        break
      case 'register_gender':
        const gender = input.toLowerCase()
        if (!['male', 'female', 'other'].includes(gender)) {
          addBotMessage(`❌ ${t('error.invalidGender')}`)
          return
        }
        setUserData(prev => ({ ...prev, gender: input }))
        setConversationState('register_phone')
        addBotMessage(`📱 ${t('reg.askPhone')}`)
        break
      case 'register_phone':
        if (!/^[6-9]\d{9}$/.test(input)) {
          addBotMessage(`❌ ${t('error.invalidPhone')}`)
          return
        }
        setUserData(prev => ({ ...prev, mobileNumber: input }))
        setConversationState('register_address')
        addBotMessage(`🏠 ${t('reg.askAddress')}`)
        break
      case 'register_address':
        setUserData(prev => ({ ...prev, address: input, city: 'Bhopal' }))
        setConversationState('register_department')
        addBotMessage(`🏥 ${t('reg.askDept')}
${t('reg.askDept.list')}`)
        break
      case 'register_department':
        const departments = {
          '1': 'Cardiology',
          '2': 'Orthopedics', 
          '3': 'Neurology',
          '4': 'Pediatrics',
          '5': 'General Medicine'
        }
        if (!departments[input]) {
          addBotMessage('❌ Please enter a valid department number (1-5):')
          return
        }
        setUserData(prev => ({ ...prev, department: departments[input] }))
        setConversationState('register_hospital')
        addBotMessage(`🏨 ${t('reg.askHospital')}`)
        break
      case 'register_hospital':
        await completeRegistration(input)
        break
    }
  }

  const completeRegistration = async (hospitalName) => {
    setIsLoading(true)
    try {
      const patientData = {
        ...userData,
        hospitalName,
        hospitalCity: 'Bhopal'
      }

      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      })

      const result = await response.json()

      if (result.success) {
        setUserData(prev => ({ ...prev, patientId: result.patient.patientId }))
        if (hospitalName.toLowerCase().includes('aiims') && hospitalName.toLowerCase().includes('bhopal')) {
          // Try to generate token for AIIMS Bhopal
          await generateTokenForRegistration(result.patient.patientId)
        } else {
          addBotMessage(`✅ Registration Complete!
📍 Patient ID: ${result.patient.patientId}
📍 Please move within 100m of the hospital.
Once you are near, your token will be generated automatically.

Thank you for registering with Health-Hive! 🏥`)
        }
      } else {
        addBotMessage(`❌ Registration failed: ${result.message}`)
      }
    } catch (error) {
      addBotMessage('❌ An error occurred during registration. Please try again later.')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
      }, 2000)
    }
  }

  const checkTokenNumber = async (mobileNumber) => {
    setIsLoading(true)
    try {
      // First check if patient exists
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkMobile',
          mobileNumber
        })
      })

      const result = await response.json()

      if (result.exists && result.patient) {
        // Check if patient has a token
        if (result.patient.tokenNumber) {
          // Verify token using the tokens API
          const tokenResponse = await fetch(`/api/tokens/verify?tokenNumber=${result.patient.tokenNumber}`)
          const tokenResult = await tokenResponse.json()
          
          if (tokenResult.success) {
            addBotMessage(`🎫 Your Token Number is: ${result.patient.tokenNumber}
⏳ Status: ${tokenResult.token.status}

Please wait for your turn. You'll be notified when it's time for your consultation.`)
          } else {
            addBotMessage('❌ Token not found. Please contact reception for assistance.')
          }
        } else {
          addBotMessage('❌ No active token found. Please generate a token first by visiting the hospital or using option 5.')
        }
      } else {
        addBotMessage('❌ No registration found with this mobile number. Please register first using option 1.')
      }
    } catch (error) {
      addBotMessage('❌ Unable to fetch token information. Please try again later.')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
      }, 2000)
    }
  }

  const checkAppointmentTime = async (mobileNumber) => {
    setIsLoading(true)
    try {
      // First check if patient exists
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkMobile',
          mobileNumber
        })
      })

      const patientResult = await patientResponse.json()

      if (patientResult.exists && patientResult.patient) {
        const patient = patientResult.patient

        // Get doctors in patient's department
        const doctorsResponse = await fetch(`/api/doctors?department=${encodeURIComponent(patient.department)}`)
        const doctorsResult = await doctorsResponse.json()
        
        if (doctorsResult.success && doctorsResult.doctors.length > 0) {
          // Get schedules for the first available doctor in the department
          const doctor = doctorsResult.doctors[0]
          const schedulesResponse = await fetch(`/api/schedules?doctorId=${doctor.doctorId}`)
          const schedulesResult = await schedulesResponse.json()
          
          if (schedulesResult.success && schedulesResult.schedules.length > 0) {
            const schedule = schedulesResult.schedules[0]
            addBotMessage(`🕑 Next Available Appointment:
📅 Date: ${schedule.date}
⏰ Time: ${schedule.startTime} - ${schedule.endTime}
👨‍⚕️ Doctor: ${schedule.doctorName}
🏥 Department: ${schedule.departmentName}
📍 Room: ${schedule.roomNumber}

Please arrive 15 minutes before your scheduled time.`)
          } else {
            // No schedules found for this doctor
            const nextDay = new Date()
            nextDay.setDate(nextDay.getDate() + 1)
            addBotMessage(`🕑 Next Available Appointment:
📅 Date: ${nextDay.toLocaleDateString()}
⏰ Time: 10:00 AM - 10:30 AM
👨‍⚕️ Doctor: ${doctor.name}
🏥 Department: ${patient.department}
📍 Please contact reception for room assignment.

Please arrive 15 minutes before your scheduled time.`)
          }
        } else {
          // No doctors found in department
          const nextDay = new Date()
          nextDay.setDate(nextDay.getDate() + 1)
          addBotMessage(`🕑 Next Available Appointment:
📅 Date: ${nextDay.toLocaleDateString()}
⏰ Time: 10:00 AM - 10:30 AM
🏥 Department: ${patient.department}
📍 Please contact reception for doctor and room assignment.

Please arrive 15 minutes before your scheduled time.`)
        }
      } else {
        addBotMessage('❌ No patient record found with this mobile number. Please register first using option 1.')
      }
    } catch (error) {
      addBotMessage('❌ Unable to fetch appointment information. Please try again later.')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
      }, 2000)
    }
  }

  const showDoctorInfo = async () => {
    setIsLoading(true)
    try {
      // Get doctors list
      const doctorsResponse = await fetch('/api/doctors')
      const doctorsResult = await doctorsResponse.json()

      if (doctorsResult.success && doctorsResult.doctors?.length > 0) {
        // Get schedules to find room assignments
        const schedulesResponse = await fetch('/api/schedules')
        const schedulesResult = await schedulesResponse.json()

        const doctorRoomMap = new Map()
        
        // Map doctors to their assigned rooms from schedules
        if (schedulesResult.success && schedulesResult.schedules?.length > 0) {
          schedulesResult.schedules.forEach(schedule => {
            if (!doctorRoomMap.has(schedule.doctorId)) {
              doctorRoomMap.set(schedule.doctorId, {
                roomNumber: schedule.roomNumber,
                doctorName: schedule.doctorName,
                department: schedule.departmentName
              })
            }
          })
        }

        // Build doctor list with real room information
        const doctorList = doctorsResult.doctors.slice(0, 5).map(doctor => {
          const roomInfo = doctorRoomMap.get(doctor.doctorId)
          const roomText = roomInfo ? `Room ${roomInfo.roomNumber}` : 'Room TBD'
          return `- ${doctor.department}: ${doctor.name} → ${roomText}`
        }).join('\n')
        
        addBotMessage(`👨‍⚕️ Today's Doctors and OPD Rooms:
${doctorList}

All doctors are available from 9:00 AM to 5:00 PM.
Note: Room assignments may vary. Please confirm at reception.`)
      } else {
        // Fallback only when API truly fails
        addBotMessage(`👨‍⚕️ Today's Doctors and OPD Rooms:
- Orthopedics: Dr. Sharma → Room 3
- Cardiology: Dr. Mehta → Room 5
- Pediatrics: Dr. Singh → Room 7
- Neurology: Dr. Patel → Room 9
- General Medicine: Dr. Kumar → Room 11

All doctors are available from 9:00 AM to 5:00 PM.
Note: Please confirm room assignments at reception.`)
      }
    } catch (error) {
      // Fallback only when there's an actual error
      addBotMessage(`👨‍⚕️ Today's Doctors and OPD Rooms:
- Orthopedics: Dr. Sharma → Room 3
- Cardiology: Dr. Mehta → Room 5
- Pediatrics: Dr. Singh → Room 7
- Neurology: Dr. Patel → Room 9
- General Medicine: Dr. Kumar → Room 11

All doctors are available from 9:00 AM to 5:00 PM.
Note: Please confirm room assignments at reception.`)
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
      }, 2000)
    }
  }

  const generateTokenForRegistration = async (patientId) => {
    try {
      // For AIIMS Bhopal, generate token automatically
      const response = await fetch('/api/patients/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          currentLat: 23.251797808801957, // AIIMS Bhopal coordinates
          currentLng: 77.46620424743277
        })
      })

      const result = await response.json()

      if (result.success) {
        addBotMessage(`✅ Registration Complete!
🎫 Your Token Number is ${result.tokenNumber}.
Please proceed to ${userData.department} OPD Room.

Thank you for choosing SmartCare Hospital! 🏥`)
      } else {
        addBotMessage(`✅ Registration Complete!
📍 Patient ID: ${patientId}
📍 Please move within 100m of the hospital to generate your token.

Thank you for registering with Health-Hive! 🏥`)
      }
    } catch (error) {
      addBotMessage(`✅ Registration Complete!
📍 Patient ID: ${patientId}
📍 Please move within 100m of the hospital to generate your token.

Thank you for registering with Health-Hive! 🏥`)
    }
  }

  const generateLocationToken = async (mobileNumber, lat, lng) => {
    setIsLoading(true)
    try {
      // First get patient info
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkMobile',
          mobileNumber
        })
      })

      const patientResult = await patientResponse.json()

      if (!patientResult.exists) {
        addBotMessage('❌ No registration found with this mobile number. Please register first using option 1.')
        return
      }

      const patient = patientResult.patient

      // Generate token using the API
      const tokenResponse = await fetch('/api/patients/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.patientId,
          currentLat: lat,
          currentLng: lng
        })
      })

      const tokenResult = await tokenResponse.json()

      if (tokenResult.success) {
        addBotMessage(`✅ Distance: Within range of Health-Hive.
🎫 Your token is now generated: ${tokenResult.tokenNumber}

Please proceed to the reception for further assistance.`)
      } else {
        addBotMessage(`❌ ${tokenResult.message}

Please move closer to the hospital and try again.`)
      }
    } catch (error) {
      addBotMessage('❌ Unable to generate token. Please try again later.')
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
      }, 2000)
    }
  }

  const showHelp = () => {
    addBotMessage(`❓ Frequently Asked Questions:

1️⃣ **What are hospital timings?**
   Monday to Saturday: 9:00 AM - 5:00 PM
   Sunday: 10:00 AM - 2:00 PM (Emergency only)

2️⃣ **What documents should I bring?**
   - Government issued ID (Aadhaar/Passport/License)
   - Previous medical records (if any)
   - Insurance card (if applicable)

3️⃣ **How can I reschedule my appointment?**
   Contact our helpdesk or use option 3 to check current appointment

4️⃣ **Emergency Contact Number**
   📞 Emergency: +91-755-911-HELP (4357)
   📞 General Enquiry: +91-755-123-4567

For more assistance, please visit our reception desk.`)
    
    setTimeout(() => {
      addBotMessage('Would you like to do something else? Type "menu" to go back to main options.')
      setConversationState('awaiting_menu')
    }, 2000)
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  const handleLocationCheck = async (input) => {
    const coords = input.split(',')
    if (coords.length !== 2) {
      addBotMessage('❌ Please enter coordinates in format: latitude, longitude (example: 23.2518, 77.4662)')
      return
    }

    const userLat = parseFloat(coords[0].trim())
    const userLng = parseFloat(coords[1].trim())

    if (isNaN(userLat) || isNaN(userLng)) {
      addBotMessage('❌ Please enter valid numbers for latitude and longitude.')
      return
    }

    // Ask for mobile number to identify patient
    if (!userData.mobileNumber) {
      setUserData({ currentLat: userLat, currentLng: userLng })
      setConversationState('location_phone')
      addBotMessage('📱 Please enter your registered mobile number to generate token:')
      return
    }

    await generateLocationToken(userData.mobileNumber, userLat, userLng)
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      addBotMessage('📍 Getting your location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          handleLocationCheck(`${lat}, ${lng}`)
        },
        (error) => {
          addBotMessage('❌ Unable to get your location. Please enter coordinates manually (latitude, longitude):')
        }
      )
    } else {
      addBotMessage('❌ Geolocation is not supported by this browser. Please enter coordinates manually (latitude, longitude):')
    }
  }

  const handleUserInput = async (input) => {
    if (!input.trim()) return

    addUserMessage(input)
    setCurrentInput('')

    if ((conversationState === 'awaiting_menu' || conversationState === 'main_menu') && input.toLowerCase() === 'menu') {
      resetConversation()
      return
    }

    if (isLoading) {
      addBotMessage('⏳ Please wait, I\'m processing your previous request...')
      return
    }

    switch(conversationState) {
      case 'main_menu':
        handleMainMenu(input)
        break
      case 'register_name':
      case 'register_dob':
      case 'register_age':
      case 'register_gender':
      case 'register_phone':
      case 'register_address':
      case 'register_department':
      case 'register_hospital':
        await handleRegistration(input)
        break
      case 'token_phone':
        if (!/^[6-9]\d{9}$/.test(input)) {
          addBotMessage('❌ Please enter a valid 10-digit mobile number:')
          return
        }
        await checkTokenNumber(input)
        break
      case 'appointment_phone':
        if (!/^[6-9]\d{9}$/.test(input)) {
          addBotMessage('❌ Please enter a valid 10-digit mobile number:')
          return
        }
        await checkAppointmentTime(input)
        break
      case 'location_request':
        await handleLocationCheck(input)
        break
      case 'location_phone':
        if (!/^[6-9]\d{9}$/.test(input)) {
          addBotMessage('❌ Please enter a valid 10-digit mobile number:')
          return
        }
        await generateLocationToken(input, userData.currentLat, userData.currentLng)
        break
      default:
        addBotMessage('❌ I didn\'t understand that. Type "menu" to go back to main options.')
        setConversationState('awaiting_menu')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleUserInput(currentInput)
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-semibold">Patient Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === 'bot' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                    <span className="text-sm">{message.content}</span>
                    {message.sender === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm">Typing...</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            {conversationState === 'location_request' && (
              <Button
                onClick={getUserLocation}
                className="w-full mb-2 bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Share My Location
              </Button>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button type="submit" size="sm" disabled={isLoading || !currentInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  )
}