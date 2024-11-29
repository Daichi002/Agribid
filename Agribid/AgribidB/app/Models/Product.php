<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $table = 'products';

    protected $fillable = [
        'title', 'commodity', 'description', 'quantity', 'price', 'locate', 'image', 'user_id', 'live'
    ];     
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ratings()
    {
    return $this->hasMany(Rating::class);
    }

    public function comments()
    {
    return $this->hasMany(Comment::class); // A product can have many comments
    }
    public function replies()
    {
    return $this->hasMany(Comment::class); // A product can have many comments
    }

}
