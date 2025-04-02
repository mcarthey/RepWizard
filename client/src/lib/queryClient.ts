import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

// Fetcher function for queries
interface GetQueryFnOptions {
  on401?: 'throwError' | 'returnNull';
  additionalHeaders?: Record<string, string>;
}

export const getQueryFn = (options: GetQueryFnOptions = {}) => {
  const { on401 = 'throwError', additionalHeaders = {} } = options;
  
  return async ({ queryKey }: { queryKey: string[] }) => {
    const url = queryKey[0];
    
    // Get standardizes the response handling
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      },
    });
    
    if (response.status === 401) {
      if (on401 === 'returnNull') {
        return null;
      }
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Check if there's content before trying to parse JSON
    const text = await response.text();
    if (!text) return null;
    
    return JSON.parse(text);
  };
};

// Function for POST, PUT, PATCH, DELETE mutations
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  additionalHeaders: Record<string, string> = {}
) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
    credentials: 'include',
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API error: ${response.status}`);
  }
  
  return response;
};