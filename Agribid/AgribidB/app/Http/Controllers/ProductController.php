<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; 
use Illuminate\Support\Facades\Auth; 


class ProductController extends Controller
{
    public function index()
    {
        return Product::select('id', 'user_id','title','description', 'quantity', 'price', 'locate','image', 'created_at')->get();
    }

    public function store(Request $request)
{
    $validatedData = $request->validate([
        'title' => 'required',
        'description' => 'nullable|string',
        'quantity' => 'required|integer',
        'price' => ['required', 'numeric', 'regex:/^\d{1,7}(\.\d{1,2})?$/'],
        'locate' => 'required|string',
        'image' => 'required|image'
    ]);

    try {
        // Use the title as the description if none is provided
        $validatedData['description'] = $validatedData['description'] ?? $validatedData['title'];
        
        // Save the image
        $image = $request->file('image');
        $imageName = Str::random(10) . '.' . $image->getClientOriginalExtension();
        $path = $image->storeAs('public/product/images', $imageName);

        // Get the ID of the logged-in user
        // $userId = Auth::id();
         $userId = 5;


        // Log the user ID for debugging
        // Log::info('Creating product for user ID: ' . $userId);

        // // Check if user ID is valid
        // if (!$userId) {
        //     throw new \Exception('User not authenticated');
        // }

        // Create the product with the user ID
        Product::create([
            'title' => $validatedData['title'],
            'description' => $validatedData['description'],
            'quantity' => $validatedData['quantity'],
            'price' => $validatedData['price'],
            'locate' => $validatedData['locate'],
            'image' => $imageName,
            'user_id' => $userId
        ]);

        return response()->json([
            'message' => 'Product Created Successfully!',
            'image_url' => Storage::url($path)
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

    public function destroy(Product $product)
    {
        try {
            if ($product->image) {
                Storage::delete('public/product/images/' . $product->image);
            }

            $product->delete();

            return response()->json([
                'message' => 'Product Deleted Successfully!'
            ]);
        } catch (\Exception $e) {
           
            return response()->json([
                'message' => 'Something went wrong while deleting the product!'
            ], 500);
        }
    }
}
