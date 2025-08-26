"use client";

import { useAuth } from "react-oidc-context";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import useRequireAuth from "../../../components/useRequireAuth";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  Users, 
  MessageSquare,
  BookOpen,
  User,
  Bot,
  MoreVertical,
  Plus
} from "lucide-react";

import { ChatMessage, ChatHistory } from "../../../types/chat";
import { getStudentsByClassId, getClassesForDashboard, getChatHistory, getChatMessages } from "../../../lib/api";
import { studentCache } from "../../../lib/studentCache";
import { useWebSocket } from "../../../hooks/useWebSocket";
import ReactMarkdown from "react-markdown";

export default function ChatPageClient() {
  const auth = useAuth();
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({});
  const [classInfo, setClassInfo] = useState<{title: string, section: string, color: string} | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAIMessage, setCurrentAIMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useRequireAuth();

  const classId = params.classId as string;

  const { isConnected, connect, disconnect, sendMessage } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'wss://zr2han1x4j.execute-api.us-west-2.amazonaws.com/dev',
    onMessage: (data: any) => {
      if (data.message) {
        setCurrentAIMessage(prev => prev + data.message);
      }
      
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: (event) => {
      console.log('WebSocket disconnected:', event);
    }
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || !auth.user?.profile?.email) return;
      
      try {
        setLoading(true);
        
        const cachedStudents = studentCache.get(classId);
        if (cachedStudents) {
          setStudents(cachedStudents);
        } else {
          const studentData = await getStudentsByClassId(classId);
          studentCache.set(classId, studentData);
          setStudents(studentData);
        }
        
        const allClasses = await getClassesForDashboard(auth.user.profile.email);
        const currentClass = allClasses.find(cls => cls.classID === classId);
        
        if (currentClass) {
          setClassInfo({
            title: currentClass.classTitle,
            section: currentClass.sectionNumber,
            color: "from-blue-500 to-indigo-600"
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch class data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated && !auth.isLoading) {
      fetchClassData();
    }
  }, [classId, auth.isAuthenticated, auth.isLoading, auth.user?.profile?.email]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleDateString();
  };

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      const now = new Date();
      
      if (currentAIMessage) {
        const aiMessage = {
          id: messages.length + 1,
          sender: "AI Assistant",
          message: currentAIMessage,
          time: formatTimestamp(now),
          isTeacher: false
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      const newMessage = {
        id: messages.length + (currentAIMessage ? 2 : 1),
        sender: "Teacher",
        message: message.trim(),
        time: formatTimestamp(now),
        isTeacher: true
      };
      setMessages(prev => [...prev, newMessage]);
      
      const payload = {
        message: message.trim(),
        studentIDs: Object.keys(students),
        sessionId: sessionId,
        teacherId: auth.user?.profile?.email,
        classId: classId
      };
      
      sendMessage(payload);
      setMessage("");
      setCurrentAIMessage("");
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setCurrentAIMessage("");
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Button
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 hover:bg-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{classInfo?.title || 'Loading...'}</h2>
              <p className="text-sm text-gray-600">Section {classInfo?.section || ''}</p>
            </div>
          </div>
          <Button 
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New General Chat
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen">
        <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">General Chat</h1>
                <p className="text-sm text-gray-600">{classInfo?.title} - Section {classInfo?.section}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-400 text-lg">Welcome to a new chat!</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isTeacher ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-2xl`}>
                  <div className={`p-2 rounded-full ${msg.isTeacher ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {msg.isTeacher ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
                  </div>
                  <div className={`rounded-2xl p-4 ${
                    msg.isTeacher ? 'bg-blue-500 text-white' : 'bg-white shadow-md text-black'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-2 ${msg.isTeacher ? 'text-blue-100' : 'text-gray-500'}`}>{msg.time}</p>
                  </div>
                </div>
              </div>
            ))}
            {currentAIMessage && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-2xl">
                  <div className="p-2 rounded-full bg-gray-300">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="rounded-2xl p-4 bg-white shadow-md text-black">
                    <ReactMarkdown>{currentAIMessage}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <Button onClick={handleSendMessage} className="bg-blue-500 text-white p-3 rounded-xl">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white/90 backdrop-blur-xl border-l border-gray-200 flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Student Roster
          </h2>
          <p className="text-sm text-gray-600">{Object.keys(students).length} students</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {Object.entries(students).map(([studentId, studentName]) => (
              <button
                key={studentId}
                onClick={() => router.push(`/chat/${classId}/student/${studentId}`)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
              >
                <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{studentName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}