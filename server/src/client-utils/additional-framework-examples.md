# Additional Framework Examples

This document provides implementation examples for additional JavaScript frameworks and environments to work with our API response format transition.

## jQuery Example

```javascript
// utils/api-handler.js
function handleApiRequest(options) {
  const { 
    url, 
    method = 'GET', 
    data = null, 
    successCallback, 
    errorCallback 
  } = options;

  $.ajax({
    url,
    type: method,
    data: data ? JSON.stringify(data) : undefined,
    contentType: 'application/json',
    success: function(response) {
      // Determine if this is a wrapped response
      const isWrappedFormat = 
        response && 
        typeof response === 'object' && 
        'success' in response && 
        'data' in response;
      
      // Extract the actual data
      const responseData = isWrappedFormat ? response.data : response;
      
      // Check if the response indicates success
      const isSuccessful = isWrappedFormat 
        ? response.success === true 
        : (typeof response === 'object' && response.isCorrect === true);
      
      // Get any message
      const message = (response && typeof response === 'object' && 'message' in response)
        ? response.message
        : 'Operation completed';
      
      if (isSuccessful) {
        if (successCallback) successCallback(responseData, message);
      } else {
        if (errorCallback) errorCallback(message, responseData);
      }
    },
    error: function(xhr, status, error) {
      const errorMessage = xhr.responseJSON?.message || error || 'Unknown error';
      if (errorCallback) errorCallback(errorMessage);
    }
  });
}

// Usage example
$(document).ready(function() {
  $('#submit-answer-form').on('submit', function(e) {
    e.preventDefault();
    
    const sessionId = $(this).data('session-id');
    const questionId = $(this).data('question-id');
    const userResponse = $('input[name="answer"]:checked').val();
    
    handleApiRequest({
      url: '/api/assessment/submit',
      method: 'POST',
      data: {
        assessmentSessionId: sessionId,
        questionId: questionId,
        userResponse: userResponse
      },
      successCallback: function(data, message) {
        showSuccess(message);
        loadNextQuestion(sessionId);
      },
      errorCallback: function(message) {
        showError(message);
      }
    });
  });
});
```

## Express.js Backend Integration

```javascript
// utils/response-wrapper.js
function createResponseWrapper(data, message = 'Operation successful', success = true) {
  return {
    success,
    data,
    message
  };
}

function createHybridResponse(data, message = 'Operation successful', success = true) {
  // Create the wrapped format
  const wrappedResponse = createResponseWrapper(data, message, success);
  
  // For hybrid response, we combine the data properties with the wrapper
  if (data && typeof data === 'object') {
    return {
      ...data,          // Original DTO properties
      ...wrappedResponse // Wrapped response properties
    };
  }
  
  // If data isn't an object, just return the wrapped response
  return wrappedResponse;
}

function errorResponse(message = 'An error occurred', statusCode = 400) {
  return {
    success: false,
    data: null,
    message,
    statusCode
  };
}

module.exports = {
  createResponseWrapper,
  createHybridResponse,
  errorResponse
};

// Usage in Express routes:
// routes/assessment.js
const express = require('express');
const router = express.Router();
const { createHybridResponse, errorResponse } = require('../utils/response-wrapper');

router.post('/submit', async (req, res) => {
  try {
    const { assessmentSessionId, questionId, userResponse } = req.body;
    
    // Validate inputs
    if (!assessmentSessionId || !questionId || !userResponse) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }
    
    // Process the submission
    const result = await assessmentService.submitAnswer(
      assessmentSessionId, 
      questionId, 
      userResponse
    );
    
    // Return hybrid response with both formats
    return res.json(createHybridResponse(
      result,
      'Answer submitted successfully',
      result.isCorrect
    ));
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json(errorResponse(error.message || 'Failed to submit answer'));
  }
});

module.exports = router;
```

## Svelte Example

```svelte
<!-- src/lib/api.js -->
<script context="module">
  import { processResponse } from './api-response-handler';

  export async function apiRequest(url, options = {}) {
    const { 
      method = 'GET', 
      body = undefined, 
      headers = {}, 
      onSuccess, 
      onError 
    } = options;
    
    try {
      const fetchOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOptions.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      const processed = processResponse(data, { onSuccess, onError });
      return processed;
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      
      if (onError) {
        onError(errorMessage);
      }
      
      return {
        data: null,
        success: false,
        message: errorMessage,
        isWrappedFormat: false
      };
    }
  }
</script>

<!-- src/routes/assessment/[id]/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { apiRequest } from '$lib/api';
  
  let question = null;
  let loading = true;
  let error = null;
  let selectedAnswer = '';
  
  const sessionId = $page.params.id;
  
  async function loadQuestion() {
    loading = true;
    
    const result = await apiRequest(`/api/assessment/session/${sessionId}/next`, {
      onSuccess: (data) => {
        if (data.isComplete) {
          window.location.href = `/assessment/${sessionId}/results`;
        }
      },
      onError: (message) => {
        error = message;
      }
    });
    
    loading = false;
    
    if (result.success) {
      question = result.data.nextQuestion;
      error = null;
    }
  }
  
  async function submitAnswer() {
    if (!selectedAnswer) {
      error = 'Please select an answer';
      return;
    }
    
    loading = true;
    
    const result = await apiRequest('/api/assessment/submit', {
      method: 'POST',
      body: {
        assessmentSessionId: sessionId,
        questionId: question.id,
        userResponse: selectedAnswer
      }
    });
    
    loading = false;
    
    if (result.success) {
      // Load the next question
      loadQuestion();
    } else {
      error = result.message;
    }
  }
  
  onMount(loadQuestion);
</script>

{#if loading}
  <div class="loading">Loading...</div>
{:else if error}
  <div class="error">{error}</div>
{:else if question}
  <div class="question">
    <h2>{question.questionText}</h2>
    
    <div class="options">
      {#each question.options as option}
        <label>
          <input
            type="radio"
            name="answer"
            value={option.id}
            bind:group={selectedAnswer}
          />
          {option.text}
        </label>
      {/each}
    </div>
    
    <button on:click={submitAnswer} disabled={loading || !selectedAnswer}>
      Submit Answer
    </button>
  </div>
{:else}
  <div>No question available</div>
{/if}
```

