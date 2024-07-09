# API Documentation

## Overview
This API allows users to register, verify their registration, log in, and verify their login using Multi-Factor Authentication (MFA) with Time-based One-Time Passwords (TOTP). The endpoints provided handle the registration and login processes, including the sending and verification of TOTP codes.

## Endpoints

### Register Initiate
Initiates the registration process by sending a TOTP verification code to the user's email.

**URL:** `/register`

**Method:** `POST`

**Headers:**
- `Access-Control-Allow-Origin: *`

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phoneNumber": "string",
  "roleId": "integer"
}
```

**Responses:**
- `200 OK`: Verification code sent successfully.
  ```json
  { "message": "Verification code sent, please check your email." }
  ```
- `500 Internal Server Error`: Failed to send verification code.
  ```json
  { "message": "Failed to send verification code.", "error": "error message" }
  ```

### Verify and Complete Registration
Verifies the TOTP code sent to the user's email and completes the registration by saving the user data to the database.

**URL:** `/register/verify`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "string",
  "token": "string"
}
```

**Responses:**
- `201 Created`: User registered successfully.
  ```json
  { "message": "User registered successfully" }
  ```
- `400 Bad Request`: Email and token are required.
  ```json
  { "message": "Email and token are required." }
  ```
- `404 Not Found`: No secret found for the provided email.
  ```json
  { "message": "No secret found for the provided email." }
  ```
- `400 Bad Request`: Invalid verification code.
  ```json
  { "message": "Invalid verification code." }
  ```
- `500 Internal Server Error`: Database error or internal server error.
  ```json
  { "message": "Database error", "error": "error message" }
  ```

### Login Initiate
Initiates the login process by sending a TOTP verification code to the user's email.

**URL:** `/login`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Responses:**
- `200 OK`: Verification code sent successfully.
  ```json
  { "message": "Verification code sent, please check your email." }
  ```
- `404 Not Found`: User not found.
  ```json
  { "message": "User not found" }
  ```
- `401 Unauthorized`: Invalid password.
  ```json
  { "message": "Invalid password" }
  ```
- `500 Internal Server Error`: Failed to send verification code or database error.
  ```json
  { "message": "Failed to send verification code.", "error": "error message" }
  ```

### Verify and Complete Login
Verifies the TOTP code sent to the user's email and completes the login process by generating a JWT token.

**URL:** `/login/verify`

**Method:** `POST`

**Request Body:**
```json
{
  "email": "string",
  "token": "string",
  "password": "string"
}
```

**Responses:**
- `200 OK`: Login successful.
  ```json
  { "token": "jwt_token" }
  ```
- `400 Bad Request`: Email and token are required.
  ```json
  { "message": "Email and token are required." }
  ```
- `404 Not Found`: No secret found for the provided email or user not found.
  ```json
  { "message": "No secret found for the provided email." }
  ```
- `400 Bad Request`: Invalid verification code.
  ```json
  { "message": "Invalid verification code." }
  ```
- `401 Unauthorized`: Invalid password.
  ```json
  { "message": "Invalid password" }
  ```
- `500 Internal Server Error`: Internal server error.
  ```json
  { "message": "Internal server error" }
  ```

## Utility Functions

### bcrypt
- **Description:** Used for hashing passwords.

### jwtUtil
- **Description:** Utility for generating JWT tokens.

### MFA
- **Description:** Utility for sending and verifying TOTP codes.

### speakeasy
- **Description:** Library used for TOTP generation and verification.

## Database Configuration
- **connection:** Used to execute SQL queries to the database.

## Notes
- Make sure to replace placeholder strings with actual values.
- Ensure the necessary utilities and libraries (`bcryptjs`, `speakeasy`, etc.) are installed and configured correctly.
- Handle and log errors appropriately for better debugging and maintenance.