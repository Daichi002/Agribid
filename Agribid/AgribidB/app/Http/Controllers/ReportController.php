<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Reporthistory;
use App\Models\Product;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
        public function store(Request $request)
    {
        try {
        // Validation rules: Allow null values for related entities based on the reported type
        $request->validate([
            'productId' => 'nullable|exists:products,id', // Product ID is nullable, it will be required only if reporting a product
            'commentsId' => 'nullable|exists:comments,id', // Comment ID is nullable, it will be required only if reporting a comment
            'messageId' => 'nullable|exists:messages,id', // Message ID is nullable, it will be required only if reporting a message
            'Reporter' => 'required|exists:users,id', // The user reporting the entity is required
            'reason' => 'required|string', // The reason for the report is required
            'details' => 'nullable|string', // Details are optional
        ]);

        // Create the report based on the reported type (product, comment, or message)
        $reportData = [
            'Reporter_id' => $request->input('Reporter'),
            'reason' => $request->input('reason'),
            'details' => $request->input('details'),
            'status' => 'pending', // Set the initial status to 'pending'
        ];

        // Check which type of report we are creating and assign the appropriate IDs
        if ($request->filled('commentsId')) {
            // If a comment is reported, include the commentId and set the productId and messageId to null
            $reportData['Reported_product_id'] = $request->input('productId'); // Optional, only if the comment is tied to a product
            $reportData['Reported_comments_id'] = $request->input('commentsId');
            $reportData['Reported_message_id'] = null;
        } elseif ($request->filled('productId')) {
            // If only a product is reported (without comment), include the productId and set other fields to null
            $reportData['Reported_product_id'] = $request->input('productId');
            $reportData['Reported_comments_id'] = null;
            $reportData['Reported_message_id'] = null;
        } elseif ($request->filled('messageId')) {
            // If a message is reported, include the messageId and set the productId and commentId to null
            $reportData['Reported_product_id'] = null;
            $reportData['Reported_comments_id'] = null;
            $reportData['Reported_message_id'] = $request->input('messageId');
        }

        // Create the report in the database
        $report = Report::create($reportData);

        // Return a success response
        return response()->json(['message' => 'Report submitted successfully', 'report' => $report], 200);

    } catch (\Exception $e) {
        // Log the error and return a generic message
        Log::error('Error submitting report: ' . $e->getMessage());
        return response()->json(['message' => 'Error submitting report'], 500);
    }
    }
    

    public function getReport(Request $request)
{
    // Fetch all reports with related users
    $reports = Report::with(['user'])->get();

    $reportData = $reports->map(function ($report) {
        // Determine the report type
        if ($report->Reported_product_id && !$report->Reported_message_id && !$report->Reported_comments_id) {
            $reportType = 'Product Report';
        } elseif ($report->Reported_product_id && $report->Reported_comments_id && !$report->Reported_message_id) {
            $reportType = 'Comment Report';
        } elseif ($report->Reported_message_id && !$report->Reported_product_id && !$report->Reported_comments_id) {
            $reportType = 'Message Report';
        } else {
            $reportType = 'Unknown Report';
        }

        // Fetch item details for Product Report
        $itemDetails = null;

        if ($reportType === 'Product Report') {
            $itemDetails = Product::where('id', $report->Reported_product_id)
                ->select('id', 'title', 'commodity', 'description', 'price', 'quantity', 'locate', 'image', 'user_id', 'live', 'created_at')
                ->with(['user:id,Firstname,Lastname'])
                ->first(); // Fetch the product as an object
        }

        // Fetch item details for Comment Report
        $commentDetails = null;
        if ($reportType === 'Comment Report') {
            $commentDetails = Comment::where('id', $report->Reported_comments_id)
                ->with('user:id,Firstname,Lastname')  // Load the user who commented
                ->select('id', 'text', 'created_at', 'userId')
                ->first(); // Fetch the comment and its associated user
        }

        return [
            'reportId' => $report->id,
            'reportType' => $reportType,
            'reporter' => $report->user ? [
                'ReporterId' => $report->Reporter_id,
                'FirstName' => $report->user->Firstname,
                'LastName' => $report->user->Lastname,
            ] : null,
            'reason' => $report->reason,
            'details' => $report->details,
            'status' => $report->Status,
            'itemDetails' => $itemDetails, // For Product Report
            'commentDetails' => $commentDetails ? [
                'commentText' => $commentDetails->text,
                'commenter' => $commentDetails->user ? [
                    'FirstName' => $commentDetails->user->Firstname,
                    'LastName' => $commentDetails->user->Lastname,
                ] : null,
                'createdAt' => $commentDetails->created_at,
            ] : null, // For Comment Report
        ];
    });

    return response()->json($reportData);
}







public function setreport(Request $request)
{
    $admin = Auth::user();

    // Validate the request data
    $request->validate([
        'reportId' => 'required|exists:reports,id',
        'status' => 'required|in:Acknowledged,Resolved,Flagged',
    ]);

    // Find the report by ID
    $report = Report::find($request->input('reportId'));

    // Check if admin is authenticated
    if (!$admin) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    // Update the status and admin of the report
    $report->Status = $request->input('status');
    $report->Admin = $admin->id; // Assuming 'Admin' is a column that stores the admin ID
    $report->save();

    // Manually include admin details
    $adminDetails = [
        'id' => $admin->id,
        'Firstname' => $admin->Firstname,
        'Lastname' => $admin->Lastname,
    ];

    // Create a report history entry
    Reporthistory::create([
        'reportId' => $report->id,  // Correctly use reportId (in snake_case)
        'status' => $report->Status,  // Status updated in the report
        'admin' => $admin->id,  // Correctly use admin (in snake_case)
    ]);

    // Return a success response
    return response()->json([
        'message' => 'Report status updated successfully',
        'report' => $report,
        'admin' => $adminDetails,  // Include admin details in the response
    ], 200);
}



public function Reporthistory(Request $request)
{
    $reportHistory = DB::table('reporthistory')
        ->join('users as admins', 'reporthistory.admin', '=', 'admins.id') // Join for admin details
        ->join('reports', 'reporthistory.reportId', '=', 'reports.id') // Join with reports table
        ->join('users as reporters', 'reports.reporter_id', '=', 'reporters.id') // Join for reporter details
        ->select(
            'reporthistory.*',
            'admins.Firstname as adminFirstname',
            'admins.Lastname as adminLastname',
            'reporters.Firstname as reporterFirstname',
            'reporters.Lastname as reporterLastname'
        )
        ->get();

    return response()->json($reportHistory);
}


















}
