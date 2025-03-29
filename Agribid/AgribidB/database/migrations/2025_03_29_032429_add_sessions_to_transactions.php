<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('sessions')->nullable()->after('id'); // ✅ Allow NULL
            $table->foreign('sessions')->references('id')->on('messages')->onDelete('cascade');
        });
        
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the foreign key first
            $table->dropForeign(['sessions']);
            
            // Then drop the column
            $table->dropColumn('sessions');
        });
    }
};
