<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RatingController extends Controller
{
    // Store a new rating
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'product_id' => 'required|exists:products,id',
            'rate' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string',
        ]);

        $rating = Rating::updateOrCreate(
            [
                'rater_id' => $request->user_id,
                'product_id' => $request->product_id,
            ],
            [
                'rate' => $request->rate,
                'review' => $request->review,
            ]
        );

        return response()->json(['message' => 'Rating submitted successfully', 'rating' => $rating], 201);
    }

    // Get all ratings for a product
    public function index($productId)
    {
        $ratings = Rating::where('product_id', $productId)
                        ->with('user:id,firstname,lastname') // Use 'firstname' and 'lastname' with the correct casing
                        ->get();

        return response()->json($ratings);
    }

    public function userRating($productId)
{
    $ratings = Rating::where('product_id', $productId)->get();

    // Log the fetched ratings
    Log::info('Ratings fetched for product ID ' . $productId, ['rate' => $ratings]);

    // Calculate average rating
    $averageRating = $ratings->isEmpty() ? 0 : $ratings->avg('rate');

    return response()->json([
        'ratings' => $ratings,
        'averageRating' => $averageRating,
    ]);
}


    // Update an existing rating
    public function update(Request $request, $id)
    {
        $request->validate([
            'rate' => 'integer|min:1|max:5',
            'review' => 'nullable|string',
        ]);

        $rating = Rating::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $rating->update($request->only(['rate', 'review']));

        return response()->json(['message' => 'Rating updated successfully', 'rating' => $rating]);
    }

    // Delete a rating
    public function destroy($id)
    {
        $rating = Rating::where('id', $id)->where('user_id', auth()->id())->firstOrFail();
        $rating->delete();

        return response()->json(['message' => 'Rating deleted successfully']);
    }
}
