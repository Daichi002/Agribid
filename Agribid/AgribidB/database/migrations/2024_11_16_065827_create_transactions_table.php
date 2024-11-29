<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();  // Auto-incrementing ID for the transaction
            $table->unsignedBigInteger('buyer_id');  // Foreign key for the buyer
            $table->unsignedBigInteger('seller_id'); // Foreign key for the seller
            $table->unsignedBigInteger('product_id'); // Foreign key for the product
            $table->integer('quantity'); // Quantity of the product purchased
            $table->boolean('is_approve')->default(false); // Approval status (default false)
            $table->timestamps();  // Created_at and updated_at timestamps

            // Adding foreign key constraints
            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('transactions');
    }
}
