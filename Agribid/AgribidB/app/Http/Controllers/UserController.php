<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log; 
use Illuminate\Support\Facades\createToken;
use Illuminate\Support\Facades\Validator; 

class UserController extends Controller
{
    public function register(Request $request)
{
    // Validate the request data
    $validatedData = $request->validate([
        'Firstname' => 'required|string|max:255',
        'Lastname' => 'required|string|max:255',
        'Phonenumber' => 'required|string|max:15|unique:users,Phonenumber',
        'Address' => 'required|string|max:255',
        'password' => 'required|string|min:6|max:255',
    ]);

    // Check if the phone number already exists
    if (User::where('Phonenumber', $validatedData['Phonenumber'])->exists()) {
        return response()->json([
            'message' => 'Phone number already exists.'
        ], 409); // Conflict status code
    }

    // Sanitize the input data
    $firstname = htmlspecialchars($validatedData['Firstname'], ENT_QUOTES, 'UTF-8');
    $lastname = htmlspecialchars($validatedData['Lastname'], ENT_QUOTES, 'UTF-8');
    $phonenumber = htmlspecialchars($validatedData['Phonenumber'], ENT_QUOTES, 'UTF-8');
    $address = htmlspecialchars($validatedData['Address'], ENT_QUOTES, 'UTF-8');
    $password = htmlspecialchars($validatedData['password'], ENT_QUOTES, 'UTF-8');

    // Create a new user
    $user = User::create([
        'Firstname' => $firstname,
        'Lastname' => $lastname,
        'Phonenumber' => $phonenumber,
        'Address' => $address,
        'password' => Hash::make($password), // Hash the password
    ]);

    // Return a success response
    return response()->json([
        'user' => $user,
        'message' => 'User registered successfully!'
    ], 201);
}


    public function login(Request $request)
    {
        // Validate the input data
        $validatedData = $request->validate([
            'Phonenumber' => 'required|string|max:15',
            'password' => 'required|string|min:6|max:255',
        ], [
            'password.min' => 'Password must be at least 6 characters long.',
        ]);

        // Sanitize the input data
        $phonenumber = htmlspecialchars($validatedData['Phonenumber'], ENT_QUOTES, 'UTF-8');
        $password = htmlspecialchars($validatedData['password'], ENT_QUOTES, 'UTF-8');

        // Attempt to authenticate the user
        if (!Auth::attempt(['Phonenumber' => $phonenumber, 'password' => $password])) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get the authenticated user
        $user = Auth::user();

        // Create a token for the user
      // @phpcs:disable
        $token = $user->createToken('authToken')->plainTextToken;// @phpcs:enable
        
        // Return the token and user data in the response
        return response()->json([
            'token' => $token,
            'user' => $user  // This will include user details like name, email, etc.
        ]);
    }


    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'Firstname' => 'required|string|max:255',
            'Lastname' => 'required|string|max:255',
            'phoneNumber' => 'required|string|max:15',
            'address' => 'required|string|max:255',
        ]);
    
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
    
        try {
            $user = User::findOrFail($id);
    
            // Sanitize the input data
            $firstname = htmlspecialchars($request->input('Firstname'), ENT_QUOTES, 'UTF-8');
            $lastname = htmlspecialchars($request->input('Lastname'), ENT_QUOTES, 'UTF-8');
            $phoneNumber = htmlspecialchars($request->input('phoneNumber'), ENT_QUOTES, 'UTF-8');
            $address = htmlspecialchars($request->input('address'), ENT_QUOTES, 'UTF-8');
    
            $user->Firstname = $firstname;
            $user->Lastname = $lastname;
            $user->phoneNumber = $phoneNumber;
            $user->address = $address;
            $user->save();
    
            return response()->json(['message' => 'User details updated successfully!', 'user' => $user], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'User not found or another error occurred.', 'error' => $e->getMessage()], 400);
        }
    }
    

        public function logout(Request $request)
        {
            try {
                $token = $request->bearerToken();
                $tokenRecord = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        
                if ($tokenRecord) {
                    // Set the token's expiry time to the current time
                    $tokenRecord->expires_at = now();
                    $tokenRecord->save();
                }
        
                // Invalidate the user's session
                Auth::guard('web')->logout();
        
                return response()->json(['message' => 'Successfully logged out.']);
            } catch (\Exception $e) {
                // Log the exception for further investigation
                Log::error('Logout error: ' . $e->getMessage());
        
                return response()->json(['message' => 'Logout failed.'], 500);
            }
        }
        


}
