<?php

namespace App\Http\Controllers;

use App\Models\Srp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SrpController extends Controller
{
    /**
     * Fetch all SRP records with optional dynamic calculations.
     */
    public function index()
{
    $srpData = Srp::all();
    Log::info('Fetched SRP data:', $srpData->toArray());

    // Group SRP data by `weekby`
    $groupedByWeekby = $srpData->groupBy('weekby');

    // Initialize a set of already processed weeks to avoid duplicates
    $processedWeeks = [];

    // Prepare the response
    $response = $groupedByWeekby->map(function ($items, $weekby) use (&$processedWeeks, $groupedByWeekby) {
        $weekby = trim($weekby); // Remove any unwanted whitespace

        // Check if this weekby has already been processed
        if (in_array($weekby, $processedWeeks)) {
            Log::warning("Duplicate weekby group detected: '$weekby'. Skipping.");
            return null; // Skip duplicate weekby group
        }

        // Add the current weekby to the processed list
        $processedWeeks[] = $weekby;

        // Validate the weekby format
        if (!empty($weekby) && strpos($weekby, ' - ') !== false) {
            [$startOfWeek, $endOfWeek] = explode(' - ', $weekby);

            // Validate that both start and end dates are correct
            if (!Carbon::hasFormat($startOfWeek, 'Y-m-d') || !Carbon::hasFormat($endOfWeek, 'Y-m-d')) {
                Log::error("Invalid date format in weekby: '$weekby'");
                throw new \Exception("Invalid date format in weekby: '$weekby'");
            }

            // Ensure the end date is later than the start date
            if (Carbon::parse($startOfWeek)->gt(Carbon::parse($endOfWeek))) {
                Log::error("Start date is after end date in weekby: '$weekby'");
                throw new \Exception("Start date is after end date in weekby: '$weekby'");
            }
        } else {
            Log::error("Invalid or empty weekby value: '$weekby'");
            throw new \Exception("Invalid weekby value: '$weekby'");
        }

        try {
            // Get the previous week range
            $startOfLastWeek = Carbon::parse($startOfWeek)->subWeek()->format('Y-m-d');
            $endOfLastWeek = Carbon::parse($endOfWeek)->subWeek()->format('Y-m-d');
            $lastWeekby = "$startOfLastWeek - $endOfLastWeek";
        } catch (\Exception $e) {
            Log::error("Carbon parsing error for weekby: '$weekby'", ['exception' => $e]);
            throw $e;
        }

        // Get the previous week data (if exists)
        $previousWeekData = $groupedByWeekby->get($lastWeekby);

        // Group items by category within the current `weekby`
        $groupedByCategory = $items->groupBy('category');

        $categoryData = $groupedByCategory->map(function ($categoryItems, $category) use ($previousWeekData) {
            return [
                'category' => $category,
                'items' => $categoryItems->map(function ($item) use ($previousWeekData) {
                    // Get the commodity's prevailing price last week from the previous week data
                    $prevailingPriceLastWeek = '-'; // Default if not found
                    if ($previousWeekData) {
                        // Check for matching commodity in previous week's data
                        foreach ($previousWeekData as $previousCategory) {
                            foreach ($previousCategory['items'] as $previousItem) {
                                if ($previousItem['commodity'] == $item->commodity) {
                                    $prevailingPriceLastWeek = $previousItem['prevailing_price_this_week'] ?? '-';
                                    break 2; // Exit both loops once we find the matching commodity
                                }
                            }
                        }
                    }

                    return [
                        'commodity' => $item->commodity,
                        'price_range' => $item->price_range ?? '-',
                        'prevailing_price_this_week' => $item->prevailing_price_this_week ?? '-',
                        'prevailing_price_last_week' => $prevailingPriceLastWeek,
                    ];
                }),
            ];
        });

        return [
            'week' => $weekby,
            'lastWeek' => $lastWeekby,
            'weekdata' => $categoryData->values(),
        ];
    });

    // Filter out null values (duplicates or invalid data)
    $response = $response->filter();

    Log::info('SRP data fetched successfully', ['data' => $response]);
    return response()->json($response);
}




    




    /**
     * Store a new SRP record.
     */
    public function store(Request $request)
    {
        // Validate the incoming request data
        $validated = $request->validate([
            'data' => 'required|array',
            'data.*.category' => 'required|string|max:255',
            'data.*.commodities' => 'required|array',
            'data.*.commodities.*.name' => 'required|string|max:255',
            'data.*.commodities.*.priceRange' => 'nullable|string|max:255',
            'data.*.commodities.*.prevailingPrice' => 'nullable|numeric|between:0,99999999.99',
        ]);
    
        // Get the current date and time in the correct timezone (Asia/Manila)
        $carbon = Carbon::now()->setTimezone('Asia/Manila');
    
        // Calculate the current week's start and end dates (Sunday to Saturday)
        $startOfWeek = $carbon->copy()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
        $endOfWeek = $carbon->copy()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
        $weekby = $startOfWeek . ' - ' . $endOfWeek;
    
        // Calculate the last week's start and end dates
        $startOfLastWeek = $carbon->copy()->subWeek()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
        $endOfLastWeek = $carbon->copy()->subWeek()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
        $lastWeekby = $startOfLastWeek . ' - ' . $endOfLastWeek;

    
        // Process the validated data
        foreach ($validated['data'] as $categoryData) {
            foreach ($categoryData['commodities'] as $commodity) {
                // Fetch the previous week's prevailing price for the same commodity
                $lastWeekRecord = Srp::where('category', $categoryData['category'])
                    ->where('commodity', $commodity['name'])
                    ->where('weekby', $lastWeekby)
                    ->first();
                $prevailingPriceLastWeek = $lastWeekRecord->prevailing_price_this_week ?? null;
    
                // Check if a post already exists within this week for the same category and commodity
                $existingPost = Srp::where('category', $categoryData['category'])
                    ->where('commodity', $commodity['name'])
                    ->where('weekby', $weekby)
                    ->first();
    
                // If a post exists for this week, update it
                if ($existingPost) {
                    $existingPost->update([
                        'price_range' => $commodity['priceRange'] ?? null,
                        'prevailing_price_this_week' => $commodity['prevailingPrice'] ?? null,
                        'prevailing_price_last_week' => $prevailingPriceLastWeek,
                    ]);
                } else {
                    // Create a new post for the current week if no existing post is found
                    $data = [
                        'category' => $categoryData['category'],
                        'commodity' => $commodity['name'],
                        'price_range' => $commodity['priceRange'] ?? null,
                        'prevailing_price_this_week' => $commodity['prevailingPrice'] ?? null,
                        'prevailing_price_last_week' => $prevailingPriceLastWeek,
                        'weekby' => $weekby,  // Store both start and end dates as 'weekby'
                    ];
    
                    // Log data for debugging
                    Log::info('Creating new SRP entry:', $data);
    
                    // Create the new post in the database
                    Srp::create($data);
                }
            }
        }
    
        // Return a success response
        return response()->json(['message' => 'SRP created/updated successfully'], 201);
    }
    
    




    /**
     * Fetch a specific SRP record.
     */

     public function show($category)
{
    try {
        // Set the timezone to Asia/Manila
        $carbon = Carbon::now();
        $carbon->setTimezone('Asia/Manila');
        
        // Fetch all commodities under the given category
        $commodities = Srp::where('category', $category)
            ->whereBetween('created_at', [
                Carbon::now()->startOfWeek(),  // Start of this week
                Carbon::now()->endOfWeek()     // End of this week
            ])
            ->orderBy('created_at', 'desc') // Order by latest created
            ->get(); // Get all commodities for the current week
        
        if ($commodities->isEmpty()) {
            return response()->json(['message' => 'No SRP found for this category for the current week'], 404);
        }

        // Add previous week's prevailing price for each commodity
        $prevWeekStart = Carbon::now()->startOfWeek()->subWeek();
        $prevWeekEnd = Carbon::now()->endOfWeek()->subWeek();

        foreach ($commodities as $commodity) {
            $prevWeekSrp = Srp::where('category', $category)
                ->where('commodity', $commodity->commodity) // Match the same commodity
                ->whereBetween('created_at', [$prevWeekStart, $prevWeekEnd])
                ->orderBy('created_at', 'desc')
                ->first();

            // Add previous week's prevailing price if available
            $commodity->prevailing_price_last_week = $prevWeekSrp ? $prevWeekSrp->prevailing_price_this_week : null;
        }

        return response()->json(['commodities' => $commodities], 200);

    } catch (\Exception $e) {
        Log::error('Error fetching SRP for category ' . $category . ': ' . $e->getMessage());
        return response()->json(['message' => 'Error processing the request. Please try again later.'], 500);
    }
}

     

     public function getcurrentWeek()
     {
            $carbon = Carbon::now();
            $carbon->setTimezone('Asia/Manila');
            $startOfWeek = $carbon->copy()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
            $endOfWeek = $carbon->copy()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
            $weekby = $startOfWeek . ' - ' . $endOfWeek;
            $srpData = Srp::where('weekby', $weekby)->get();
            return response()->json($srpData);
     }



    /**
     * Update an SRP record.
     */
    public function update(Request $request, $id)
    {
        $srp = Srp::find($id);

        if (!$srp) {
            return response()->json(['message' => 'SRP not found'], 404);
        }

        $validated = $request->validate([
            'category' => 'nullable|string|max:255',
            'commodity' => 'nullable|string|max:255',
            'price_range' => 'nullable|string|max:255',
            'prevailing_price_this_week' => 'nullable|numeric',
        ]);

        $srp->update($validated);

        return response()->json(['message' => 'SRP updated successfully', 'data' => $srp]);
    }

    /**
     * Delete an SRP record.
     */
    public function destroy($id)
    {
        $srp = Srp::find($id);

        if (!$srp) {
            return response()->json(['message' => 'SRP not found'], 404);
        }

        $srp->delete();

        return response()->json(['message' => 'SRP deleted successfully']);
    }

    /**
     * Calculate last week's prevailing price dynamically.
     */
    private function calculateLastWeekPrice($srp)
    {
        // Example: Fetch last week's price based on a related history table
        return $srp->priceHistory()
            ->whereBetween('created_at', [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()])
            ->value('price') ?? null;
    }
}
