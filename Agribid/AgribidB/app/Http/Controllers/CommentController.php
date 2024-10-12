<?php

// app/Http/Controllers/CommentController.php
namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use App\Http\Controllers\Log;

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

    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json(null, 204);
    }
}
