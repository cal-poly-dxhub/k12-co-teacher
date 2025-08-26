const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build the app
console.log('Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed, creating fallback build...');
  
  // Create a simple SPA build
  execSync('npx next build', { stdio: 'inherit' });
  
  // Copy index.html to handle client-side routing
  const outDir = path.join(__dirname, 'out');
  const indexPath = path.join(outDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Create fallback pages for dynamic routes
    const dynamicRoutes = [
      'chat/[classId].html',
      'chat/[classId]/student/[studentId].html'
    ];
    
    dynamicRoutes.forEach(route => {
      const routePath = path.join(outDir, route);
      const routeDir = path.dirname(routePath);
      
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      
      fs.writeFileSync(routePath, indexContent);
    });
  }
}

console.log('Build complete! Upload the "out" folder to your S3 bucket.');