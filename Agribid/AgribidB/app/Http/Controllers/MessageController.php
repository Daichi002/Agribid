<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\MessagesNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use App\Events\MessageSent;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    // Send a new message
    public function sendMessage(Request $request)
{
    $request->validate([
        'text' => 'nullable|string|required_without:image',
        'receiver_id' => 'required|exists:users,id',
        'product_id' => 'required|exists:products,id',
        'sender_id' => 'required|exists:users,id',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048|required_without:text',
    ]);

    try {
        $imageName = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = Str::random(10) . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('public/message/images', $imageName);
            $validatedData['image'] = $imageName;
        } else {
            $validatedData['image'] = null;
        }

        // Sanitize the text input conditionally
        $text = $request->input('text');
        $dangerousPatterns = [
            '/<script.*?>.*?<\/script>/is', // JavaScript tags
            '/<.*?>/', // HTML tags
            '/(alert\()/' // JavaScript alert
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
                break;
            }
        }

        if ($imageName) {
            $text = $imageName;
        }

        // Check if the session exists in the Message table for the sender/receiver/product combo
        $existingSession = Message::where('product_id', $request->product_id)
            ->where(function ($query) use ($request) {
                $query->where('sender_id', $request->sender_id)
                    ->where('receiver_id', $request->receiver_id)
                    ->orWhere('sender_id', $request->receiver_id)
                    ->where('receiver_id', $request->sender_id);
            })
            ->max('sessions');

        // Determine the session ID
        $newSession = $existingSession ? $existingSession : (Message::max('sessions') + 1);

        // Create the message in the Message table
        $message = Message::create([
            'text' => $text,
            'sender_id' => $request->sender_id,
            'receiver_id' => $request->receiver_id,
            'product_id' => $request->product_id,
            'sessions' => $newSession,
        ]);

        // Now handle the MessagesNotification table logic separately
        $notification = MessagesNotification::where('sessions', $newSession)->first();

        if ($notification) {
            // If the session exists, update the existing notification
            $notification->update([
                'sendId' => $request->sender_id,
                'receiveId' => $request->receiver_id,
                'productId' => $request->product_id,
                'message' => $text,
                'sessions' => $newSession,
                'isRead' => false,  // Mark as unread (or change as needed)
            ]);
        } else {
            // If no session exists, create a new notification
            MessagesNotification::create([
                'sendId' => $request->sender_id,
                'message' => $text,
                'receiveId' => $request->receiver_id,
                'productId' => $request->product_id,
                'sessions' => $newSession,
                'isRead' => false,  // Default to unread
            ]);
        }

        // Log the message just before broadcasting
        Log::info('Message Created and Ready to Broadcast:', ['message' => $message]);

        // Fetch the full message with relationships before broadcasting
        $message = Message::with('sender', 'receiver')->find($message->id);

        // Broadcast the message to the receiver
        broadcast(new MessageSent($message))->toOthers();

        // Log after broadcasting
        Log::info('Message Broadcasted Successfully:', ['message' => $message]);

        return response()->json([
            'message' => $message,
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error creating product: ' . $e->getMessage());
        return response()->json([
            'message' => 'Something went wrong while creating the product!',
            'error' => $e->getMessage()
        ], 500);
    }
}

    



public function checkSession(Request $request)
{
    $productId = $request->input('product_id');
    $senderId = $request->input('sender_id');
    $receiverId = $request->input('receiver_id');

    // Check if a session already exists for these users and product
    $existingSession = Message::where('product_id', $productId)
                              ->where(function ($query) use ($senderId, $receiverId) {
                                  $query->where('sender_id', $senderId)
                                        ->where('receiver_id', $receiverId)
                                        ->orWhere('sender_id', $receiverId)
                                        ->where('receiver_id', $senderId);
                              })
                              ->max('sessions');

    return response()->json(['session' => $existingSession]);
}

public function getMaxSession()
{
    $maxSession = Message::max('sessions');
    return response()->json(['maxSession' => $maxSession]);
}


   // Get messages for a specific receiver by sessions
