<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Transaction;

class RatingController extends Controller
{
    // Store a new rating
    public function store(Request $request)
    {
        // Validate incoming request data, including transaction_id
        $request->validate([
            'user_id' => 'required|exists:users,id',            // Ensure user_id exists in the users table
            'product_id' => 'required|exists:products,id',      // Ensure product_id exists in the products table
            'rate' => 'required|integer|min:1|max:5',           // Ensure the rate is between 1 and 5
            'review' => 'nullable|string',                       // Allow review to be nullable
            'transaction_id' => 'required|exists:transactions,id', // Ensure transaction_id exists in the transactions table
        ]);
    
        // Check if a rating already exists for the given transaction_id
        $existingRating = Rating::where('transaction_id', $request->transaction_id)->first();
    
        if ($existingRating) {
            // If the rating already exists for the same transaction_id, update it with the new data
            $existingRating->update([
                'rate' => $request->rate,
                'review' => $request->review,
            ]);
    
            return response()->json(['message' => 'Rating updated successfully', 'rating' => $existingRating], 200);
        } else {
            // If no rating exists for this transaction, create a new one
            $rating = Rating::create([
                'transaction_id' => $request->transaction_id,    // Ensure only one rating per transaction_id
                'rater_id' => $request->user_id,                   // The user who rates the product
                'product_id' => $request->product_id,              // The product being rated
                'rate' => $request->rate,                          // The rating value (1 to 5)
                'review' => $request->review,                      // The review text (optional)
            ]);
    
            return response()->json(['message' => 'Rating submitted successfully', 'rating' => $rating], 201);
        }
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



    public function getRating($currentUserId)
    {
        // Fetch all products where user_id matches the current user
        $products = Product::where('user_id', $currentUserId)->get();
    
        // Initialize a collection to store all ratings for products
        $ratings = collect();
    
        // Fetch ratings for products and merge them if they exist
        foreach ($products as $product) {
            // Get ratings for each product (only the 'rate' column is needed)
            $productRatings = Rating::where('product_id', $product->id)->get(['rate']);
    
            // Only merge ratings if there are any for the product
            if ($productRatings->isNotEmpty()) {
                $ratings = $ratings->merge($productRatings);
            }
        }
    
        // Log the fetched ratings (optional)
        Log::info('Ratings fetched for current user products', ['ratings' => $ratings]);
    
        // Calculate the average rating (if ratings exist)
        $averageRating = $ratings->isEmpty() ? 0 : $ratings->avg('rate');
    
        return response()->json([
            'ratings' => $ratings,
            'averageRating' => $averageRating,
        ]);
    }





    // get pending transactions for buyer//////////////////////////
    public function getTransactionsAndRatings(Request $request)
    {
        $user = $request->user(); // Get the authenticated user
        $status = $request->query('status', 'Rated'); // Default status is 'Rated'
        $perPage = 10; // Number of items per page
    
        // Get the list of rated transaction IDs to exclude in 'To Rate'
        $ratedTransactionIds = Rating::pluck('transaction_id')->toArray();
    
        switch ($status) {
            case 'Rated':
                // Fetch ratings made by the logged-in user
                $ratings = Rating::with([
                    'product:id,title,image',
                    'rater:id,Firstname,Lastname',
                ])
                ->where('rater_id', $user->id)
                ->paginate($perPage, ['id', 'transaction_id', 'rater_id', 'product_id', 'rate', 'review']);
    
                return response()->json($ratings);
    
            case 'To Rate':
                // Fetch transactions that need a rating
                $transactions = Transaction::with([
                    'product:id,title,image',
                    'seller:id,Firstname,Lastname',
                    'buyer:id,Firstname,Lastname',
                ])
                ->where('buyer_id', $user->id)
                ->where('is_approve', 1)
                ->where('is_canceled', 0)
                ->whereNotIn('id', $ratedTransactionIds)
                ->paginate($perPage, ['id', 'product_id', 'quantity', 'location', 'created_at', 'buyer_id', 'seller_id']);
    
                return response()->json($transactions);
    
                case 'Rating':
                    // Fetch products created by the logged-in user with their average ratings
                    $products = Product::where('user_id', $user->id)->paginate($perPage);
                
                    $averageRatings = $products->getCollection()->map(function ($product) {
                        // Fetch ratings for the product including the rater's info and review
                        $productRatings = Rating::where('product_id', $product->id)
                            ->with('rater') // Assuming you have a rater relationship in the Rating model
                            ->get(['rate', 'review', 'rater_id']); // Fetch the rate, review, and rater_id fields
                
                        $averageRating = $productRatings->isEmpty() ? 0 : $productRatings->avg('rate');
                        $ratingCount = $productRatings->count(); // Count the total number of ratings
                
                        return [
                            'product' => $product,
                            'averageRating' => $averageRating,
                            'ratingCount' => $ratingCount, // Add the rating count
                            'ratings' => $productRatings->map(function ($rating) {
                                return [
                                    'rate' => $rating->rate,
                                    'review' => $rating->review,
                                    'rater' => $rating->rater ? [
                                        'id' => $rating->rater->id,
                                        'firstname' => $rating->rater->Firstname,
                                        'lastname' => $rating->rater->Lastname,
                                    ] : null,
                                ];
                            }),
                        ];
                    });
                
                    // Update the paginated collection with processed data
                    $paginatedResult = $products->setCollection($averageRatings);
                
                    return response()->json($paginatedResult);
                
    
            default:
                // Invalid status
                return response()->json(['message' => 'Invalid status'], 400);
        }
    }
    

    




    
}
