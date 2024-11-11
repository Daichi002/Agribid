<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct($message)
    {
        $this->message = $message;
        
        // Log the message when the event is constructed
        Log::info('MessageSent Event Constructed:', ['message' => $this->message]);
    }

    public function broadcastOn()
    {
        // Log the channels being broadcasted to
        Log::info('Broadcasting on Channels:', [
            'receiver_channel' => 'chat.' . $this->message->receiver_id,
            'sender_channel' => 'chat.' . $this->message->sender_id
        ]);
    
        // Broadcast to both the receiver's and sender's channels
        return [
            new Channel('chat.' . $this->message->receiver_id),
            new Channel('chat.' . $this->message->sender_id),
        ];
    }
    
    public function broadcastWith()
    {
        // Log the message payload that is being broadcasted
        Log::info('Broadcasting with Payload:', ['message' => $this->message]);

        return ['message' => $this->message];
    }

        public function broadcastAs()
    {
        return 'MessageSent';
    }
}


