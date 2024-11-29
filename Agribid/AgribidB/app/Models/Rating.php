<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'rater_id',
        'product_id',
        'rate',
        'review',
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id'); // Specify 'user_id' if that's the foreign key
    }

    // Relationship with Product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function rater()
{
    return $this->belongsTo(User::class, 'rater_id');
}

}
