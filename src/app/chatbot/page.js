"use client";

import PatientAssistantBot from "@/components/ui/Chatbot"; // ⚠️ ensure file is Chatbot.jsx (case sensitive)
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatbotPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <Activity className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">Health-Hive</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="w-12 h-12 text-blue-600" />
            <h2 className="text-4xl font-bold text-gray-900">
              Patient Assistant Bot
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant help with registration, token numbers, appointments, and
            more. Our AI assistant is here to make your hospital experience
            smoother.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Feature Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">1️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">
                Patient Registration
              </h3>
            </div>
            <p className="text-gray-600">
              Register as a new patient with guided step-by-step process
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">2️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">Token Number</h3>
            </div>
            <p className="text-gray-600">
              Check your current token number and queue status
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">3️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">Appointment Time</h3>
            </div>
            <p className="text-gray-600">
              View your scheduled appointment time and doctor details
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">4️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">Doctor & OPD Info</h3>
            </div>
            <p className="text-gray-600">
              Get information about available doctors and OPD rooms
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">5️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">Location Services</h3>
            </div>
            <p className="text-gray-600">
              Check distance from hospital and get location-based tokens
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold">6️⃣</span>
              </div>
              <h3 className="font-semibold text-gray-900">Help & FAQs</h3>
            </div>
            <p className="text-gray-600">
              Get answers to common questions and emergency contacts
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How to Use
          </h3>
          <p className="text-gray-600 mb-4">
            Click the chat icon in the bottom-right corner to start a
            conversation with our Patient Assistant Bot. Simply follow the
            prompts and type your responses to get the help you need.
          </p>
          <div className="text-sm text-gray-500">
            💡 Tip: You can type &quot;menu&quot; at any time to return to the main
            options
          </div>
        </div>
      </main>

      {/* Chatbot Component */}
      <PatientAssistantBot />
    </div>
  );
}
