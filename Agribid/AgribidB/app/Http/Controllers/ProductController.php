<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; 
use Illuminate\Support\Facades\Auth; 
use App\Http\Requests\UpdateLiveRequest; 


class ProductController extends Controller
{
    public function index()
    {
        return Product::select('id', 'user_id', 'title', 'description', 'quantity', 'price', 'locate', 'image', 'created_at')
        ->where('live', true) // Add condition to check if 'live' is true
        ->get();
    }

    public function getUserProducts(Request $request)
    {
        // Get the authenticated user's ID
        $userId = $request->user()->id; 
        Log::info("Fetching products for user ID: " . $userId);
    
        // Fetch products belonging to the authenticated user
        $products = Product::where('user_id', $userId)
                           ->select('id', 'user_id', 'title', 'description', 'image', 'created_at')
                           ->where('live', true)
                           ->get();
    
        return response()->json($products);
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

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'title' => 'required',
            'description' => 'required',
            'quantity' => 'required|integer',
            'price' => 'required|numeric',
            'locate' => 'required|string',
            'image' => 'nullable|image'
        ]);

        try {
            $product->fill($request->post())->update();

            if ($request->hasFile('image')) {
                if ($product->image) {
                    Storage::delete('public/product/images/' . $product->image);
                }

                $imageName = Str::random(10) . '.' . $request->image->getClientOriginalExtension();
                $path = $request->image->storeAs('public/product/images', $imageName);

                $product->image = $imageName;
                $product->save();
            }

            return response()->json([
                'message' => 'Product Updated Successfully!',
                'image_url' => isset($path) ? Storage::url($path) : null
            ]);
        } catch (\Exception $e) {
           
            return response()->json([
                'message' => 'Something went wrong while updating the product!'
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
