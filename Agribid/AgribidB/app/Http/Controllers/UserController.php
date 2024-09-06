<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function register(Request $request)
{
    // Validate the request data
    $validatedData = $request->validate([
        'Fname' => 'required|string|max:255',
        'Phonenumber' => 'required|string|max:15|unique:users,Phonenumber',
        'Address' => 'required|string|max:255',
        'password' => 'required|string|min:6|max:255',
    ]);

    // Create a new user
    $user = User::create([
        'Fullname' => $validatedData['Fname'],
        'Phonenumber' => $validatedData['Phonenumber'],
        'Address' => $validatedData['Address'],
        'password' => Hash::make($validatedData['password']), // Hash the password
    ]);

    // Return a success response
    return response()->json([
        'user' => $user,
        'message' => 'User registered successfully!'
    ], 201);
}

        public function login(Request $request)
            {
                $validatedData = $request->validate([
                    'Phonenumber' => 'required|string|max:15',
                    'password' => 'required|string|min:6|max:255',
                ]);

                if (!Auth::attempt($validatedData)) {
                    return response()->json(['message' => 'Unauthorized'], 401);
                }

                $user = Auth::user();
                $token = $user->createToken('authToken')->plainTextToken;

                return response()->json(['token' => $token]);
            }
}
