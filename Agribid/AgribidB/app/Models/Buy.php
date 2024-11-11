<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Buy extends Model
{
    use HasFactory;
    protected $table = 'buy';

    protected $fillable = [
        'title', 'description', 'quantity', 'price', 'locate', 'image', 'user_id', 'live'
    ];     
}
