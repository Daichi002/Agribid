<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('messagesnotification', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->unsignedBigInteger('sendId'); // Sender's ID
            $table->text('message'); // Message content
            $table->unsignedBigInteger('receiverId'); // Receiver's ID
            $table->unsignedBigInteger('productId'); // Product ID
            $table->string('sessions'); // Session identifier (e.g., chat session)
            $table->boolean('isRead')->default(false); // Read status, default to false
            $table->timestamps(); // Created at and updated at timestamps

            // Foreign key constraints
            $table->foreign('sendId')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiverId')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('productId')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('messagesnotification');
    }
}
