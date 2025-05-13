# Response Handler Framework Examples

This document provides examples of how to use the API response handler utilities with popular JavaScript frameworks.

## React Example

```tsx
// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { processResponse } from './api-response-handler';

interface ApiOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const request = useCallback(async (options: ApiOptions<T>) => {
    const { 
      url, 
      method = 'GET', 
      body, 
      headers = {}, 
      onSuccess, 
      onError 
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const responseData = await response.json();
      
      // Process the response using our utility
      const processed = processResponse<T>(responseData, {
        onSuccess,
        onError,
      });

      setState({
        data: processed.data,
        loading: false,
        error: processed.success ? null : processed.message,
        success: processed.success,
      });

      return processed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      });

      if (onError) {
        onError(errorMessage);
      }

      return {
        data: null as unknown as T,
        success: false,
        message: errorMessage,
        isWrappedFormat: false,
      };
    }
  }, []);

  return {
    ...state,
    request,
  };
}

// Usage in a component:
// src/components/UserProfile.tsx
import { useApi } from '../hooks/useApi';
import { User } from '../types';

export function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, request } = useApi<User>();

  useEffect(() => {
    request({
      url: `/api/users/${userId}`,
      onSuccess: (userData) => {
        console.log('User data loaded successfully:', userData);
      },
      onError: (message) => {
        console.error('Failed to load user data:', message);
      }
    });
  }, [userId, request]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user data</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      {/* Other user details */}
    </div>
  );
}
```

## Angular Example

```typescript
// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { processResponse } from './api-response-handler';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(url: string, options: {
    headers?: HttpHeaders,
    legacySuccessProperty?: string,
    fallbackMessage?: string
  } = {}): Observable<T> {
    return this.http.get(url, { headers: options.headers }).pipe(
      map(response => {
        const processed = processResponse<T>(response, {
          legacySuccessProperty: options.legacySuccessProperty,
          fallbackMessage: options.fallbackMessage
        });

        if (!processed.success) {
          throw new Error(processed.message);
        }

        return processed.data;
      }),
      catchError(error => {
        const message = error.message || 'Unknown error';
        return throwError(() => new Error(message));
      })
    );
  }

  post<T>(url: string, body: any, options: {
    headers?: HttpHeaders,
    legacySuccessProperty?: string,
    fallbackMessage?: string
  } = {}): Observable<T> {
    return this.http.post(url, body, { headers: options.headers }).pipe(
      map(response => {
        const processed = processResponse<T>(response, {
          legacySuccessProperty: options.legacySuccessProperty,
          fallbackMessage: options.fallbackMessage
        });

        if (!processed.success) {
          throw new Error(processed.message);
        }

        return processed.data;
      }),
      catchError(error => {
        const message = error.message || 'Unknown error';
        return throwError(() => new Error(message));
      })
    );
  }

  // Similarly implement put, delete, etc.
}

// Usage in a component:
// src/app/components/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(userId: string): void {
    this.loading = true;
    this.apiService.get<User>(`/api/users/${userId}`).subscribe({
      next: (data) => {
        this.user = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
        this.user = null;
      }
    });
  }
}
```

## Vue Example

```typescript
// src/composables/useApi.ts
import { ref, Ref } from 'vue';
import { processResponse } from './api-response-handler';

interface ApiOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (message: string) => void;
}

export function useApi<T>() {
  const data: Ref<T | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  const request = async (options: ApiOptions<T>) => {
    const { 
      url, 
      method = 'GET', 
      body, 
      headers = {}, 
      onSuccess, 
      onError 
    } = options;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const responseData = await response.json();
      
      // Process the response using our utility
      const processed = processResponse<T>(responseData, {
        onSuccess,
        onError,
      });

      data.value = processed.data;
      loading.value = false;
      error.value = processed.success ? null : processed.message;
      success.value = processed.success;

      return processed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      data.value = null;
      loading.value = false;
      error.value = errorMessage;
      success.value = false;

      if (onError) {
        onError(errorMessage);
      }

      return {
        data: null as unknown as T,
        success: false,
        message: errorMessage,
        isWrappedFormat: false,
      };
    }
  };

  return {
    data,
    loading,
    error,
    success,
    request,
  };
}

// Usage in a component:
// src/components/UserProfile.vue
<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="data">
      <h1>{{ data.name }}</h1>
      <p>Email: {{ data.email }}</p>
      <!-- Other user details -->
    </div>
    <div v-else>No user data</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { User } from '../types';
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = route.params.id as string;

const { data, loading, error, request } = useApi<User>();

onMounted(() => {
  request({
    url: `/api/users/${userId}`,
    onSuccess: (userData) => {
      console.log('User data loaded successfully:', userData);
    },
    onError: (message) => {
      console.error('Failed to load user data:', message);
    }
  });
});
</script>
```

## Next.js Example

```tsx
// src/lib/api.ts
import { processResponse } from './api-response-handler';

export async function fetchApi<T>(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  data: T | null;
  success: boolean;
  message: string;
}> {
  try {
    const { method = 'GET', body, headers = {} } = options;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const responseData = await response.json();
    
    // Process the response using our utility
    const processed = processResponse<T>(responseData);

    return {
      data: processed.data,
      success: processed.success,
      message: processed.message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      data: null,
      success: false,
      message: errorMessage,
    };
  }
}

// src/app/users/[id]/page.tsx
import { fetchApi } from '@/lib/api';
import { User } from '@/types';

export default async function UserProfile({ params }: { params: { id: string } }) {
  const { data: user, success, message } = await fetchApi<User>(`/api/users/${params.id}`);

  if (!success) {
    return <div>Error: {message}</div>;
  }

  if (!user) {
    return <div>No user data</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      {/* Other user details */}
    </div>
  );
}
``` 