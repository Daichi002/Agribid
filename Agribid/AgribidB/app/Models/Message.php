<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;
    protected $table = 'messages';

    // Include 'product_id' in the fillable array
    protected $fillable = [
        'text',
        'product_id', 
        'sender_id',
        'receiver_id',
        'sessions',
        'isRead',
       
    ];

    // Define relationships if necessary
    public function sender() {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver() {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    // Add the relationship to the Product model
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
