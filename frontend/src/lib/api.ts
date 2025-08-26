export interface ClassData {
  classID: string;
  sectionNumber: string;
  numStudents: string;
  classTitle: string;
}

export interface ApiResponse {
  statusCode: number;
  body: string;
}

export interface ChatHistoryItem {
  TeacherId: string;
  sortId: string;
  created_at: number;
  conversation_id: string;
  title: string;
  type?: string;
  student_ids?: string[];
}

export interface ChatMessageItem {
  TeacherId: string;
  sortId: string;
  created_at: number;
  message: string;
  sender: string;
}

export async function getClassesForDashboard(teacherEmail: string): Promise<ClassData[]> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_CLASSES_API_ENDPOINT || 'https://6ll9oei3u3.execute-api.us-west-2.amazonaws.com/dev/getClassesForDashboard';
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teacherID: teacherEmail
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch classes: ${response.status}`);
  }

  const data: ApiResponse = await response.json();
  
  if (data.statusCode !== 200) {
    throw new Error('API returned error status');
  }

  return JSON.parse(data.body);
}

export async function getStudentsByClassId(classId: string): Promise<Record<string, string>> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_STUDENTS_API_ENDPOINT || 'https://6ll9oei3u3.execute-api.us-west-2.amazonaws.com/dev/getStudentsForClass';
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      classID: classId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch students: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.statusCode !== 200) {
    throw new Error('API returned error status');
  }

  return typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
}

export async function getStudentProfile(studentId: string): Promise<any> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_STUDENT_PROFILE_API_ENDPOINT || 'https://6ll9oei3u3.execute-api.us-west-2.amazonaws.com/dev/getStudentProfile';
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studentID: studentId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch student profile: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.statusCode !== 200) {
    throw new Error('API returned error status');
  }

  return typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
}

export async function getChatHistory(teacherId: string, classId?: string): Promise<ChatHistoryItem[]> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT || 'https://6ll9oei3u3.execute-api.us-west-2.amazonaws.com/dev/getChatHistory';
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teacherId,
      classId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat history: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.statusCode !== 200) {
    throw new Error('API returned error status');
  }

  return typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
}

export async function getChatMessages(teacherId: string, conversationId: string): Promise<ChatMessageItem[]> {
  const API_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT || 'https://6ll9oei3u3.execute-api.us-west-2.amazonaws.com/dev/getChatHistory';
  
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teacherId,
      conversationId
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat messages: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.statusCode !== 200) {
    throw new Error('API returned error status');
  }

  return typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
}