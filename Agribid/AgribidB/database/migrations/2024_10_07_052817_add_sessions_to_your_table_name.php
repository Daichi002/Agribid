<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSessionsToYourTableName extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->unsignedInteger('sessions')->default(1)->after('id'); // Adds the auto-incrementing sessions column
        });
    }
}

