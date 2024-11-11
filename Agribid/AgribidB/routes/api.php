<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RatingController;

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
// check phone uniqueness
Route::get('/check-phone', [UserController::class, 'checkphonenumber']);
// check and verify phone .otp
Route::post('/send-otp', [OtpController::class, 'sendOtp']);
Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);
//update password
Route::post('/check-phone-exist', [UserController::class, 'phoneExist']); 
Route::post('/updatepassword', [UserController::class, 'updatepassword']); 

// Routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'getUser']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::put('/users/{id}', [UserController::class, 'update']);

    // Product-related routes
    Route::post('/store', [ProductController::class, 'store']); // post product
    Route::post('/update', [ProductController::class, 'update']); // Update product
    Route::resource('products', ProductController::class); // fetch all product
    Route::get('/productdetails/{productId}', [ProductController::class, 'productdetails']); // product details
    Route::get('/show', [ProductController::class, 'show']);
    Route::get('/user/products', [ProductController::class, 'getUserProducts']); // get user of each product
    Route::get('/user/productmessage', [ProductController::class, 'getUserProductmessage']); 
    Route::put('/products/{id}/live', [ProductController::class, 'updateLive']); //soft delete the posted product

    // notification for products
    Route::get('/notif/products', [ProductController::class, 'getIDProducts']); // get user of each product
    Route::get('/comments', [CommentController::class, 'notifComments']);  // Get comments for a product
    Route::post('/notifications/{id}/mark-read', [CommentController::class, 'markAsRead']);
    Route::get('/comments/user/{userId}', [CommentController::class, 'notifyreply']);
    Route::get('/comments/replies', [CommentController::class, 'notifycommentreply']);
    Route::post('/reply/notifications/{id}/mark-read', [CommentController::class, 'markreplyAsRead']);

    //comments for products
    Route::post('/comments', [CommentController::class, 'store']); // Create a comment
    Route::get('/comments/{productId}', [CommentController::class, 'index']); // Get comments for a product
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']); //delete the comment

    //reply for comments
    Route::post('/replies', [CommentController::class, 'storereply']); // Create a reply
    Route::post('/replies_replies', [CommentController::class, 'store_reply']); // Create a reply
    Route::get('/replies/{commentIDs}', [CommentController::class, 'fetchRepliesByIds']);
    Route::delete('/reply/{id}', [CommentController::class, 'destroyreplies']); //delete the comment
    
    // messages for users
    Route::post('/message/{id}/mark-read', [MessageController::class, 'markAsRead']);
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
    
    // Reports controller
    Route::post('/reports', [ReportController::class, 'store']);

    // rating
    Route::post('/ratings', [RatingController::class, 'store']);
    Route::get('/ratings/{productId}', [RatingController::class, 'index']);
    Route::put('/ratings/{id}', [RatingController::class, 'update']);

    // user profile details
    Route::get('/userproduct/{userId}', [ProductController::class, 'getUserwithProducts']);
    Route::get('productrating/{productId}', [RatingController::class, 'userRating']);

    // Route::get('/test-pusher', function () {
    //     $message = (object) ['text' => 'Hello from server'];
    //     event(new \App\Events\TestEvent($message));
    //     return 'Event has been sent!';
    // }); 
    
    
});
