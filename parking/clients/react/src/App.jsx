import { isAdmin, isSensor } from '../../shared/roles.js';
import AdminPanel from './components/AdminPanel.jsx';
import Hero from './components/Hero.jsx';
import LanguagePanel from './components/LanguagePanel.jsx';
import LanguagePicker from './components/LanguagePicker.jsx';
import LoginPanel from './components/LoginPanel.jsx';
import LotList from './components/LotList.jsx';
import SensorPanel from './components/SensorPanel.jsx';
import UsersPanel from './components/UsersPanel.jsx';
import { useParking } from './useParking.js';

export default function App() {
  const parking = useParking();
  const { user } = parking;

  return (
    <>
      <div className="backdrop"></div>
      <LanguagePicker parking={parking} />
      <main className="page">
        <Hero parking={parking} />
        <section className="grid">
          <LotList parking={parking} />
          <LanguagePanel parking={parking} />
          <LoginPanel parking={parking} />
          {isAdmin(user) && <AdminPanel parking={parking} />}
          {isSensor(user) && <SensorPanel parking={parking} />}
          {isAdmin(user) && <UsersPanel parking={parking} />}
        </section>
      </main>
    </>
  );
}
