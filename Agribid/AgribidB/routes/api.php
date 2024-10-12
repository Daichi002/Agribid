<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\MessageController;

/*
|---------------------------------------------------------------------------
| API Routes
|---------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// Routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'getUser']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::put('/users/{id}', [UserController::class, 'update']);

    // Product-related routes
    Route::post('/store', [ProductController::class, 'store']); // post product
    Route::resource('products', ProductController::class); // fetch all product
    Route::get('/show', [ProductController::class, 'show']);
    Route::get('/user/products', [ProductController::class, 'getUserProducts']); // get user of each product
    Route::get('/user/productmessage', [ProductController::class, 'getUserProductmessage']); 
    Route::put('/products/{id}/live', [ProductController::class, 'updateLive']); //soft delete the posted product

    //comments for products
    Route::post('/comments', [CommentController::class, 'store']); // Create a comment
    Route::get('/comments/{productId}', [CommentController::class, 'index']); // Get comments for a product
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']); //delete the comment
    
    // messages for users
    Route::get('/messages/session', [MessageController::class, 'checkSession']);
    Route::get('/messages/max-session', [MessageController::class, 'getMaxSession']);
    Route::get('/messageslistUser', [MessageController::class, 'getMessagesUser']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);
    Route::get('/getmessages', [MessageController::class, 'getMessages']);
    Route::get('/getmessagesender', [MessageController::class, 'getMessagesender']);
    Route::get('/messageslist', [MessageController::class, 'getMessageslist']);
    Route::get('/messageslistproduct', [MessageController::class, 'getMessageslistgeneral']);
    Route::delete('/messages/{id}', [MessageController::class, 'deleteMessage']); // Delete a message
    Route::get('/receiver/{receiverId}', [MessageController::class, 'getReceiverData']);
});
