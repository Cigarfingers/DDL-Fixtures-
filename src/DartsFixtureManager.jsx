import React, { useState, useEffect } from 'react';
import { Calendar, Lock, Unlock, Eye, Download, UserX, Home, Clock } from 'lucide-react';

const DartsFixtureManager = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [view, setView] = useState('public');
  const ADMIN_PASSWORD = 'admin123';
  
  const [leagueName, setLeagueName] = useState('Discord Darts League');
  const [players, setPlayers] = useState([]);
  const [allFixtures, setAllFixtures] = useState([]);
  const [releasedRounds, setReleasedRounds] = useState([]);
  const [scheduledReleases, setScheduledReleases] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [replacementName, setReplacementName] = useState('');
  const [message, setMessage] = useState('');
  const [releaseRound, setReleaseRound] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    const checkReleases = () => {
      const now = new Date();
      scheduledReleases.forEach(schedule => {
        const releaseDate = new Date(schedule.date);
        if (releaseDate <= now && !releasedRounds.includes(schedule.round)) {
          setReleasedRounds(prev => [...prev, schedule.round]);
          setMessage('Round ' + schedule.round + ' automatically released!');
        }
      });
    };
    checkReleases();
    const interval = setInterval(checkReleases, 60000);
    return () => clearInterval(interval);
  }, [scheduledReleases, releasedRounds]);

  const generateRoundRobin = (playerList) => {
    const n = playerList.length;
    if (n % 2 !== 0) {
      playerList.push({ id: 'BYE', name: 'BYE' });
    }
    const rounds = [];
    const numRounds = playerList.length - 1;
    const matchesPerRound = playerList.length / 2;

    for (let round = 0; round < numRounds; round++) {
      const roundMatches = [];
      for (let match = 0; match < matchesPerRound; match++) {
        const home = (round + match) % (playerList.length - 1);
        const away = (playerList.length - 1 - match + round) % (playerList.length - 1);
        const homePlayer = match === 0 ? playerList[playerList.length - 1] : playerList[home];
        const awayPlayer = playerList[away];
        if (homePlayer.id !== 'BYE' && awayPlayer.id !== 'BYE') {
          roundMatches.push({
            id: 'R' + (round + 1) + '-M' + (match + 1),
            round: round + 1,
            leg: 1,
            homeId: homePlayer.id,
            homeName: homePlayer.name,
            awayId: awayPlayer.id,
            awayName: awayPlayer.name
          });
        }
      }
      rounds.push(...roundMatches);
    }
    const reverseFixtures = rounds.map((fixture, idx) => ({
      ...fixture,
      id: 'R' + (fixture.round + numRounds) + '-M' + ((idx % matchesPerRound) + 1),
      round: fixture.round + numRounds,
      leg: 2,
      homeId: fixture.awayId,
      homeName: fixture.awayName,
      awayId: fixture.homeId,
      awayName: fixture.homeName
    }));
    return [...rounds, ...reverseFixtures];
  };

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPasswordInput('');
      setMessage('Admin access granted');
      setView('admin');
    } else {
      setMessage('Error: Incorrect password');
      setPasswordInput('');
    }
  };

  const handleGenerateFixtures = () => {
    if (players.length < 4) {
      setMessage('Error: Minimum 4 players required');
      return;
    }
    if (players.length > 16) {
      setMessage('Error: Maximum 16 players allowed');
      return;
    }
    const generatedFixtures = generateRoundRobin([...players]);
    setAllFixtures(generatedFixtures);
    setReleasedRounds([]);
    setScheduledReleases([]);
    setMessage('Success! Generated ' + generatedFixtures.length + ' fixtures');
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      setMessage('Error: Please enter a player name');
      return;
    }
    if (players.length >= 16) {
      setMessage('Error: Maximum 16 players reached');
      return;
    }
    const newPlayer = { id: 'P' + Date.now(), name: newPlayerName.trim() };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
    setMessage('Success! Added ' + newPlayer.name);
  };

  const handleReplacePlayer = () => {
    if (!selectedPlayer || !replacementName.trim()) {
      setMessage('Error: Please select a player and enter replacement name');
      return;
    }
    const oldPlayer = players.find(p => p.id === selectedPlayer);
    if (!oldPlayer) return;
    const updatedPlayers = players.map(p => p.id === selectedPlayer ? { ...p, name: replacementName.trim() } : p);
    setPlayers(updatedPlayers);
    const updatedFixtures = allFixtures.map(fixture => {
      const updated = { ...fixture };
      if (fixture.homeId === selectedPlayer) updated.homeName = replacementName.trim();
      if (fixture.awayId === selectedPlayer) updated.awayName = replacementName.trim();
      return updated;
    });
    setAllFixtures(updatedFixtures);
    setMessage('Success! Replaced ' + oldPlayer.name + ' with ' + replacementName.trim());
    setSelectedPlayer('');
    setReplacementName('');
  };

  const handleReleaseRound = () => {
    const roundNum = parseInt(releaseRound);
    if (!roundNum || roundNum < 1) {
      setMessage('Error: Please enter a valid round number');
      return;
    }
    if (releasedRounds.includes(roundNum)) {
      setMessage('Error: Round already released');
      return;
    }
    setReleasedRounds([...releasedRounds, roundNum].sort((a, b) => a - b));
    setMessage('Success! Round ' + roundNum + ' is now visible');
    setReleaseRound('');
  };

  const handleScheduleRelease = () => {
    const roundNum = parseInt(releaseRound);
    if (!roundNum || !scheduleDate) {
      setMessage('Error: Please enter round number and date');
      return;
    }
    const newSchedule = { round: roundNum, date: scheduleDate };
    setScheduledReleases([...scheduledReleases, newSchedule].sort((a, b) => a.round - b.round));
    setMessage('Success! Round ' + roundNum + ' scheduled');
    setReleaseRound('');
    setScheduleDate('');
  };

  const releasedFixtures = allFixtures.filter(f => releasedRounds.includes(f.round));
  const groupedFixtures = (isAdmin ? allFixtures : releasedFixtures).reduce((acc, fixture) => {
    if (!acc[fixture.round]) acc[fixture.round] = [];
    acc[fixture.round].push(fixture);
    return acc;
  }, {});
  const totalRounds = allFixtures.length > 0 ? Math.max(...allFixtures.map(f => f.round)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6 border-4 border-yellow-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src="https://i.postimg.cc/htrv8r8f/DDL.png" alt="Discord Darts League" className="w-20 h-20 rounded-full border-4 border-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">{leagueName}</h1>
                <p className="text-gray-600 font-semibold">{isAdmin ? 'Admin Dashboard' : 'Fixture Schedule'}</p>
              </div>
            </div>
            <div>
              {isAdmin ? (
                <button onClick={() => { setIsAdmin(false); setView('public'); }} className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg border-2 border-red-800">
                  <Lock size={20} />Logout
                </button>
              ) : (
                <button onClick={() => setView('login')} className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition shadow-lg border-2 border-yellow-700 font-bold">
                  <Unlock size={20} />Admin Login
                </button>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={'p-4 rounded-lg mb-6 border-2 ' + (message.startsWith('Error') ? 'bg-red-100 text-red-900 border-red-300' : 'bg-green-100 text-green-900 border-green-300')}>
            {message}
          </div>
        )}

        {/* login view */}
        {view === 'login' && !isAdmin && (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto border-4 border-yellow-500">
            <div className="flex justify-center mb-6">
              <img src="https://i.postimg.cc/htrv8r8f/DDL.png" alt="Discord Darts League" className="w-24 h-24 rounded-full border-4 border-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">Admin Login</h2>
            <div className="space-y-4">
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full p-3 border-2 border-blue-300 rounded-lg focus:border-yellow-500 focus:outline-none" placeholder="Enter admin password" />
              <button onClick={handleLogin} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition font-bold shadow-lg border-2 border-yellow-700">Login</button>
              <button onClick={() => setView('public')} className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition">Back to Fixtures</button>
            </div>
          </div>
        )}

        {/* admin views */}
        {/* ...rest of component unchanged (fixture release, replace, display, etc) */}
      </div>
    </div>
  );
};

export default DartsFixtureManager;
