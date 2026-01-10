#!/bin/bash

echo "========================================="
echo "Activity 10 API Testing Script"
echo "========================================="
echo ""

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 5

BASE_URL="http://localhost:3005"

echo ""
echo "========================================="
echo "1. Testing User Registration"
echo "========================================="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"test123","name":"Test User"}')
echo "$REGISTER_RESPONSE" | python -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

echo ""
echo "========================================="
echo "2. Testing User Login"
echo "========================================="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"test123"}')
echo "$LOGIN_RESPONSE" | python -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "JWT Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get authentication token"
  exit 1
fi

echo ""
echo "========================================="
echo "3. Testing Get All Events (Public)"
echo "========================================="
curl -s -X GET "$BASE_URL/events" | python -m json.tool 2>/dev/null || curl -s -X GET "$BASE_URL/events"

echo ""
echo "========================================="
echo "4. Testing Create Event (Authenticated)"
echo "========================================="
CREATE_EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title":"Test Event",
    "description":"This is a test event",
    "date":"2024-12-31",
    "time":"18:00",
    "location":"Test Location",
    "capacity":100,
    "organizerId":1
  }')
echo "$CREATE_EVENT_RESPONSE" | python -m json.tool 2>/dev/null || echo "$CREATE_EVENT_RESPONSE"

# Extract event ID
EVENT_ID=$(echo "$CREATE_EVENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo ""
echo "Created Event ID: $EVENT_ID"

if [ ! -z "$EVENT_ID" ]; then
  echo ""
  echo "========================================="
  echo "5. Testing Event Registration"
  echo "========================================="
  REGISTRATION_RESPONSE=$(curl -s -X POST "$BASE_URL/registrations/events/$EVENT_ID/register" \
    -H "Content-Type: application/json" \
    -d '{
      "userId":1,
      "userEmail":"testuser@example.com",
      "userName":"Test User"
    }')
  echo "$REGISTRATION_RESPONSE" | python -m json.tool 2>/dev/null || echo "$REGISTRATION_RESPONSE"
  
  # Extract registration ID
  REG_ID=$(echo "$REGISTRATION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ ! -z "$REG_ID" ]; then
    echo ""
    echo "========================================="
    echo "6. Testing Ticket Generation"
    echo "========================================="
    TICKET_RESPONSE=$(curl -s -X POST "$BASE_URL/tickets/generate" \
      -H "Content-Type: application/json" \
      -d "{\"eventId\":$EVENT_ID,\"registrationId\":$REG_ID}")
    echo "$TICKET_RESPONSE" | python -m json.tool 2>/dev/null || echo "$TICKET_RESPONSE"
    
    # Extract UUID
    UUID=$(echo "$TICKET_RESPONSE" | grep -o '"uuid":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$UUID" ]; then
      echo ""
      echo "========================================="
      echo "7. Testing Ticket Verification"
      echo "========================================="
      VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/tickets/verify" \
        -H "Content-Type: application/json" \
        -d "{\"uuid\":\"$UUID\"}")
      echo "$VERIFY_RESPONSE" | python -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"
    fi
  fi
fi

echo ""
echo "========================================="
echo "8. Testing Swagger Documentation"
echo "========================================="
SWAGGER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api-docs")
echo "Swagger UI HTTP Status: $SWAGGER_RESPONSE"
if [ "$SWAGGER_RESPONSE" = "200" ]; then
  echo "✓ Swagger documentation is accessible at $BASE_URL/api-docs"
else
  echo "✗ Swagger documentation is not accessible"
fi

echo ""
echo "========================================="
echo "Testing Complete!"
echo "========================================="
