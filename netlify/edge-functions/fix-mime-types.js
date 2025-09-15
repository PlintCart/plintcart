export default async (request, context) => {
  // Get the response from the origin
  const response = await context.next();
  
  // Get the URL path
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Force correct MIME types for JavaScript files
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs') || pathname.endsWith('.tsx')) {
    // Clone the response and modify headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
    
    return newResponse;
  }
  
  // For CSS files
  if (pathname.endsWith('.css')) {
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
    
    return newResponse;
  }
  
  // For all other requests, return the original response
  return response;
};
