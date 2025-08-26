import StudentChatPageClient from './StudentChatPageClient';

export function generateStaticParams() {
  return [{ classId: 'placeholder', studentId: 'placeholder' }];
}

export default function StudentChatPage() {
  return <StudentChatPageClient />;
}