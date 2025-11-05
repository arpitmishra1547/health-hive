"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  User,
  Stethoscope,
  Shield,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Activity,
  Clock,
  Smartphone,
  Lock,
  UserPlus,
  Calendar,
  FileText,
  Star,
  Menu,
  X,
  MessageCircle,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function SmartHospitalLandingPage() {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLoginOptions, setShowLoginOptions] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Quick queue registration (Normal/Emergency) on main page
  const [doctors, setDoctors] = useState([])
  const [regName, setRegName] = useState("")
  const [regMobile, setRegMobile] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [city, setCity] = useState("")
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [filteredCities, setFilteredCities] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [hospitalId, setHospitalId] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  const [emergencyType, setEmergencyType] = useState("")
  const [emergencyReason, setEmergencyReason] = useState("")
  const [preferredDoctorId, setPreferredDoctorId] = useState("")
  const [emergencyDoc, setEmergencyDoc] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState("")

  useEffect(() => {
    let mounted = true
    fetch('/api/doctors')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        if (data?.success && Array.isArray(data.doctors)) {
          setDoctors(data.doctors)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const cityOptions = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Kolkata", "Chennai", "Pune"]

  useEffect(() => {
    let aborted = false
    async function loadHospitals() {
      if (!city) { setHospitals([]); setHospitalId(""); setHospitalName(""); return }
      try {
        const res = await fetch(`/api/places?city=${encodeURIComponent(city)}`)
        const data = await res.json()
        if (!aborted && data?.success) {
          setHospitals(data.hospitals || [])
        }
      } catch {}
    }
    loadHospitals()
    return () => { aborted = true }
  }, [city])

  async function submitQuickRegistration(e) {
    e?.preventDefault?.()
    setSubmitting(true)
    setSubmitMsg("")
    try {
      const form = new FormData()
      form.append('action', 'enqueue')
      // for queue handling, doctorId is required; use preferredDoctorId if picked, else fall back to first doctor
      const targetDoctorId = preferredDoctorId || (doctors[0]?.doctorId || '')
      if (!targetDoctorId) {
        setSubmitMsg('No doctors available. Please select Preferred Doctor or add doctors first.')
        setSubmitting(false)
        return
      }
      form.append('doctorId', targetDoctorId)
      form.append('patientName', regName)
      form.append('mobileNumber', regMobile)
      form.append('emergency', 'true')
      if (age) form.append('age', String(age))
      if (gender) form.append('gender', gender)
      if (city) form.append('city', city)
      if (hospitalId) form.append('hospitalId', hospitalId)
      if (hospitalName) form.append('hospitalName', hospitalName)
      if (emergencyType) form.append('emergencyType', emergencyType)
      if (preferredDoctorId) form.append('preferredDoctorId', preferredDoctorId)
      if (emergencyReason) form.append('emergencyReason', emergencyReason)
      if (emergencyDoc) form.append('emergencyDoc', emergencyDoc)
      const res = await fetch('/api/queue', { method: 'POST', body: form })
      const data = await res.json()
      if (data?.success) {
        setSubmitMsg('Emergency ticket created successfully.')
        // Check doctor emergency status for optional notice
        // Skip showing any busy notice in emergency join flow
        setRegName("")
        setRegMobile("")
        setAge("")
        setGender("")
        setCity("")
        setHospitals([])
        setHospitalId("")
        setHospitalName("")
        setEmergencyType("")
        setEmergencyReason("")
        setPreferredDoctorId("")
        setEmergencyDoc(null)
      } else {
        setSubmitMsg(data?.message || 'Failed to submit. Please try again.')
      }
    } catch (err) {
      setSubmitMsg(err?.message || 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Health-Hive</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-900 hover:text-blue-600 font-medium transition-colors">{t('nav.home')}</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                {t('nav.about')}
              </a>
              <a href="#services" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                {t('nav.services')}
              </a>
              <a href="#emergency" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                {t('nav.emergency')}
              </a>
              <a href="/chatbot" className="text-green-600 hover:text-green-700 font-medium transition-colors flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {t('nav.ai')}
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                {t('nav.contact')}
              </a>

              <LanguageSwitcher />

              <div className="relative">
                <Button
                  onClick={() => setShowLoginOptions(!showLoginOptions)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {t('nav.login')}
                </Button>

                {showLoginOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-10">
                    <a href="/patient/login" className="block px-4 py-2 text-gray-700 hover:bg-blue-50">
                      Patient Login
                    </a>
                    <a href="/doctor/login" className="block px-4 py-2 text-gray-700 hover:bg-green-50">
                      Doctor Login
                    </a>
                    <a href="/authority/login" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">
                      Authority Login
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#home" className="text-gray-900 hover:text-blue-600 font-medium">{t('nav.home')}</a>
                <a href="#about" className="text-gray-600 hover:text-blue-600 font-medium">
                  {t('nav.about')}
                </a>
                <a href="#services" className="text-gray-600 hover:text-blue-600 font-medium">
                  {t('nav.services')}
                </a>
                <a href="#emergency" className="text-red-600 hover:text-red-700 font-medium">
                  {t('nav.emergency')}
                </a>
                <a href="/chatbot" className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t('nav.ai')}
                </a>
                <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium">
                  {t('nav.contact')}
                </a>
                <div className="py-2">
                  <LanguageSwitcher />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">{t('nav.login')}</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/abstract-medical-pattern.png')] opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0 transition-all duration-1000">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('hero.title1')} <br />
              <span className="text-blue-600">{t('hero.title2')}</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg" onClick={() => window.location.href = '/patient/login'}>
                <User className="w-5 h-5 mr-2" />
                {t('btn.patientLogin')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 text-lg bg-transparent"
                onClick={() => window.location.href = '/doctor/login'}
              >
                <Stethoscope className="w-5 h-5 mr-2" />
                {t('btn.doctorLogin')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg bg-transparent"
                onClick={() => (window.location.href = '/authority/login')}
              >
                <Shield className="w-5 h-5 mr-2" />
                {t('btn.authorityLogin')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Queue Registration (Emergency Handling) */}
      <section id="emergency" className="py-16 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">{t('emergency.title')}</h2>
            <p className="text-gray-600 mt-2">{t('emergency.subtitle')}</p>
          </div>
          <form onSubmit={submitQuickRegistration} className="bg-white rounded-xl border shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.fullName')}</label>
              <input value={regName} onChange={e => setRegName(e.target.value)} required placeholder={t('emergency.fullName')} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.mobile')}</label>
              <input value={regMobile} onChange={e => setRegMobile(e.target.value)} required placeholder={t('emergency.mobile')} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.age')}</label>
              <input type="number" min="0" max="120" value={age} onChange={e => setAge(e.target.value)} required placeholder="36" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.gender')}</label>
              <select value={gender} onChange={e => setGender(e.target.value)} required className="w-full border rounded-md px-3 py-2 bg-white">
                <option value="" disabled>{t('emergency.genderSelect')}</option>
                <option value="Male">{t('emergency.genderMale')}</option>
                <option value="Female">{t('emergency.genderFemale')}</option>
                <option value="Other">{t('emergency.genderOther')}</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  const val = e.target.value
                  setCity(val)
                  const filtered = cityOptions.filter(c => c.toLowerCase().includes(val.toLowerCase()))
                  setFilteredCities(filtered)
                  setShowCitySuggestions(val.length > 0 && filtered.length > 0)
                }}
                onFocus={() => {
                  if (city) {
                    const filtered = cityOptions.filter(c => c.toLowerCase().includes(city.toLowerCase()))
                    setFilteredCities(filtered)
                    setShowCitySuggestions(filtered.length > 0)
                  }
                }}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                required
                placeholder={t('emergency.citySelect')}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showCitySuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50"
                      onClick={() => { setCity(c); setShowCitySuggestions(false) }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.hospital')}</label>
              <select value={hospitalId} onChange={e => { setHospitalId(e.target.value); const h = hospitals.find(hh => hh.id === e.target.value); setHospitalName(h?.name || "") }} required className="w-full border rounded-md px-3 py-2 bg-white">
                <option value="" disabled>{city ? t('emergency.hospitalSelect') : t('emergency.cityFirst')}</option>
                {hospitals.map(h => (<option key={h.id} value={h.id}>{h.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.type')}</label>
              <select value={emergencyType} onChange={e => setEmergencyType(e.target.value)} required className="w-full border rounded-md px-3 py-2 bg-white">
                <option value="" disabled>{t('emergency.typeSelect')}</option>
                <option value="Accident">{t('emergency.type.accident')}</option>
                <option value="Chest Pain">{t('emergency.type.chestPain')}</option>
                <option value="Unconscious">{t('emergency.type.unconscious')}</option>
                <option value="Other">{t('emergency.type.other')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.description')}</label>
              <textarea value={emergencyReason} onChange={e => setEmergencyReason(e.target.value)} required rows={3} placeholder={t('emergency.descriptionPlaceholder')} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.preferredDoctor')}</label>
              <select value={preferredDoctorId} onChange={e => setPreferredDoctorId(e.target.value)} className="w-full border rounded-md px-3 py-2 bg-white">
                <option value="">{t('emergency.noPreference')}</option>
                {doctors.map(d => (
                  <option key={d.doctorId || d._id} value={d.doctorId}>{d.name} {d.specialization ? `- ${d.specialization}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('emergency.fileUpload')}</label>
              <input type="file" accept="image/*,application/pdf" onChange={e => setEmergencyDoc(e.target.files?.[0] || null)} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">{t('emergency.fileHelp')}</p>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting || !regName || !regMobile || !age || !gender || !city || !hospitalId || !emergencyType || !emergencyReason || !(preferredDoctorId || (doctors[0]?.doctorId || ''))} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? t('emergency.submitting') : t('emergency.submit')}
              </Button>
            </div>
            {submitMsg && (
              <div className="md:col-span-2 space-y-2">
                <div className="px-4 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200">{submitMsg}</div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('features.why')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('features.whyDesc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="animate-on-scroll opacity-0 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">{t('feature.noLines.title')}</h3>
                <p className="text-gray-400">{t('feature.noLines.desc')}</p>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">{t('feature.availability.title')}</h3>
                <p className="text-gray-400">{t('feature.availability.desc')}</p>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">{t('feature.friendly.title')}</h3>
                <p className="text-gray-400">{t('feature.friendly.desc')}</p>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">{t('feature.secure.title')}</h3>
                <p className="text-gray-400">{t('feature.secure.desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('how.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('how.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center animate-on-scroll opacity-0">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('how.step1.title')}</h3>
              <p className="text-gray-600">{t('how.step1.desc')}</p>
            </div>

            <div className="text-center animate-on-scroll opacity-0">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('how.step2.title')}</h3>
              <p className="text-gray-600">{t('how.step2.desc')}</p>
            </div>

            <div className="text-center animate-on-scroll opacity-0">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('how.step3.title')}</h3>
              <p className="text-gray-600">{t('how.step3.desc')}</p>
            </div>

            <div className="text-center animate-on-scroll opacity-0">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                4
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('how.step4.title')}</h3>
              <p className="text-gray-600">{t('how.step4.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-on-scroll opacity-0">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision for Digital Healthcare</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                At Health-Hive, we believe healthcare should be accessible, efficient, and patient-centered. Our
                digital transformation initiative eliminates traditional barriers and creates a seamless experience for
                patients, doctors, and healthcare administrators.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                With cutting-edge technology and compassionate care, we&apos;re building the future of healthcare where every
                interaction is meaningful, every process is streamlined, and every patient receives the attention they
                deserve.
              </p>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">10K+</div>
                  <div className="text-gray-600">Happy Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
                  <div className="text-gray-600">Expert Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-gray-600">Emergency Care</div>
                </div>
              </div>
            </div>
            <div className="animate-on-scroll opacity-0 relative w-full h-96">
              <Image
                src="/modern-hospital-with-doctors-and-patients.png"
                alt="Modern hospital environment"
                fill
                className="rounded-2xl shadow-2xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll opacity-0">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from patients, doctors, and administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="animate-on-scroll opacity-0 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  &quot;The digital token system saved me hours of waiting. I could plan my day better and the whole
                  experience was so smooth!&quot;
                </p>
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/happy-female-patient.png"
                      alt="Sarah Johnson"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sarah Johnson</div>
                    <div className="text-gray-600 text-sm">Patient</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  &quot;As a doctor, the digital records system helps me provide better care. All patient history is
                  instantly accessible and secure.&quot;
                </p>
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/professional-male-doctor.png"
                      alt="Dr. Michael Chen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Dr. Michael Chen</div>
                    <div className="text-gray-600 text-sm">Cardiologist</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-on-scroll opacity-0 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">
                  &quot;The administrative dashboard gives us complete visibility into hospital operations. It&apos;s transformed
                  how we manage resources.&quot;
                </p>
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/professional-female-administrator.png"
                      alt="Lisa Rodriguez"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Lisa Rodriguez</div>
                    <div className="text-gray-600 text-sm">Hospital Administrator</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-on-scroll opacity-0">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{t('cta.title')}</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">{t('cta.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-100 px-8 py-4 text-lg font-semibold" onClick={() => window.location.href = '/patient/login'}>
                <User className="w-5 h-5 mr-2" />
                {t('btn.patientLogin')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold bg-transparent"
                onClick={() => window.location.href = '/doctor/login'}
              >
                <Stethoscope className="w-5 h-5 mr-2" />
                {t('btn.doctorLogin')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 text-lg font-semibold bg-transparent"
                onClick={() => (window.location.href = '/authority/login')}
              >
                <Shield className="w-5 h-5 mr-2" />
                {t('btn.authorityLogin')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Hospital Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <Activity className="w-8 h-8 text-blue-400" />
                <h3 className="text-2xl font-bold">Health-Hive</h3>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Leading the digital transformation in healthcare with innovative solutions that prioritize patient care
                and operational efficiency.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">123 Healthcare Avenue, Medical District, City 12345</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Emergency: (555) 911-HELP</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">{t('footer.quickLinks')}</h4>
              <div className="space-y-3">
                <a href="#home" className="block text-gray-300 hover:text-blue-400 transition-colors">{t('footer.home')}</a>
                <a href="#about" className="block text-gray-300 hover:text-blue-400 transition-colors">{t('footer.about')}</a>
                <a href="#services" className="block text-gray-300 hover:text-blue-400 transition-colors">{t('footer.services')}</a>
                <a href="#contact" className="block text-gray-300 hover:text-blue-400 transition-colors">{t('footer.contact')}</a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold mb-6">{t('footer.follow')}</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-400 hover:bg-slate-700 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Health-Hive. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  )
}