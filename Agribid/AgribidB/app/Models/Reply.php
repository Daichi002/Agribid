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
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // Correct foreign key in replies table
    }



    public function comment()
    {
        return $this->belongsTo(Comment::class, 'comment_id');
    }

    

    public function parentReply()
    {
        return $this->belongsTo(Reply::class, 'replies_to'); // Fetch the reply being responded to
    }

}


