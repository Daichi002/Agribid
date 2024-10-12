import Echo from 'laravel-echo';
import Pusher from '@pusher/pusher-websocket-react-native';

const echo = new Echo({
  broadcaster: 'pusher',
  key: '87916f2c03247f41316e',
  cluster: 'ap1', // Ensure this matches your setup
  forceTLS: true,
  encrypted: true,
  client: new Pusher("87916f2c03247f41316e", {
    cluster: 'ap1', // Ensure this matches your setup
    forceTLS: true,
  }),
});

export default echo;
