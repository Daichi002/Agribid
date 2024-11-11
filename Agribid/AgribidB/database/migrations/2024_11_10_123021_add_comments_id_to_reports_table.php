<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->unsignedBigInteger('comments_id')->nullable()->after('Reported_product_id');

            // If you want to add a foreign key constraint to the `comments` table
            // Make sure the `comments` table and column exist before adding this
            $table->foreign('comments_id')->references('id')->on('comments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('reports', function (Blueprint $table) {
            // First, drop the foreign key constraint if it was added
            $table->dropForeign(['comments_id']);
            // Then, drop the `comments_id` column
            $table->dropColumn('comments_id');
        });
    }
};
