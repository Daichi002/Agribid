<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\DB;
use App\Http\Requests\UpdateLiveRequest; 
use App\Models\User;
use App\Models\Rating;
use App\Models\Comment;


class ProductController extends Controller
{
        public function index()
    {
        $products = Product::select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
            ->where('live', true) // Add condition to check if 'live' is true
            ->withAvg('ratings', 'rate') // Calculate average rating from the ratings table
            ->withCount('ratings') // Count the number of ratings for each product
            ->get()
            ->map(function ($product) {
                $product->ratings_avg_rate = $product->ratings_avg_rate ?? 0;
                return $product;
            });

        return response()->json($products);
    }
    


    
    public function productdetails($productId)
    {
        // Fetch the product details based on the provided productId
        $product = Product::where('id', $productId)
            ->select('id', 'user_id', 'title', 'commodity', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
            ->where('live', true)
            ->with(['user:id,Firstname,Lastname']) // Eager load the product owner's details
            ->first();
    
        // Check if the product exists
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }
    
        // Step 2: Get all products belonging to the same user (including the current one)
        $userProducts = Product::where('user_id', $product->user_id)
            ->select('id')
            ->get();
    
        // Initialize variables for counting ratings and summing all ratings
        $totalRatings = 0;  // Total sum of all ratings for the user's products
        $userProductCount = 0;  // Count of all ratings for the user’s products
    
        // Step 3: Calculate ratings for each product owned by the user (including the current product)
        foreach ($userProducts as $userProduct) {
            // Fetch all ratings for the current product
            $productRatings = Rating::where('product_id', $userProduct->id)
                ->get(['rate']);  // No need to eager load the rater relationship here
    
            // If the product has ratings, count them and add to the total ratings
            if ($productRatings->isNotEmpty()) {
                // Count the ratings for this product and add it to the total rating count
                $userProductCount += $productRatings->count();
    
                // Add the sum of ratings for this product to the total ratings
                $totalRatings += $productRatings->sum('rate');
            }
        }
    
        // Calculate the user's overall average rating across all their products
        $userRating = $userProductCount > 0 ? round($totalRatings / $userProductCount, 1) : 0;
    
        // Fetch ratings for the specified productId and include the review and user info (rater)
        $productRatings = Rating::where('product_id', $productId)
            ->select('id', 'rater_id', 'rate', 'review')
            ->with(['rater:id,Firstname,Lastname'])  // Eager load the rater details for display
            ->get();
    
        // Calculate product's average rating and count of ratings
        $productRating = $productRatings->isNotEmpty() ? round($productRatings->avg('rate'), 1) : 0;
        $productRatingCount = $productRatings->count();
    

        Log::info("Product details: " . $productRatings);
        // Step 4: Prepare the response data
        $response = [
            'product' => $product,                 // Details of the specified product
            'productRaterData' => $productRatings,     // Include ratings along with user details (Firstname, Lastname, rate, and review)
            'productRating' => $productRating,     // Average rating of the specified product
            'productRatingCount' => $productRatingCount, // Count of ratings for the specified product
            'userRating' => $userRating,           // User's average rating across all their products
            'userProductCount' => $userProductCount, // Number of ratings for all user products
        ];
    
        return response()->json($response);
    }
    







public function offerproduct($productId)
{
    // Fetch the product details based on the provided productId
    $product = Product::where('id', $productId)
        ->select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true)
        ->with(['user:id,Firstname,Lastname']) // Only fetch the firstname and lastname from User
        ->first();

    // Check if the product exists
    if (!$product) {
        return response()->json(['message' => 'Product not found'], 404);
    }

    
    return response()->json($product);
}


    




public function getUserProducts(Request $request)
{
    // Get the authenticated user's ID
    $userId = $request->user()->id;

    Log::info("Fetching products for user ID: " . $userId);

    // Fetch products belonging to the authenticated user
    $products = Product::where('user_id', $userId)
                        ->select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
                        ->where('live', true)
                        ->with(['user:id,Firstname,Lastname']) // Only fetch the firstname and lastname from User
                        ->get();

    return response()->json($products);
}

