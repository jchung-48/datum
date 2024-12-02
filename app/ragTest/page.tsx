// pages/index.tsx
import ChatBotInterface from '../components/chatBotInterface';
import {NextPage} from 'next';

const HomePage: NextPage = () => {
    return (
        <div>
            <h1>Welcome to My Next.js App</h1>
            {/* Add other components and content here */}

            {/* ChatBot Interface Component */}
            <ChatBotInterface />
        </div>
    );
};

export default HomePage;
