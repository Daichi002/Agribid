<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Otp;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OtpController extends Controller
{

    public function sendOtp(Request $request)
    {
        // Validate the Philippine mobile number format
        $request->validate([
            'to' => 'required|string|regex:/^\+63[0-9]{10}$/',
        ]);
    
        // Generate a random OTP
        $otp = rand(100000, 999999);
    
        // Save OTP to the database with an expiration time
        Otp::updateOrCreate(
            ['phone_number' => $request->to],
            ['otp' => $otp, 'expires_at' => Carbon::now()->addMinutes(5)]
        );
    
        // Define the API endpoint and token for iProgTech
        $apiUrl = 'https://sms.iprogtech.com/api/v1/sms_messages';
        $apiToken = '547671b1aa47d4f15c6de3f6412d5c81e581d501';
    
        // Prepare the payload
        $payload = [
            'api_token' => $apiToken,
            'phone_number' => $request->to,
            'message' => "Hi from Agribid team!\n\n" .
                         "Your OTP is: $otp\n\n" .
                         "If you did not create this OTP, please ignore this message.\n" .
                         "Do not share your OTP, and do not reply to this message as this is automated.",
        ];
    
        // Send OTP via iProgTech API
        try {
            $response = Http::post($apiUrl, $payload);
    
            if ($response->successful()) {
                return response()->json(['status' => 'OTP sent!'], 200);
            } else {
                return response()->json(['error' => 'Failed to send OTP.'], 500);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'to' => 'required|string|regex:/^\+63[0-9]{10}$/',
            'otp' => 'required|numeric',
        ]);
    
        // Retrieve OTP record from the database
        $otpRecord = Otp::where('phone_number', $request->to)->first();
    
        // Check if OTP exists, matches, and is not expired
        if ($otpRecord && $otpRecord->otp == $request->otp && Carbon::now()->lessThanOrEqualTo($otpRecord->expires_at)) {
            // OTP is valid, delete it from the database
            $otpRecord->delete();

             // Log success response
        Log::info('OTP verification successful:', ['status' => 'OTP verified!']);
            return response()->json(['status' => 'OTP verified!'], 200);
        }
         // Log failure response
    Log::info('OTP verification failed:', ['error' => 'Invalid or expired OTP!']);
    
        return response()->json(['error' => 'Invalid or expired OTP!'], 400);
    }
}
