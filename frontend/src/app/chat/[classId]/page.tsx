import ChatPageClient from './ChatPageClient';

export function generateStaticParams() {
  return [{ classId: 'placeholder' }];
}

export default function ChatPage() {
  return <ChatPageClient />;
}