<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    // Store a new transaction//////////////////////
    public function store(Request $request)
    {
        $request->validate([
            'sessions' => 'required|numeric',
            'buyerId' => 'required|exists:users,id',
            'sellerId' => 'required|exists:users,id',
            'productId' => 'required|exists:products,id',
            'offer' => 'required|string|min:1',
            'location' => 'required|string',
        ]);        

        $transaction = Transaction::create([
            'sessions' => $request->sessions,
            'buyer_id' => $request->buyerId,
            'seller_id' => $request->sellerId,
            'product_id' => $request->productId,
            'quantity' => $request->offer,
            'location' => $request->location,
        ]);

        return response()->json(201);
    }




    // Get all transactions
    public function index()
    {
        $transactions = Transaction::with(['buyer', 'seller', 'product'])->get();
        return response()->json($transactions);
    }


    // get all transaction for seller//////////////////////////
    public function transaction($currentUserId)
{
    // Fetch transactions where the current user is the seller
    $transactions = Transaction::with(['buyer', 'seller', 'product'])
        ->where('seller_id', $currentUserId)  // Filter by the seller_id
        ->where(function ($query) {
            $query->where('is_approve', 0)
                  ->orWhereNull('is_approve');
        })
        ->where(function ($query) {
            $query->where('is_canceled', 0)
                  ->orWhereNull('is_canceled');
        })
        ->get();

    if ($transactions->isEmpty()) {
        // Return a clear "no data" response
        return response()->json([
            'message' => 'No transactions found',
            'data' => [], // Explicitly set empty data
        ], 404);
    }

    // Return the filtered transactions as a JSON response
    return response()->json([
        'message' => 'Transactions retrieved successfully',
        'data' => $transactions, // Send the actual data
    ]);
}






    // Show a single transaction//////////////////////////
    public function show($id)
    {
        $transaction = Transaction::with(['buyer', 'seller', 'product'])->findOrFail($id);
        return response()->json($transaction);
    }





    // Update the approval status of a transaction and product quantity//////////////////////////
    public function updateApproval($id, Request $request)
        {
            // Validate the input
            $request->validate([
                'is_approve' => 'required|boolean', // Ensure it's a boolean
            ]);
            Log::info('Authorization header:', [
                'authorization' => $request->header('Authorization')
            ]);
            $user = auth()->user();
            // Find the transaction by ID
            $transaction = Transaction::findOrFail($id);

            // Check if the transaction is being approved (is_approve = true)
            if ($request->is_approve) {
                // Find the product associated with this transaction
                $product = Product::findOrFail($transaction->product_id);

                // Extract numeric value and extension from the product's quantity
                preg_match('/(\d+)\s*(\w+)/', $product->quantity, $matches);
                $productQuantity = isset($matches[1]) ? (int)$matches[1] : 0; // Numeric value
                $productExtension = isset($matches[2]) ? $matches[2] : '';   // Extension (e.g., kg, pcs)

                // Extract numeric value from the transaction's quantity
                preg_match('/(\d+)/', $transaction->quantity, $transactionMatches);
                $transactionQuantity = isset($transactionMatches[1]) ? (int)$transactionMatches[1] : 0;

                // Ensure the product has enough quantity for the transaction
                if ($productQuantity < $transactionQuantity) {
                    return response()->json(['message' => 'Not enough product quantity'], 400);
                }

                // Deduct the quantity from the product
                $productQuantity -= $transactionQuantity;

                // Save the updated product quantity with the original extension
                $product->quantity = $productQuantity . ' ' . $productExtension;
                $product->save(); // Save the updated product
            }

            // Update the transaction's approval status
            $transaction->update([
                'is_approve' => $request->is_approve,
            ]);

            // Return the updated transaction as a JSON response
            return response()->json($transaction, 201);
        }




        // decline the approval status of a transaction//////////////////////////
        public function updatedecline($id, Request $request)
        {
            // Validate the input
            $request->validate([
                'is_decline' => 'required|boolean', // Ensure it's a boolean
            ]);
            Log::info('Authorization header:', [
                'authorization' => $request->header('Authorization')
            ]);
            $user = auth()->user();
            // Find the transaction by ID
            $transaction = Transaction::findOrFail($id);

            // Update the transaction's approval status
            $transaction->update([
                'is_canceled' => $request->is_decline,
            ]);

            // Return the updated transaction as a JSON response
            return response()->json($transaction, 201);
        }



        // get pending transactions for buyer//////////////////////////
        public function getTransactionbuyer(Request $request)
        {
            $user = $request->user(); // Get the authenticated user
            $status = $request->query('status', 'Pending'); // Get the requested status, default to 'Pending'
            $perPage = 10; // Number of transactions per page
        
            $query = Transaction::with(['product:id,title,image', 'seller:id,Firstname,Lastname']); // Load product and seller data
        
            if ($status === 'Pending') {
                $query->where('buyer_id', $user->id)
                    ->where('is_approve', 0)
                    ->where('is_canceled', 0);
            } elseif ($status === 'Approved') {
                $query->where('buyer_id', $user->id)
                      ->where('is_approve', 1);
            } elseif ($status === 'Canceled') {
                $query->where('buyer_id', $user->id)
                      ->where('is_canceled', 1);
            }
        
            // Paginate the results
            $transactions = $query->paginate($perPage, ['id', 'product_id', 'seller_id', 'quantity', 'location', 'created_at']);
        
            // Return the response as JSON
            return response()->json($transactions);
        }


        // get pending transactions for seller//////////////////////////
        public function getTransactionseller(Request $request)
        {
            $user = $request->user(); // Get the authenticated user
            $status = $request->query('status', 'Approved'); // Get the requested status, default to 'Pending'
            $perPage = 10; // Number of transactions per page
        
            $query = Transaction::with(['product:id,title,image', 'buyer:id,Firstname,Lastname']); // Load product and seller data
        
            if ($status === 'Approved') {
                $query->where('seller_id', $user->id)
                      ->where('is_approve', 1);
            } elseif ($status === 'Canceled') {
                $query->where('seller_id', $user->id)
                      ->where('is_canceled', 1);
            }
        
            // Paginate the results
            $transactions = $query->paginate($perPage, ['id', 'product_id', 'buyer_id', 'quantity', 'location', 'created_at']);
        
            // Return the response as JSON
            return response()->json($transactions);
        }



    // Get all transactions
    public function getApprovedTransactions()
    {
        $transactions = Transaction::select([
            'id',
            'sessions',
            'buyer_id',
            'seller_id',
            'product_id',
            'quantity',
            'location',
            'is_approve',
            'is_canceled'
            ])
            ->with(['buyer', 'seller', 'product', 'messages'])
            ->get();

        return response()->json([
            'success' => true,
            'transactions' => $transactions
        ]);
    }




    // Delete a transaction
    public function destroy($id)
    {
        $transaction = Transaction::findOrFail($id);
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully']);
    }
}
