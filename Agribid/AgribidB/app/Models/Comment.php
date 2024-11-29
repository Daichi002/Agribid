<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;
    protected $table = 'comments';

    protected $fillable = ['product_id', 'userId', 'text', 'isRead'];

    public function user()
    {
        return $this->belongsTo(User::class, 'userId'); // Correct foreign key
    }
    

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function replies()
    {
    return $this->hasMany(Reply::class, 'comment_id');
    }
}
