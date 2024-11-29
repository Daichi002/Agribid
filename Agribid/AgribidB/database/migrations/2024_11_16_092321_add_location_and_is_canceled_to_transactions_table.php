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
            $table->string('location')->after('quantity'); // Add 'location' column after 'quantity'
            $table->boolean('is_canceled')->default(false)->after('is_approve'); // Add 'is_canceled' column after 'is_approve'
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
            $table->dropColumn('location'); // Remove 'location' column
            $table->dropColumn('is_canceled'); // Remove 'is_canceled' column
        });
    }
};
