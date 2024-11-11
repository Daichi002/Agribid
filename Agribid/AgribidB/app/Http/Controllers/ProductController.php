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


class ProductController extends Controller
{
    public function index()
    {
        return Product::select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true) // Add condition to check if 'live' is true
        ->get();
    }

    public function productdetails($productId)
{
   // Fetch products belonging to the authenticated user
    $products = Product::where('id', $productId)
        ->select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true)
        ->with(['user:id,Firstname,Lastname']) // Only fetch the firstname and lastname from User
        ->first();

    return response()->json($products);
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
    Log::info("Fetching userwithproductID: " . $userId);

    // Fetch products belonging to the user with user ID passed
    $products = Product::where('user_id', $userId)
        ->select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true)
        ->with(['user:id,Firstname,Lastname']) // Fetch user information
        // ->with(['ratings:id,product_id,rating']) 
        ->get();

    Log::info("Fetching userwithproduct: " . $products);  
        return response()->json([
            'user' => $products->first()?->user, // Include user information
            // 'ratings' => $products->ratings,
            'products' => $products // Include products list with average rating as 'rating_avg'
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
            'description' => $validatedData['description'],
            'quantity' => $validatedData['quantity'] . ' ' . $validatedData['unit'], // Combine quantity and unit
            'price' => $validatedData['price'],
            'locate' => $validatedData['locate'],
            'image' => $imageName,
            'user_id' => $userId
        ]);

        return response()->json([
            'message' => 'Product Created Successfully!',
            'image_url' => $imageName ? Storage::url($path) : null
        ]);
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
    

    
    public function getIDProducts(Request $request)
    {
        // Get the authenticated user's ID
        $userId = $request->user()->id; 
        Log::info("Fetching notif for user ID: " . $userId);
    
        // Fetch products belonging to the authenticated user
        $products = Product::where('user_id', $userId)
                           ->select('id', 'title', 'image', 'created_at')
                           ->where('live', true) // Ensure this is the same as getUserProducts
                           ->get();
    
        return response()->json($products);
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
