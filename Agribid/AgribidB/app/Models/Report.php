<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected 
    $fillable = [
        'Reporter_id',
        'Reported_product_id', 
        'Reported_message_id', 
        'Reported_comments_id', 
        'reported_user_id', 
        'reason', 
        'details'
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}