public function getMessages(Request $request) {
    $productId = $request->input('productId');
    $sessions = $request->input('sessions');

    // Fetch messages that match productId and session
    $messages = Message::where('product_id', $productId)
                        ->where('sessions', $sessions)
                        ->with('sender', 'receiver')  // Eager load sender and receiver relationships
                        ->get();

    Log::info('Fetched Messages:', $messages->toArray()); 

    return response()->json($messages);
}

    // Get messages for a specific receiver for sender
    public function getMessagesender(Request $request) {
        $productId = $request->input('productId');
        $senderId = $request->input('senderId');
        $receiverId = $request->input('receiverId');
    
        // Fetch messages that match productId and either sender-receiver combination
        $messages = Message::where('product_id', $productId)
                            ->where(function($query) use ($senderId, $receiverId) {
                                $query->where('sender_id', $senderId)
                                      ->where('receiver_id', $receiverId)
                                      ->orWhere(function($query) use ($senderId, $receiverId) {
                                          $query->where('sender_id', $receiverId)
                                                ->where('receiver_id', $senderId);
                                      });
                            })
                            ->with('sender', 'receiver')  // Eager load sender relationship
                            ->get();

                

    Log::info('Fetched Messages:', $messages->toArray()); 
    
        return response()->json($messages);
    }


    // public function getMessagesUser()
    // {
    //     $userId = Auth::id();

    //     if (!$userId) {
    //         return response()->json(['success' => false, 'message' => 'User not authenticated.'], 401);
    //     }

    //     try {
    //         $messages = Message::where('sender_id', $userId)
    //                             ->orWhere('receiver_id', $userId)
    //                             ->with([
    //                                 'sender',
    //                                 'receiver',
    //                                 'product' => function ($query) {
    //                                     $query->select('id', 'image'); // Only select `id` and `image` from the `product` table
    //                                 },
    //                             ])
    //                             ->get();

    //                             if ($messages->isEmpty()) {
    //                                 return response()->json([], 200); // Change to 200 OK with an empty array
    //                             }

    //         $groupedMessages = $messages->reduce(function ($acc, $message) {
    //             $session = $message->sessions;
    //             if (!isset($acc[$session])) {
    //                 $acc[$session] = ['first' => $message, 'latest' => $message];
    //             } else {
    //                 if (strtotime($message->created_at) < strtotime($acc[$session]['first']->created_at)) {
    //                     $acc[$session]['first'] = $message;
    //                 }
    //                 if (strtotime($message->updated_at) > strtotime($acc[$session]['latest']->updated_at)) {
    //                     $acc[$session]['latest'] = $message;
    //                 }
    //             }
    //             return $acc;
    //         }, []);

    //         $groupedMessagesArray = array_values($groupedMessages);
    //         Log::info('Grouped Messages Array:', $groupedMessagesArray);

    //         return response()->json($groupedMessagesArray, 200);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => 'Server error.'], 500);
    //     }
    // }
    
    

    // Get receiver data by receiverId
    public function getReceiverData(int $receiverId): JsonResponse
    {
        // Fetch receiver details from the users table
        $receiver = User::find($receiverId);

        if (!$receiver) {
            return response()->json(['message' => 'Receiver not found'], 404);
        }

        // Return receiver data
        return response()->json($receiver);
    }

    public function getMessageslistgeneral(Request $request) {
        $productId = $request->input('Id');
    
        // Fetch messages that match the productId along with sender data
        $messages = Message::where('product_id', $productId)
                            ->with('sender') // Eager load the sender relationship
                            ->get();
    
        return response()->json($messages);
    }

    public function getMessageslist(Request $request) {
        $productId = $request->input('productId');
    
        // Fetch all messages for the productId
        $messages = Message::where('product_id', $productId)
                            ->with('sender') // Eager load the sender relationship
                            ->orderBy('created_at')
                            ->get();
    
        // Group messages by session
        $groupedMessages = $messages->groupBy('sessions');
    
        $result = [];
    
        foreach ($groupedMessages as $sessionMessages) {
            // Get the first created message in the session
            $firstMessage = $sessionMessages->first();
    
            // Get the latest created message in the session
            $latestMessage = $sessionMessages->last();
    
            $result[] = ['first' => $firstMessage, 'latest' => $latestMessage];
        }
    
        return response()->json($result);
    }

    

    public function markAsRead($id)
{
    $Message = Message::find($id);
    Log::info('Marking comment as read:', ['Message' => $Message]);
    if ($Message) {
        $Message->isRead = true;
        $Message->save();
        return response()->json(['success' => true, 'message' => 'Message marked as read']);
    }
    return response()->json(['success' => false, 'message' => 'Message not found'], 404);
}

    // Delete a message
    public function deleteMessage($id)
    {
        $message = Message::findOrFail($id);
        $message->delete();

        return response()->json(null, 204);
    }
}
