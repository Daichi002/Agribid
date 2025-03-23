<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reporthistory extends Model
{
    use HasFactory;

    // Ensure the table name is correctly set
    protected $table = 'reporthistory'; // This should match the actual table name

    // Make sure the column names are correct as per your database (snake_case is standard for Laravel)
    protected $fillable = [
        'reportId', // Ensure this column exists in your table
        'status',
        'admin',
    ];

    // Relationship with Report model
    public function report()
    {
        return $this->belongsTo(Report::class, 'reportId'); // Foreign key to the 'Report' model
    }

    public function admin()
{
    return $this->belongsTo(User::class, 'admin', 'id'); // 'admin' is the foreign key, 'id' is the primary key in the users table
}


}

