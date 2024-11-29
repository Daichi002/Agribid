<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notification', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->unsignedBigInteger('userId'); // User ID associated with the notification
            $table->string('type'); // Notification type (e.g., 'comment', 'reply', etc.)
            $table->boolean('isRead')->default(false); // Whether the notification has been read
            $table->unsignedBigInteger('from'); // References the product related to the notification
            $table->timestamps(); // Created at and updated at timestamps

            // Define foreign keys
            $table->foreign('userId')->references('id')->on('users')->onDelete('cascade'); // User reference
            $table->foreign('from')->references('id')->on('products')->onDelete('cascade'); // Product reference
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notification');
    }
}

