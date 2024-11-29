<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\MessagesNotification;
use App\Models\Comment;


class NotificationController extends Controller
{
    public function getnotifIsRead(Request $request)
    {
        try {
            // Get the logged-in user's ID
            $userId = $request->user()->id;
    
            // Fetch all notifications for the user where isRead is false
            $notifications = Notification::where('for', $userId)
                ->where('isRead', false)
                ->get();
    
            // Count the unread notifications
            $unreadCount = $notifications->count();
    
            // Return the notifications and unread count
            return response()->json([
                'success' => true,
                'unread_count' => $unreadCount,
                'notifications' => $notifications,
            ], 200);
        } catch (\Exception $e) {
            // Log the error and return a response
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notifications.',
            ], 500);
        }
    }
    



            public function getnotif(Request $request)
            {
                $userId = $request->user()->id;
                Log::info("Fetching notifications for user ID: " . $userId);

                try {
                    // Fetch notifications where the 'for' column matches the logged-in user's ID
                    $notifications = Notification::where('for', $userId)
                        ->with(['user:id,Firstname,Lastname', 'product:id,title,image']) // Include related user and product data
                        ->get();

                    if ($notifications->isEmpty()) {
                        Log::info("No notifications found for user ID: " . $userId);
                        return response()->json(['message' => 'No notifications found for this user'], 200);
                    }

                    // Transform the notifications to include user and product details
                    $notificationsWithDetails = $notifications->map(function ($notification) {
                        return [
                            'id' => $notification->id,
                            'created_at' => $notification->created_at,
                            'isRead' => $notification->isRead,
                            'type' => $notification->type,
                            'resource' => $notification->resource,
                            'userId' => $notification->userId,
                            'user' => [
                                'Firstname' => $notification->user->Firstname,
                                'Lastname' => $notification->user->Lastname,
                            ],
                            'from' => [
                                'id' => $notification->product->id,
                                'title' => $notification->product->title,
                                'image' => $notification->product->image,
                            ],
                        ];
                    });

                    // Return the notifications with user and product details
                    return response()->json([
                        'notifications' => $notificationsWithDetails,
                    ], 200);
                } catch (\Exception $e) {
                    Log::error('Error fetching notifications: ' . $e->getMessage());
                    return response()->json(['error' => 'An error occurred while fetching notifications'], 500);
                }
            }



            public function markAsRead($id)
            {
                // Find the notification by ID
                $notification = Notification::find($id);
                Log::info('Marking notification as read:', ['notification' => $notification]);

                if ($notification) {
                    // Mark the notification as read
                    $notification->isRead = true;
                    $notification->save();

                    // Return success response
                    return response()->json(['success' => true, 'message' => 'Notification marked as read']);
                }

                // Return error if notification is not found
                return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
            }



            public function messagenotication($id)
            {
                // Find the notification by ID
                $notification = Notification::find($id);
                Log::info('Marking notification as read:', ['notification' => $notification]);

                if ($notification) {
                    // Mark the notification as read
                    $notification->isRead = true;
                    $notification->save();

                    // Return success response
                    return response()->json(['success' => true, 'message' => 'Notification marked as read']);
                }

                // Return error if notification is not found
                return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
            }





            // function to get all messages


            public function getMessageSender(Request $request)
    {
    try {
        // Get the logged-in user's ID
        $userId = auth()->id();

        if (!$userId) {
            return response()->json([
                'message' => 'Unauthorized: User not logged in.',
            ], 401);
        }

        // Retrieve messages using Eloquent relationships
        $messages = MessagesNotification::with(['sender:id,Firstname,Lastname', 'receive:id,Firstname,Lastname', 'product:id,user_id,image'])
            ->where(function ($query) use ($userId) {
                $query->where('sendId', $userId)
                      ->orWhere('receiveId', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Filter out messages where the product's user_id matches the logged-in user's id
        $filteredMessages = $messages->filter(function ($message) use ($userId) {
            return $message->product->user_id !== $userId;
        });

        // Format the response to include the counterpart's details
        $formattedMessages = $filteredMessages->map(function ($message) use ($userId) {
            // Check if the user is the sender or receiver
            if ($message->sendId === $userId) {
                $counterpart = $message->receive; // Receiver's details
            } else {
                $counterpart = $message->sender; // Sender's details
            }

            return [
                'id' => $message->id,
                'message' => $message->message,
                'isRead' => $message->isRead,
                'sendId' => $message->sendId,
                'receiveId' => $message->receiveId,
                'sessions' => $message->sessions,
                'created_at' => $message->created_at,
                'counterpart' => [
                    'id' => $counterpart->id,
                    'Firstname' => $counterpart->Firstname,
                    'Lastname' => $counterpart->Lastname,
                ],
                'product' => [
                    'id' => $message->product->id,
                    'user_id' => $message->product->user_id,
                    'image' => $message->product->image,
                ],
                'currentuserId' => $userId,
            ];
        });

        return response()->json([
            'success' => true,
            'messages' => $formattedMessages,
        ], 200);
    } catch (\Exception $e) {
        // Log the error for debugging
        Log::error('Error retrieving messages for user: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'An error occurred while retrieving messages.',
            'error' => $e->getMessage(),
        ], 500);
    }
    }





    public function getMessageReceiver(Request $request)
{
    try {
        // Get the logged-in user's ID
        $userId = auth()->id();

        if (!$userId) {
            return response()->json([
                'message' => 'Unauthorized: User not logged in.',
            ], 401);
        }

        // Retrieve all products for the logged-in user
        $products = Product::where('user_id', $userId)->get();

        $response = [];

        // Iterate through each product and fetch its messages
        foreach ($products as $product) {
            // Retrieve the messages related to the current product (use productId instead of product_id)
            $messages = MessagesNotification::with(['sender:id,Firstname,Lastname', 'receive:id,Firstname,Lastname', 'product:id,user_id,image'])
                ->where('productId', $product->id) // Corrected column name to productId
                ->orderBy('created_at', 'desc')
                ->get();

            // Format the messages for this product
            $formattedMessages = $messages->map(function ($message) use ($userId) {
                // Check if the user is the sender or receiver
                if ($message->sendId === $userId) {
                    $counterpart = $message->receive; // Receiver's details
                } else {
                    $counterpart = $message->sender; // Sender's details
                }

                return [
                    'id' => $message->id,
                    'message' => $message->message,
                    'isRead' => $message->isRead,
                    'sendId' => $message->sendId,
                    'receiveId' => $message->receiveId,
                    'sessions' => $message->sessions,
                    'created_at' => $message->updated_at,
                    'counterpart' => [
                        'id' => $counterpart->id,
                        'Firstname' => $counterpart->Firstname,
                        'Lastname' => $counterpart->Lastname,
                    ],
                    'product' => [
                        'id' => $message->product->id,
                        'user_id' => $message->product->user_id,
                        'image' => $message->product->image,
                    ],
                    'currentuserId' => $userId,
                ];
            });

            // Add product details and associated messages (or empty array if no messages)
            $response[] = [
                'product' => [
                    'id' => $product->id,
                    'title' => $product->title,
                    'image' => $product->image,
                ],
                'messages' => $formattedMessages->isEmpty() ? [] : $formattedMessages,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $response,
        ], 200);
    } catch (\Exception $e) {
        // Log the error for debugging
        Log::error('Error retrieving messages for user: ' . $e->getMessage());

        return response()->json([
            'success' => false,
            'message' => 'An error occurred while retrieving messages.',
            'error' => $e->getMessage(),
        ], 500);
    }
}




            






public function markAsReadmessage($id)
{
    // Find the notification by ID in the MessagesNotification table
    $messageNotification = MessagesNotification::find($id);
    Log::info('Marking message notification as read:', ['messageNotification' => $messageNotification]);

    if ($messageNotification) {
        // Check if the notification is already marked as read
        if ($messageNotification->isRead) {
            return response()->json(['success' => true, 'message' => 'Message notification is already marked as read']);
        }

        // Temporarily disable the timestamps update for this operation
        $messageNotification->timestamps = false;

        // Mark the notification as read without updating the updated_at field
        $messageNotification->isRead = true;
        $messageNotification->save();

        // Re-enable timestamps after the operation
        $messageNotification->timestamps = true;

        // Return success response
        return response()->json(['success' => true, 'message' => 'Message notification marked as read']);
    }

    // Return error if notification is not found
    return response()->json(['success' => false, 'message' => 'Message notification not found'], 404);
}





public function getUnreadMessagesUser()
{
    // Get the currently authenticated user
    $userId = auth()->user()->id; // Get the logged-in user's ID

    // Find unread messages for the logged-in user (receiver)
    $unreadMessages = MessagesNotification::where('receiver_id', $userId)
                                          ->where('isRead', 0) // Filter by isRead = 0 (unread)
                                          ->get();

    // Count how many unread messages are there
    $unreadCount = $unreadMessages->count();

    // If there are unread messages, return count and status true
    if ($unreadCount > 0) {
        return response()->json([
            'status' => true,
            'unreadCount' => $unreadCount
        ]);
    }

    // If there are no unread messages, return status false
    return response()->json([
        'status' => false,
        'unreadCount' => 0
    ]);
}







            







}
