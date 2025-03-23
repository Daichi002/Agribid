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

    // Group SRP data by `weekby`, sorted in descending order
    $groupedByWeekby = $srpData->sortByDesc(function ($item) {
        return Carbon::parse(explode(' - ', $item->weekby)[0])->timestamp;
    })->groupBy('weekby');

    // Initialize a set of already processed weeks to avoid duplicates
    $processedWeeks = [];

    // Prepare the response
    $response = $groupedByWeekby->map(function ($items, $weekby) use (&$processedWeeks, $groupedByWeekby) {
        $weekby = trim($weekby); // Remove any unwanted whitespace

        // Check if this weekby has already been processed
        if (in_array($weekby, $processedWeeks)) {
            Log::warning("Duplicate weekby group detected: '$weekby'. Skipping.");
            return null;
        }

        // Add the current weekby to the processed list
        $processedWeeks[] = $weekby;

        // Validate `weekby` format
        if (!empty($weekby) && strpos($weekby, ' - ') !== false) {
            [$startOfWeek, $endOfWeek] = explode(' - ', $weekby);

            if (!Carbon::hasFormat($startOfWeek, 'Y-m-d') || !Carbon::hasFormat($endOfWeek, 'Y-m-d')) {
                Log::error("Invalid date format in weekby: '$weekby'");
                throw new \Exception("Invalid date format in weekby: '$weekby'");
            }

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

            // Find the latest available `lastWeekby` if the direct previous week does not exist
            if (!isset($groupedByWeekby[$lastWeekby])) {
                $previousWeeks = collect($processedWeeks)->filter(function ($pastWeek) use ($startOfWeek) {
                    [$pastStart,] = explode(' - ', $pastWeek);
                    return Carbon::parse($pastStart)->lt(Carbon::parse($startOfWeek));
                })->sortDesc();

                if ($previousWeeks->isNotEmpty()) {
                    $lastWeekby = $previousWeeks->first();
                }
            }
        } catch (\Exception $e) {
            Log::error("Carbon parsing error for weekby: '$weekby'", ['exception' => $e]);
            throw $e;
        }

        // Group items by category within the current `weekby`
        $groupedByCategory = $items->groupBy('category');

        $categoryData = $groupedByCategory->map(function ($categoryItems, $category) use ($groupedByWeekby, $lastWeekby) {
            return [
                'category' => $category,
                'items' => $categoryItems->map(function ($item) use ($groupedByWeekby, $lastWeekby) {
                    // Get the commodity's prevailing price last week
                    $prevailingPriceLastWeek = '-';
                    if (isset($groupedByWeekby[$lastWeekby])) {
                        foreach ($groupedByWeekby[$lastWeekby] as $previousItem) {
                            if ($previousItem->commodity == $item->commodity) {
                                $prevailingPriceLastWeek = $previousItem->prevailing_price_this_week ?? '-';
                                break;
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
            'data.*.commodities' => 'nullable|array',
            'data.*.commodities.*.name' => 'nullable|string|max:255',
            'data.*.commodities.*.priceRange' => 'nullable|string|max:255',
            'data.*.commodities.*.prevailingPrice' => 'nullable|numeric|between:0,99999999.99',
        ]);
    
        // Get the current date and time in Asia/Manila timezone
        $carbon = Carbon::now()->setTimezone('Asia/Manila');
    
        // Calculate the current week's start and end dates
        $startOfWeek = $carbon->copy()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
        $endOfWeek = $carbon->copy()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
        $weekby = $startOfWeek . ' - ' . $endOfWeek;
    
        foreach ($validated['data'] as $categoryData) {
            foreach ($categoryData['commodities'] as $commodity) {
                // Skip commodity if both priceRange and prevailingPrice are empty
                if (empty($commodity['priceRange']) && empty($commodity['prevailingPrice'])) {
                    continue;
                }
    
                // Fetch the latest available past week's data for the same commodity
                $lastWeekRecord = Srp::where('category', $categoryData['category'])
                    ->where('commodity', $commodity['name'])
                    ->where('weekby', '!=', $weekby) // Exclude current week
                    ->orderByRaw("STR_TO_DATE(SUBSTRING_INDEX(weekby, ' - ', 1), '%Y-%m-%d') DESC") // Get latest past week
                    ->first();
    
                // Use the latest available past week's prevailing price
                $prevailingPriceLastWeek = $lastWeekRecord->prevailing_price_this_week ?? null;
    
                // Check if a post already exists within this week for the same category and commodity
                $existingPost = Srp::where('category', $categoryData['category'])
                    ->where('commodity', $commodity['name'])
                    ->where('weekby', $weekby)
                    ->first();
    
                // Prepare data for insertion/update
                $data = [
                    'category' => $categoryData['category'],
                    'commodity' => $commodity['name'],
                    'prevailing_price_last_week' => $prevailingPriceLastWeek,
                    'weekby' => $weekby,
                ];
    
                // Conditionally add priceRange and prevailingPrice if they are not empty
                if (!empty($commodity['priceRange'])) {
                    $data['price_range'] = $commodity['priceRange'];
                }
    
                if (!empty($commodity['prevailingPrice'])) {
                    $data['prevailing_price_this_week'] = $commodity['prevailingPrice'];
                }
    
                // Update existing post if found, otherwise create a new entry
                if ($existingPost) {
                    $existingPost->update($data);
                } else {
                    Log::info('Creating new SRP entry:', $data);
                    Srp::create($data);
                }
            }
        }
    
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
            
            // Define start and end of the current week
            $startOfWeek = $carbon->copy()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
            $endOfWeek = $carbon->copy()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
            
            // Fetch all commodities under the given category for the current week
            $commodities = Srp::where('category', $category)
                ->where('weekby', "$startOfWeek - $endOfWeek")
                ->orderBy('created_at', 'desc')
                ->get();
            
            // If no commodities found for the current week, fetch for the previous week
            if ($commodities->isEmpty()) {
                $startOfLastWeek = $carbon->copy()->subWeek()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
                $endOfLastWeek = $carbon->copy()->subWeek()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
                
                $commodities = Srp::where('category', $category)
                    ->where('weekby', "$startOfLastWeek - $endOfLastWeek")
                    ->orderBy('created_at', 'desc')
                    ->get();
                
                if ($commodities->isEmpty()) {
                    return response()->json(['message' => 'No SRP found for this category for the current or previous week'], 404);
                }
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
    
    // Define start and end of the current week
    $startOfWeek = $carbon->copy()->startOfWeek(Carbon::SUNDAY)->format('Y-m-d');
    $endOfWeek = $carbon->copy()->endOfWeek(Carbon::SATURDAY)->format('Y-m-d');
    $weekby = $startOfWeek . ' - ' . $endOfWeek;

    // Fetch only the specified fields for the current week
    $srpData = Srp::select('category', 'commodity', 'price_range', 'prevailing_price_this_week', 'weekby')
                  ->where('weekby', $weekby)
                  ->get();

    // Return an empty array if no data is found
    if ($srpData->isEmpty()) {
        return response()->json([]);
    }

    // Return the fetched data
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
