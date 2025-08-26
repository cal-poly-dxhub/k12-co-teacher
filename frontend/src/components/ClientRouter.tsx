"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function ClientRouter({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Handle client-side routing for dynamic routes
    const handleRouting = () => {
      // Check if we're on a dynamic route that needs special handling
      if (pathname.includes('/chat/') && pathname.includes('/student/')) {
        // This is a student chat route - ensure it's properly handled
        const pathParts = pathname.split('/');
        const classIdIndex = pathParts.indexOf('chat') + 1;
        const studentIdIndex = pathParts.indexOf('student') + 1;
        
        if (classIdIndex > 0 && studentIdIndex > 0) {
          const classId = pathParts[classIdIndex];
          const studentId = pathParts[studentIdIndex];
          
          if (classId && studentId) {
            // Route is valid, no action needed
            return;
          }
        }
      }
    };

    handleRouting();
  }, [pathname, isClient, router]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}