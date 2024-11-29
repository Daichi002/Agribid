<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MessagesNotification extends Model
{
    use HasFactory;

    protected $table = 'messagesnotification';

    protected $fillable = ['sendId', 'message', 'receiveId', 'productId', 'sessions', 'isRead'];

    // Relationship to the User model for the receiver
    public function sender()
    {
    return $this->belongsTo(User::class, 'sendId');
    }

    public function receive()
    {
    return $this->belongsTo(User::class, 'receiveId');
    }



    // Relationship to the Product model
    public function product()
    {
        return $this->belongsTo(Product::class, 'productId', 'id');
    }
}

