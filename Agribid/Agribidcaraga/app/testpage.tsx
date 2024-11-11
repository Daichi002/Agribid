import Pusher from 'pusher-js/react-native';
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

const PusherTest = () => {
  const [messages, setMessages] = useState([]);
  const [renderKey, setRenderKey] = useState(0); // Key to force re-render

  useEffect(() => {
    const pusher = new Pusher('87916f2c03247f41316e', {
      cluster: 'ap1',
      encrypted: true,
      logToConsole: true,
    });

    // Log connection success
    pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
    });

    // Log connection errors
    pusher.connection.bind('error', function(err) {
      console.error('Connection error:', err);
    });

    const channel = pusher.subscribe('my-test-channel');

    // Log subscription errors
    channel.bind('pusher:subscription_error', function(status) {
      console.error('Subscription error:', status);
    });

    // Bind to the test event and update state
    channel.bind('my-test-event', function(data) {
      console.log('Test event received:', data);
      
      // Log the data being received
      console.log('Received message data:', data.message);

      // Ensure data structure is correct, and force re-render
      if (data && data.message) {
        setMessages(prevMessages => [...prevMessages, data.message]); // Append new message
        setRenderKey(prevKey => prevKey + 1); // Force re-render by updating key
      }
    });

    // Log all events globally
    channel.bind_global((eventName, data) => {
      console.log(`Global event received: ${eventName}`, data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  // Function to trigger the event
  const sendTestEvent = async () => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/test-pusher');
      console.log('Test event triggered:', await response.text());
    } catch (error) {
      console.error('Error triggering test event:', error);
    }
  };

  // Debugging: Log messages state
  console.log('Current messages:', messages);

  return (
    <View key={renderKey}> 
      <Text>Pusher Test</Text>
      <Button title="Send Test Event" onPress={sendTestEvent} />
      {messages.length > 0 ? (
        messages.map((message, index) => (
          <Text key={index}>{message.text}</Text> 
        ))
      ) : (
        <Text>No messages yet</Text> 
      )}
    </View>
  );
};

export default PusherTest;