public function getUserwithProducts($userId)
{
    Log::info("Fetching user with ID: " . $userId);

    // Fetch user information
    $user = User::select('id', 'Firstname', 'Lastname')->find($userId);

    // Check if user exists
    if (!$user) {
        return response()->json(['error' => 'User not found'], 404);
    }

    // Fetch products belonging to the user
    $products = Product::where('user_id', $userId)
        ->select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true)
        ->with(['user:id,Firstname,Lastname']) // Fetch user information if products exist
        ->get();

    Log::info("Fetched products: " . $products);

    return response()->json([
        'user' => $user, // Return user information even if there are no products
        'products' => $products, // Include products list if they exist
    ]);
}


    public function getUserProductmessage(Request $request)
    {
        // Get the authenticated user's ID
        $userId = $request->user()->id; 
        Log::info("Fetching products for user ID: " . $userId);
    
        // Fetch products belonging to the authenticated user
        $products = Product::where('user_id', $userId)
                           ->select('id',  'title', 'image', 'created_at')
                           ->get();
    
        return response()->json($products);
    }
    
    public function suggestSRp(request $request)
    {
       
    }




    public function store(Request $request)
{ 
    $userId = Auth::id();

    Log::info('Authenticated user ID: ' . $userId);

    if (!$userId) {
        return response()->json([
            'message' => 'User not authenticated'
        ], 401);
    }

    // Log incoming request data
    Log::info('Request data:', $request->all());

    $validatedData = $request->validate([
        'title' => 'required',
        'commodity' => 'required',
        'description' => 'nullable|string',
        'quantity' => 'required|integer',
        'unit'=> 'nullable|string',
        'price' => ['required', 'numeric', 'regex:/^\d{1,7}(\.\d{1,2})?$/'],
        'locate' => 'required|string',
        'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',  // Allow image to be nullable
    ]);

    try {
        // Use the title as the description if none is provided
        $validatedData['description'] = $validatedData['description'] ?? $validatedData['title'];

        $imageName = null; // Initialize $imageName

        // Handle image upload only if the image is provided
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = Str::random(10) . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('public/product/images', $imageName);
            $validatedData['image'] = $imageName;  // Save image name to database if uploaded
        } else {
            $validatedData['image'] = null;  // Set to null if no image is provided
        }

        // Check if user ID is valid
        if (!$userId) {
            throw new \Exception('User not authenticated');
        }

        // Create the product with the user ID
        Product::create([
            'title' => $validatedData['title'],
            'commodity' => $validatedData['commodity'],
            'description' => $validatedData['description'],
            'quantity' => $validatedData['quantity'] . ' ' . $validatedData['unit'], // Combine quantity and unit
            'price' => $validatedData['price'],
            'locate' => $validatedData['locate'],
            'image' => $imageName,
            'user_id' => $userId
        ]);

        return response()->json([
            'message' => 'Product Created Successfully!',
            'image_url' => $imageName ? Storage::url($path) : null,
        ], 201); // Set the HTTP status code here
    } catch (\Exception $e) {
        // Log the error message
        Log::error('Error creating product: ' . $e->getMessage());

        return response()->json([
            'message' => 'Something went wrong while creating the product!',
            'error' => $e->getMessage() // Return the error message for debugging purposes
        ], 500);
    }
}


    public function show(Product $product)
    {
        return response()->json([
            'product' => $product
        ]);
    }

    public function update(Request $request)
    {
        $validatedData = $request->validate([
            'id' => 'required|exists:products,id', // Ensure the product exists
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'quantity' => 'nullable|integer',
            'unit' => 'nullable|string', // Add unit field
            'price' => 'nullable|numeric',
            'locate' => 'nullable|string',
            'image' => 'nullable|image',
            'updated_at' => 'required|date'
        ]);
    
         // Log the validated data for debugging
    Log::info('Validated data:', $validatedData);

        try {  
            // Combine quantity and unit
            $validatedData['quantity'] = isset($validatedData['quantity'], $validatedData['unit']) 
                ? $validatedData['quantity'] . ' ' . $validatedData['unit'] 
                : $validatedData['quantity'];
    
            // Retrieve the product by ID
            $product = Product::findOrFail($validatedData['id']);
    
            // Update non-image fields except 'image' and 'unit'
            $product->fill(Arr::except($validatedData, ['image', 'unit']));
    
            // Handle image update if a new image is provided
            if ($request->hasFile('image')) {
                // Delete old image if it exists
                if ($product->image) {
                    Storage::delete('public/product/images/' . $product->image);
                }
    
                // Store the new image
                $imageName = Str::random(10) . '.' . $request->image->getClientOriginalExtension();
                $path = $request->image->storeAs('public/product/images', $imageName);
                $product->image = $imageName;
            }
    
            // Save all changes
            $product->save();
    
            return response()->json([
                'message' => 'Product Updated Successfully!',
                'image_url' => isset($path) ? Storage::url($path) : null,
                'id' => $product->id
            ]);
        } catch (\Exception $e) {
            // Log the error message for debugging
            Log::error('Product update error: ' . $e->getMessage());
    
            return response()->json([
                'message' => 'Something went wrong while updating the product!',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    
    


    public function updateLive(UpdateLiveRequest $request, $id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->live = $request->live; // Update the live attribute
            $product->save();

            return response()->json(['message' => 'Product live status has been updated.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Product not found or another error occurred.', 'error' => $e->getMessage()], 400);
        }
    }



}
