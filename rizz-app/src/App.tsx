import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { RizzProvider, useRizz } from './context/RizzContext';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
    const { currentView } = useRizz();

    return (
        <Layout>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentView}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {currentView === 'home' && <Home />}
                    {currentView === 'chat' && <Chat />}
                    {currentView === 'profile' && <Profile />}
                </motion.div>
            </AnimatePresence>
        </Layout>
    );
}

function App() {
    return (
        <RizzProvider>
            <AppContent />
        </RizzProvider>
    );
}

export default App;
