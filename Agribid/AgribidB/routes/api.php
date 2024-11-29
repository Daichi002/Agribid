<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\SrpController;
use Illuminate\Support\Facades\Response;

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
Route::post('/Admin/login', [UserController::class, 'Adminlogin']);
// check phone uniqueness
Route::get('/check-phone', [UserController::class, 'checkphonenumber']);
// check and verify phone .otp
Route::post('/send-otp', [OtpController::class, 'sendOtp']);
Route::post('/verify-otp', [OtpController::class, 'verifyOtp']);
//update password
Route::post('/check-phone-exist', [UserController::class, 'phoneExist']); 
Route::post('/updatepassword', [UserController::class, 'updatepassword']); 
// count user product
Route::get('/count?user_id={userId}', [ProductController::class, 'count']); 

// Routes requiring authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'getUser']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::put('/users/{id}', [UserController::class, 'update']);

    // Product-related routes
    Route::post('/store', [ProductController::class, 'store']); // post product
    Route::get('/GetSrp', [ProductController::class, 'suggestSRp']); // post product
    Route::post('/update', [ProductController::class, 'update']); // Update product
    Route::resource('products', ProductController::class); // fetch all product
    Route::get('/productdetails/{productId}', [ProductController::class, 'productdetails']); // product details
    Route::get('/updateproductdetails/{productId}', [ProductController::class, 'offerproduct']); // product details
    Route::get('/show', [ProductController::class, 'show']);
    Route::get('/user/products', [ProductController::class, 'getUserProducts']); // get user of each product
    Route::get('/user/productmessage', [ProductController::class, 'getUserProductmessage']); 
    Route::put('/products/{id}/live', [ProductController::class, 'updateLive']); //soft delete the posted product

    // notification for products
    Route::get('/notif', [NotificationController::class, 'getnotif']); // get notification of each product
    Route::get('/comments', [CommentController::class, 'notifComments']);  // Get comments for a product
    Route::post('notifications/{id}/mark-read', [NotificationController::class, 'markAsRead']);

    //notification indication
    Route::get('/notifindicator', [NotificationController::class, 'getnotifIsRead']); // get user of each product

    //comments for products
    Route::post('/comments', [CommentController::class, 'store']); // Create a comment
    Route::get('/comments/{productId}', [CommentController::class, 'index']); // Get comments for a product
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']); //delete the comment

    //reply for comments
    Route::post('/replies', [CommentController::class, 'storereply']); // Create a reply
    Route::post('/replies_replies', [CommentController::class, 'store_reply']); // Create a reply to reply
    Route::get('/replies/{commentIDs}', [CommentController::class, 'fetchRepliesByIds']);
    Route::delete('/reply/{id}', [CommentController::class, 'destroyreplies']); //delete the comment
    
    // messages for users
    Route::post('/message/{id}/mark-read', [NotificationController::class, 'markAsReadmessage']);
    Route::get('/user/productmessage', [NotificationController::class, 'getUnreadMessagesUser']); //get messages notification for receiver


    Route::get('/messages/session', [MessageController::class, 'checkSession']);
    Route::get('/messages/max-session', [MessageController::class, 'getMaxSession']);
    Route::get('/messageslistcreate', [NotificationController::class, 'getMessageSender']); //get sender messages
    Route::get('/user/productmessage', [NotificationController::class, 'getMessageReceiver']); //get sender messages
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
    Route::post('/getRating/{currentUserId}', [RatingController::class, 'getRating']);

    // create offer for product
    Route::post('/offers', [TransactionController::class, 'store']);
    Route::get('/offersproduct/{productId}', [ProductController::class, 'offerproduct']);
    Route::post('/getApprovals/{currentUserId}', [TransactionController::class, 'transaction']);
    Route::post('/approve-request/{id}', [TransactionController::class, 'updateApproval']);
    Route::post('/decline-request/{id}', [TransactionController::class, 'updatedecline']);


    // history of transactions
    Route::get('/transactionbuyer', [TransactionController::class, 'getTransactionbuyer']);
    Route::get('/transactionseller', [TransactionController::class, 'getTransactionseller']);

    // Rating history
    Route::get('/ratinghistory', [RatingController::class, 'getTransactionsAndRatings']);


    // // Admin routes
   Route::post('/admin/srpstore', [SrpController::class, 'store']);
    Route::get('/srp', [SrpController::class, 'index']);
    
    Route::get('/SRP/{category}', [SrpController::class, 'show']);

    Route::get('/srp/currentweek', [SrpController::class, 'getcurrentWeek']);

    Route::delete('/srps/{id}', [SrpController::class, 'destroy']);









    Route::get('/storage/product/images/{filename}', function ($filename) {
        $path = storage_path("app/public/product/images/" . $filename);
    
        if (!file_exists($path)) {
            abort(404);
        }
    
        $file = file_get_contents($path);
        $type = mime_content_type($path);
    
        return Response::make($file, 200, [
            'Content-Type' => $type,
        ]);
    });
    // Route::get('/test-pusher', function () {
    //     $message = (object) ['text' => 'Hello from server'];
    //     event(new \App\Events\TestEvent($message));
    //     return 'Event has been sent!';
    // }); 
    
    
});