## Flutter/Dart Example

```dart
// lib/utils/api_response_handler.dart
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String message;
  final bool isWrappedFormat;

  ApiResponse({
    required this.success,
    this.data,
    required this.message,
    required this.isWrappedFormat,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(Map<String, dynamic>) fromJson) {
    // Check if this is a wrapped response
    final isWrappedFormat = json.containsKey('success') && json.containsKey('data');
    
    if (isWrappedFormat) {
      return ApiResponse<T>(
        success: json['success'] ?? false,
        data: json['data'] != null ? fromJson(json['data']) : null,
        message: json['message'] ?? 'Operation completed',
        isWrappedFormat: true,
      );
    } else {
      // Legacy format - direct DTO
      return ApiResponse<T>(
        success: json['isCorrect'] ?? false,
        data: fromJson(json),
        message: json['message'] ?? 'Operation completed',
        isWrappedFormat: false,
      );
    }
  }
  
  // Helper for simple data types that don't need a fromJson converter
  factory ApiResponse.simpleFromJson(Map<String, dynamic> json) {
    final isWrappedFormat = json.containsKey('success') && json.containsKey('data');
    
    return ApiResponse<T>(
      success: isWrappedFormat ? (json['success'] ?? false) : (json['isCorrect'] ?? false),
      data: isWrappedFormat ? json['data'] as T? : json as T,
      message: json['message'] ?? 'Operation completed',
      isWrappedFormat: isWrappedFormat,
    );
  }
}

// lib/api/assessment_api.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/question.dart';
import '../utils/api_response_handler.dart';

class AssessmentApi {
  final String baseUrl;
  final http.Client client;

  AssessmentApi({
    required this.baseUrl,
    http.Client? client,
  }) : this.client = client ?? http.Client();

  Future<ApiResponse<Question>> getNextQuestion(String sessionId) async {
    try {
      final response = await client.get(
        Uri.parse('$baseUrl/assessment/session/$sessionId/next'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to load question: ${response.statusCode}');
      }

      final jsonData = json.decode(response.body);
      return ApiResponse.fromJson(jsonData, (data) => Question.fromJson(data));
    } catch (e) {
      return ApiResponse(
        success: false,
        data: null,
        message: 'Error: ${e.toString()}',
        isWrappedFormat: false,
      );
    }
  }

  Future<ApiResponse<dynamic>> submitAnswer({
    required String sessionId,
    required String questionId,
    required String userResponse,
  }) async {
    try {
      final response = await client.post(
        Uri.parse('$baseUrl/assessment/submit'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'assessmentSessionId': sessionId,
          'questionId': questionId,
          'userResponse': userResponse,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to submit answer: ${response.statusCode}');
      }

      final jsonData = json.decode(response.body);
      return ApiResponse.simpleFromJson(jsonData);
    } catch (e) {
      return ApiResponse(
        success: false,
        data: null,
        message: 'Error: ${e.toString()}',
        isWrappedFormat: false,
      );
    }
  }
}

// Usage in a Flutter widget
import 'package:flutter/material.dart';
import '../api/assessment_api.dart';
import '../models/question.dart';

class AssessmentScreen extends StatefulWidget {
  final String sessionId;

  AssessmentScreen({required this.sessionId});

  @override
  _AssessmentScreenState createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  final AssessmentApi _api = AssessmentApi(baseUrl: 'https://api.example.com');
  Question? _question;
  String? _selectedAnswer;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadQuestion();
  }

  Future<void> _loadQuestion() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final response = await _api.getNextQuestion(widget.sessionId);

    setState(() {
      _loading = false;
      
      if (response.success) {
        _question = response.data;
        _selectedAnswer = null;
      } else {
        _error = response.message;
      }
    });
  }

  Future<void> _submitAnswer() async {
    if (_selectedAnswer == null || _question == null) {
      setState(() {
        _error = 'Please select an answer';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final response = await _api.submitAnswer(
      sessionId: widget.sessionId,
      questionId: _question!.id,
      userResponse: _selectedAnswer!,
    );

    if (response.success) {
      _loadQuestion();
    } else {
      setState(() {
        _loading = false;
        _error = response.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Assessment')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: TextStyle(color: Colors.red)),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadQuestion,
              child: Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (_question == null) {
      return Center(child: Text('No question available'));
    }

    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _question!.questionText,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          ..._question!.options.map((option) => 
            RadioListTile<String>(
              title: Text(option.text),
              value: option.id,
              groupValue: _selectedAnswer,
              onChanged: (value) {
                setState(() {
                  _selectedAnswer = value;
                });
              },
            ),
          ),
          SizedBox(height: 16),
          Center(
            child: ElevatedButton(
              onPressed: _selectedAnswer != null ? _submitAnswer : null,
              child: Text('Submit Answer'),
            ),
          ),
        ],
      ),
    );
  }
} 