<?php

// app/Http/Controllers/CommentController.php
namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Product;
use App\Models\Notification;
use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{


    public function store(Request $request)
    {
        // Validate incoming request
        $request->validate([
            'product_id' => 'required|exists:products,id',  // Ensure product exists
            'userId' => 'required|exists:users,id',          // Ensure user exists
            'text' => 'required|string|max:255',              // Ensure text is a valid string
        ]);
    
        // Create the comment
        $comment = Comment::create($request->all());
    
        // Fetch the product associated with the comment to get the 'user_id'
        $product = Product::find($request->product_id);
    
        // Ensure the user who created the product is different from the user posting the comment
        if ($product->user_id !== (int)$request->userId) {  // Cast to integer if needed
            // Create a notification for the user if they are different
            Notification::create([
                'userId' => $request->userId,  // The user ID for whom the notification is for
                'type' => 'comment',           // Type of notification
                'isRead' => false,             // Default value for 'isRead'
                'from' => $request->product_id, // The product related to the notification
                'for' => $product->user_id,    // The user who created the product, which is the "for" field
                'resource' => $request->text,  // The resource type for the notification
            ]);
        }
    
        return response()->json($comment, 201);  // Return the created comment
    }
    





    public function index($productId)
    {
        $comments = Comment::where('product_id', $productId)
            ->with('user') // Eager load user data
            ->get();

        return response()->json($comments);
    }



    
    public function notifComments(Request $request)
{
    // Retrieve the list of product IDs from the query parameter
    $productIds = explode(',', $request->query('productIds', ''));

    Log::info("Fetching notif for product IDs: " . implode(', ', $productIds));

    if (empty($productIds)) {
        return response()->json(['error' => 'No product IDs provided'], 400);
    }

    // Fetch comments for all product IDs, including user data and specific product fields
        $comments = Comment::whereIn('product_id', $productIds)
        ->with([
            'user' => function ($query) {
                $query->select('id', 'Firstname', 'Lastname'); // Specify the fields you want for the user
            },
            'product' => function ($query) {
                $query->select('id','user_id', 'title', 'image'); // Specify the fields you want for the product
            }
        ])
        ->get();

// Log::info("Fetched comments data:", ['comments' => $comments]);

    return response()->json($comments);
}


public function notifyreply($userId)
{
    Log::info("Fetching comments for user ID:", ['userId' => $userId]);
    return Comment::where('userId', $userId)
    ->select('id', 'product_id', 'userId')
        ->with([
            'product' => function ($query) {
                $query->select('id', 'title', 'image');
            }
        ])
        ->get();
}



public function notifycommentreply(Request $request)
{
    $commentIDs = $request->query('commentIds'); // Get comment IDs from the query parameter

    Log::info("Fetching replies for comment IDs:", ['commentIDs' => $commentIDs]);

    // Retrieve replies for each comment ID in the array
    $replies = Reply::whereIn('comment_id', explode(',', $commentIDs))
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'Firstname', 'Lastname'); // Specify the fields you want for the user
                    }])
                    ->get();
    
    Log::info("Replies found:", ['replies' => $replies]);

    return response()->json($replies);
}


    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->delete();
        Reply::where('comment_id', $id)->delete();

        return response()->json(null, 204);
    }

    public function destroyreplies($id)
    {
        $reply = Reply::findOrFail($id);
        $reply->delete();
    
        return response()->json(null, 204);
    }

    public function storereply(Request $request)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'comment_id' => 'required|exists:comments,id',  // Ensure the comment exists
            'user_id' => 'required|exists:users,id',        // Ensure the user exists
            'reply' => 'required|string',                    // Ensure the reply text is valid
        ]);
    
        // Create the reply
        $reply = Reply::create([
            'comment_id' => $validatedData['comment_id'],
            'user_id' => $validatedData['user_id'],
            'reply' => $validatedData['reply'],
        ]);
        
        // Get the associated comment to retrieve the user_id and product_id
        $comment = Comment::find($validatedData['comment_id']);
        
        // Get the user_id from the associated comment (this is the user the notification is for)
        $user_id_for_notification = $comment->userId; // Assuming user_id is available in the comments table
    
        // Check if the user who replied is the same as the user who commented
        if ($user_id_for_notification !== (int)$validatedData['user_id']) {
            // Get the product_id from the comment (this will be used as 'from' in the notification)
            $product_id = $comment->product_id;
    
            // Create a notification for the user
            Notification::create([
                'userId' => $validatedData['user_id'],      // The user who made the reply
                'type' => 'reply',                          // Type of notification
                'isRead' => false,                          // Default value for 'isRead'
                'from' => $product_id,                      // The product associated with the comment
                'for' => $user_id_for_notification,         // The user who is the "for" field (the comment's user)
                'resource' => $validatedData['reply'],      // The resource type for the notification
            ]);
        }
        
        // Fetch the reply with specific user data (firstname, lastname)
        $replyWithUser = Reply::with([
            'user:id,Firstname,Lastname',
            'comment.user' => function ($query) {
                $query->select('id', 'Firstname', 'Lastname');  // Only select necessary fields for comment user
            }
        ])
        ->find($reply->id);
    
        // Return the created reply with the user data
        return response()->json($replyWithUser, 201);
    }
    



    public function store_reply(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'comment_id' => 'required|exists:comments,id',
                'replies_to' => 'required|exists:replies,id',
                'user_id' => 'required|exists:users,id',
                'reply' => 'required|string',
            ]);
    
            Log::info('Validated Data:', $validatedData); // Log the validated data
    
            $reply = Reply::create([
                'comment_id' => $validatedData['comment_id'],
                'replies_to' => $validatedData['replies_to'],
                'user_id' => $validatedData['user_id'],
                'reply' => $validatedData['reply'],
            ]);
            
            // Fetch the reply with specific user data (firstname, lastname)
            $replyWithUser = Reply::with([
                'user:id,Firstname,Lastname',
                'replies' => function ($query) {
                    $query->with('user:id,Firstname,Lastname');
                }
            ])
            ->find($reply->id);
    
            // Fetch the replies_to relation to get the user_id for the notification's 'for' field
            $repliedToUser = Reply::find($validatedData['replies_to'])->user_id;
            
            // Get the associated comment to retrieve the user_id and product_id
            $comment = Comment::find($validatedData['comment_id']);
            $product_id = $comment->product_id;
    
            // Skip notification if the replying user is the same as the user being replied to
            if ($repliedToUser !== (int)$validatedData['user_id']) {
                // Create the notification
                Notification::create([
                    'userId' => $validatedData['user_id'],  // The user who made the reply
                    'type' => 'reply_to',                   // Type of notification
                    'isRead' => false,                      // Default value for 'isRead'
                    'from' => $product_id,                  // The product associated with the comment
                    'for' => $repliedToUser,                // The user who is the "for" field (the user being replied to)
                    'resource' => $validatedData['reply'],  // The resource type for the notification (the reply text)
                ]);
            }
    
            return response()->json($replyWithUser, 201); // Respond with created reply including user data
        } catch (\Exception $e) {
            Log::error('Error in store_reply method: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while submitting the reply.'], 500);
        }
    }
    

    

            public function fetchRepliesByIds($commentIDs)
        {
            $ids = explode(',', $commentIDs); // Split the IDs by comma
            Log::info('Fetching Replies for comment IDs:', ['commentIDs' => $ids]);

            $replies = Reply::whereIn('comment_id', $ids) // Use whereIn for multiple IDs
            ->with([
                'user:id,Firstname,Lastname', // Load only specific fields for the reply's user
                'comment.user' => function ($query) { // Load only specific fields for the comment's user
                    $query->select('id', 'Firstname', 'Lastname'); // Ensure to include the id field to maintain relationship
                }
            ])
                ->get();

            Log::info('Fetched Replies:', ['replies' => $replies]);

            if ($replies->isNotEmpty()) {
                return response()->json(['replies' => $replies]);
            } else {
                return response()->json(['message' => 'Comments not found.'], 404);
            }
        }

}
