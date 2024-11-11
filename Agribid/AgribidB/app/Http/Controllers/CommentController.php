<?php

// app/Http/Controllers/CommentController.php
namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'userId' => 'required|exists:users,id',
            'text' => 'required|string|max:255',
        ]);

        $comment = Comment::create($request->all());

        return response()->json($comment, 201);
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

public function markAsRead($id)
{
    $comment = Comment::find($id);
    Log::info('Marking comment as read:', ['comment' => $comment]);
    if ($comment) {
        $comment->isRead = true;
        $comment->save();
        return response()->json(['success' => true, 'message' => 'Comment marked as read']);
    }
    return response()->json(['success' => false, 'message' => 'Comment not found'], 404);
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


public function markreplyAsRead($id)
{
    $reply = Reply::find($id);
    Log::info('Marking comment as read:', ['reply' => $reply]);
    if ($reply) {
        $reply->isRead = true;
        $reply->save();
        return response()->json(['success' => true, 'message' => 'Comment marked as read']);
    }
    return response()->json(['success' => false, 'message' => 'Comment not found'], 404);
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

    //reply for comments
    public function storereply(Request $request)
    {
        $validatedData = $request->validate([
            'comment_id' => 'required|exists:comments,id',
            'user_id' => 'required|exists:users,id',
            'reply' => 'required|string',
        ]);

        $reply = Reply::create([
            'comment_id' => $validatedData['comment_id'],
            'user_id' => $validatedData['user_id'],
            'reply' => $validatedData['reply'],
        ]);
        
        // Fetch the reply with only specific user data (firstname, lastname)
        $replyWithUser = Reply::with([
            'user:id,Firstname,Lastname',
            'comment.user' => function ($query) { // Load only specific fields for the comment's user
                    $query->select('id', 'Firstname', 'Lastname'); // Ensure to include the id field to maintain relationship
                }
            ])
            ->find($reply->id);
        
        return response()->json($replyWithUser, 201); // Respond with created reply including user data
        
    }

    public function store_reply(Request $request)
    {
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
        
        // Fetch the reply with only specific user data (firstname, lastname)
        $replyWithUser = Reply::with([
        'user:id,Firstname,Lastname',
        'repliesTo' => function ($query) 
                { $query->with('user:id,Firstname,Lastname'); 
            }
        ])
        ->find($reply->id);
        
        return response()->json($replyWithUser, 201); // Respond with created reply including user data
        
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
