<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
        public function store(Request $request)
    {
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
    }

}
