<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::table('comments', function (Blueprint $table) {
        $table->boolean('isRead')->default(false)->after('text'); // Place after 'text' column
    });
}
};
