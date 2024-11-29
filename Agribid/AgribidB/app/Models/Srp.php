<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Srp extends Model
{
    use HasFactory;
    protected $table = 'srp';

    protected $fillable = [
        'category',
        'commodity',
        'price_range',
        'prevailing_price_this_week',
        'prevailing_price_last_week',
        'weekby',
    ];
    

}
