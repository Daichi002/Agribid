<?php

// app/Models/Comment.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;
    protected $table = 'comments';

    protected $fillable = ['product_id', 'userId', 'text'];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId'); 
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
