<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    // Define the table name if it's different from the plural form of the model name
    protected $table = 'transactions';

    // Define the fillable attributes
    protected $fillable = [
        'buyer_id', 
        'seller_id', 
        'product_id', 
        'quantity', 
        'location',      // Added location attribute
        'is_approve', 
        'is_canceled'    // Added is_canceled attribute
    ];

    // Define relationships

    // A transaction belongs to a buyer (user)
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    // A transaction belongs to a seller (user)
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    // A transaction belongs to a product
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
