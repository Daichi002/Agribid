<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNewMessagesTable extends Migration
{
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('text'); // Message text
            $table->foreignId('product_id')->nullable()->constrained('products')->onDelete('cascade'); // Product ID
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade'); // Sender's user ID
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade'); // Receiver's user ID
            $table->timestamps(); // Created and updated timestamps
        });
    }

}
