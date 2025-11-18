import { useState, useEffect } from 'react';
import { getMyAchievements, getUserAchievements } from '../database/api';

export default function AchievementsSection({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unlocked', 'locked'

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = userId 
        ? await getUserAchievements(userId)
        : await getMyAchievements();
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked_at != null;
    if (filter === 'locked') return a.unlocked_at == null;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;
  const totalPoints = achievements
    .filter(a => a.unlocked_at)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  const getCategoryColor = (category) => {
    const colors = {
      games: '#8b5cf6',
      reviews: '#3b82f6',
      social: '#10b981',
      special: '#f59e0b'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
        Loading achievements...
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ 
        display: 'flex', 
        gap: '2rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#1b1b25',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {unlockedCount}/{achievements.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Achievements Unlocked
          </div>
        </div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {totalPoints}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Total Points
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            height: '8px', 
            background: '#2f2f3a', 
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              height: '100%',
              width: `${(unlockedCount / achievements.length * 100)}%`,
              background: 'var(--primary)',
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            {Math.round(unlockedCount / achievements.length * 100)}% Complete
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button 
          className={filter === 'all' ? 'btn primary' : 'btn'}
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </button>
        <button 
          className={filter === 'unlocked' ? 'btn primary' : 'btn'}
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({unlockedCount})
        </button>
        <button 
          className={filter === 'locked' ? 'btn primary' : 'btn'}
          onClick={() => setFilter('locked')}
        >
          Locked ({achievements.length - unlockedCount})
        </button>
      </div>

      {/* Achievements Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {filteredAchievements.map((achievement) => (
          <div 
            key={achievement.id}
            style={{
              background: achievement.unlocked_at ? '#1b1b25' : '#13131a',
              padding: '1.5rem',
              borderRadius: '8px',
              border: achievement.unlocked_at ? `2px solid ${getCategoryColor(achievement.category)}` : '2px solid #2f2f3a',
              opacity: achievement.unlocked_at ? 1 : 0.6,
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ 
                fontSize: '2.5rem',
                filter: achievement.unlocked_at ? 'none' : 'grayscale(100%)'
              }}>
                {achievement.icon || '🏆'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{ margin: 0 }}>{achievement.name}</h3>
                  <div style={{ 
                    padding: '0.2rem 0.5rem',
                    background: getCategoryColor(achievement.category),
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'white'
                  }}>
                    {achievement.points}pts
                  </div>
                </div>
                <p style={{ 
                  color: 'var(--muted)', 
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  marginBottom: '0.5rem'
                }}>
                  {achievement.description}
                </p>
                {achievement.unlocked_at && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: getCategoryColor(achievement.category),
                    fontWeight: 'bold'
                  }}>
                    ✓ Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </div>
                )}
                {!achievement.unlocked_at && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--muted)'
                  }}>
                    🔒 Locked
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          No achievements found
        </div>
      )}
    </div>
  );
}

