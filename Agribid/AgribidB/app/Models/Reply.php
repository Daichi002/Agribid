<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reply extends Model
{
    use HasFactory;

    protected $fillable = [
        'comment_id',
        'replies_to',
        'user_id',
        'reply',
        'isRead',
    ];

    // Define the relationship with the Comment model
    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }

    // Define the relationship with the User model
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function repliesTo() 
    { 
        return $this->belongsTo(Reply::class, 'replies_to'); 
    }
}

