<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSrpTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('srp', function (Blueprint $table) {
            $table->id(); // Auto-incrementing ID
            $table->string('category'); // Category of the commodity
            $table->string('commodity'); // Name of the commodity
            $table->string('price_range')->nullable(); // Price range (as a string or JSON)
            $table->decimal('prevailing_price_this_week', 8, 2)->nullable(); // This week's prevailing price
            $table->decimal('prevailing_price_last_week', 8, 2)->nullable(); // Last week's prevailing price
            $table->timestamps(); // Created and updated timestamps
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('srp');
    }
}
