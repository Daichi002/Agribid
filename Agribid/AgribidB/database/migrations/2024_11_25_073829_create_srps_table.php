<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Srp extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'commodity',
        'price_range',
        'prevailing_price_this_week',
        'prevailing_price_last_week',
    ];

    // Accessor for Prevailing Price Last Week (optional if calculated dynamically)
    public function getPrevailingPriceLastWeekAttribute()
    {
        // Example logic: Fetch price from a hypothetical history table
        $lastWeekPrice = PriceHistory::where('commodity_id', $this->id)
            ->whereBetween('created_at', [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()])
            ->value('price');

        return $lastWeekPrice ?: null;
    }

    // Optional: Define relationships if needed
    public function priceHistory()
    {
        return $this->hasMany(PriceHistory::class, 'commodity_id');
    }
}
