<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('reports', function (Blueprint $table) {
            // Ensure 'Reported_session_id' is compatible with the 'sessions' column in messages
            $table->unsignedBigInteger('Reported_message_id')->nullable()->after('Reported_product_id');
            
            // Ensure the session column in messages is being referenced correctly
            $table->foreign('Reported_message_id')
                ->references('id')
                ->on('messages')
                ->onDelete('cascade');
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
            $table->dropForeign(['reported_session_id']);
            $table->dropColumn('reported_session_id');
        });
    }
};


