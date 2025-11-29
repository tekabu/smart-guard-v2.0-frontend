# Laravel Sanctum Stateful Authentication Setup

This document explains how the Vue.js frontend connects to Laravel API using Sanctum stateful authentication.

## Frontend Setup (Already Completed)

### Files Created:

1. **`/src/services/api.js`** - Axios instance configured for Sanctum
2. **`/src/services/auth.js`** - Authentication service (login, logout, register, etc.)
3. **`/src/stores/auth.js`** - Pinia store for authentication state management
4. **`.env`** - Environment variables for API URL

### Key Features:

- ✅ CSRF cookie handling
- ✅ Stateful authentication with cookies
- ✅ Global error handling
- ✅ Route guards (authentication middleware)
- ✅ User state management
- ✅ Form validation with Vuelidate

## Laravel Backend Setup (Required)

### 1. Install Laravel Sanctum

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 2. Configure Sanctum

#### `config/sanctum.php`

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8021,::1',
    env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

#### `.env`

```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000,localhost
```

**Note:** Backend API is running on port **8021**

### 3. Configure CORS

#### `config/cors.php`

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

### 4. Add Sanctum Middleware

#### `app/Http/Kernel.php`

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### 5. Create Authentication Routes

#### `routes/api.php`

```php
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

### 6. Create Auth Controller

#### `app/Http/Controllers/Auth/AuthController.php`

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful',
            'user' => Auth::user(),
        ]);
    }

    /**
     * Register new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);

        return response()->json([
            'message' => 'Registration successful',
            'user' => $user,
        ], 201);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout successful',
        ]);
    }
}
```

### 7. Update User Model

#### `app/Models/User.php`

Ensure `HasApiTokens` trait is added:

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // ... rest of the model
}
```

## Frontend Environment Variables

Update `.env` in the frontend project:

```env
VITE_API_URL=http://localhost:8021
VITE_APP_NAME=SmartGuard
```

## Testing the Integration

### 1. Start Laravel Backend

```bash
php artisan serve --port=8021
```

Backend will run on `http://localhost:8021`

### 2. Start Vue Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Test Login Flow

1. Navigate to `http://localhost:5173/auth/signin`
2. Enter credentials:
   - Email: `user@example.com`
   - Password: `password`
3. On successful login, you'll be redirected to `/dashboard`
4. User session will be maintained via cookies

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/sanctum/csrf-cookie` | Get CSRF cookie | No |
| POST | `/api/login` | Login user | No |
| POST | `/api/register` | Register new user | No |
| POST | `/api/logout` | Logout user | Yes |
| GET | `/api/user` | Get authenticated user | Yes |

## How Sanctum Stateful Works

1. **CSRF Protection**:
   - Frontend requests CSRF cookie from `/sanctum/csrf-cookie`
   - Laravel sets `XSRF-TOKEN` cookie
   - Axios automatically includes this in requests

2. **Session-Based Auth**:
   - After login, Laravel creates a session
   - Session cookie is automatically sent with requests
   - `withCredentials: true` in Axios ensures cookies are sent

3. **Authentication Check**:
   - Protected routes use `auth:sanctum` middleware
   - Laravel checks session for authenticated user
   - No need to manually send tokens

## Troubleshooting

### CORS Issues
- Ensure `SANCTUM_STATEFUL_DOMAINS` includes your frontend URL
- Check `supports_credentials: true` in CORS config

### CSRF Token Mismatch
- Clear browser cookies and try again
- Ensure `/sanctum/csrf-cookie` is called before login
- Check `SESSION_DOMAIN` matches your domain

### 401 Unauthorized
- Verify user credentials are correct
- Check Laravel session configuration
- Ensure cookies are being sent (check Network tab)

## Security Notes

- ✅ Always use HTTPS in production
- ✅ Set proper `SESSION_DOMAIN` in production
- ✅ Configure `SANCTUM_STATEFUL_DOMAINS` for production domains
- ✅ Use environment-specific CORS origins
- ✅ Enable CSRF protection (don't disable it)

## Additional Resources

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [Axios Documentation](https://axios-http.com/)
- [Pinia Store Documentation](https://pinia.vuejs.org/)
