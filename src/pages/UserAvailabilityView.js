import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

export default function UserAvailabilityView() {
  const navigate = useNavigate();

  // 현재 한국 시간 기준 요일 계산
  const getKoreanDay = () => {
    const now = new Date();
    // 한국 시간으로 변환 (UTC+9)
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const day = koreaTime.getUTCDay();
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    return dayMap[day];
  };

  const today = getKoreanDay();
  const dayOrder = ['월', '화', '수', '목', '금'];
  const todayIndex = dayOrder.indexOf(today);

  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);

  // Firebase에서 사용자 데이터 로드
  useEffect(() => {
    const loadUsers = () => {
      const usersRef = ref(database, 'honbabUsers');
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const convertedUsers = Object.values(data).map(user => ({
            id: user.id,
            name: user.name,
            availableDays: user.availableDays.map(day => {
              const dayMap = { 'Mon': '월', 'Tue': '화', 'Wed': '수', 'Thu': '목', 'Fri': '금' };
              return dayMap[day] || day;
            })
          }));
          console.log('Loaded users from Firebase:', convertedUsers); // 디버깅용
          setUsers(convertedUsers);
        } else {
          setUsers([]);
        }
      });
    };

    loadUsers();

    // 매주 토요일 00:00에 데이터 초기화
    const checkAndResetDB = () => {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      
      // 토요일 00:00인지 확인
      if (koreaTime.getUTCDay() === 6 && koreaTime.getUTCHours() === 0 && koreaTime.getUTCMinutes() === 0) {
        set(ref(database, 'honbabUsers'), null);
        setUsers([]);
      }
    };

    // 페이지 로드 시 체크
    checkAndResetDB();
    
    // 매분마다 체크
    const interval = setInterval(checkAndResetDB, 60000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleReserve = () => {
    if (selectedUsers.length === 0) return;
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    window.history.back(); // 브라우저 히스토리에서 이전 페이지로
  };

  // 밥그릇 SVG 구현 (LunchAvailabilityForm에서 사용하는 것과 동일)
  const HappyRiceBowl = () => (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g transform="translate(10, 10)">
        {/* 그림자 */}
        <ellipse cx="50" cy="105" rx="20" ry="5" fill="#f3e3c2" opacity="0.6" />
        
        {/* 밥그릇 - 흰색으로 변경, 아랫부분 둥글게 */}
        <path d="M20 40 C20 20, 80 20, 80 40 L78 75 C70 90, 30 90, 22 75 Z" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
        <ellipse cx="50" cy="40" rx="30" ry="10" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
        <ellipse cx="50" cy="40" rx="25" ry="6" fill="#f5f5f5" stroke="none" />
        
        {/* 웃는 얼굴 */}
        <ellipse cx="35" cy="50" rx="5" ry="7" fill="#3a2a15" />
        <ellipse cx="65" cy="50" rx="5" ry="7" fill="#3a2a15" />
        <path d="M30 60 C40 70, 60 70, 70 60" fill="none" stroke="#3a2a15" strokeWidth="3" />
        <path d="M30 40 C35 35, 45 35, 45 40" fill="none" stroke="#3a2a15" strokeWidth="2" />
        <path d="M55 40 C60 35, 70 35, 70 40" fill="none" stroke="#3a2a15" strokeWidth="2" />
        
        {/* 팔 */}
        <path d="M15 50 C0 45, 5 25, 15 35" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
        <path d="M85 50 C90 40, 105 40, 95 55" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
        
        {/* 손 */}
        <ellipse cx="15" cy="50" rx="6" ry="5" fill="#68b3c7" stroke="#3a2a15" strokeWidth="2" />
        <ellipse cx="95" cy="55" rx="7" ry="6" fill="#68b3c7" stroke="#3a2a15" strokeWidth="2" transform="rotate(-10, 95, 55)" />
        
        {/* OK 표시 */}
        <path d="M90 55 C95 50, 100 55, 95 60 L90 65" fill="none" stroke="#3a2a15" strokeWidth="2" />
      </g>
    </svg>
  );

  return (
    <div className="content-wrapper">
      {/* 앱 이름 */}
      <div className="app-title-container text-center">
        <h1 className="app-title" style={{ cursor: 'pointer' }} onClick={() => window.history.back()}>혼밥노노</h1>
        <div className="divider"></div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
        {users.length === 0 ? (
          // 데이터가 없을 때 표시
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            fontSize: '16px'
          }}>
            이번 주 점약 내용이 아직 없어요.
          </div>
        ) : (
          <div>
            {/* 점심 가능한 동료들 리스트 */}
            <div className="form-group">
              <label className="form-label">점심 가능한 동료들</label>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {users.map(user => (
                  <div 
                    key={user.id} 
                    className={`list-item ${selectedUsers.some(u => u.id === user.id) ? 'selected' : ''}`} 
                    onClick={() => toggleUserSelection(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      border: '2px solid #f3e3c2',
                      borderRadius: '12px',
                      backgroundColor: selectedUsers.some(u => u.id === user.id) ? '#e8f5e9' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div className="button-option-icon" style={{width: '40px', height: '40px', marginRight: '15px', position: 'relative'}}>
                      <HappyRiceBowl />
                      {selectedUsers.some(u => u.id === user.id) && (
                        <div className="selection-indicator green">✓</div>
                      )}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '16px', fontWeight: 'bold'}}>{user.name}</div>
                    </div>
                    <div style={{display: 'flex', gap: '5px'}}>
                      {user.availableDays.filter(day => dayOrder.indexOf(day) >= todayIndex).map(day => (
                        <span 
                          key={day}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            backgroundColor: '#f3e3c2',
                            color: '#3a2a15'
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 멤버 */}
            {selectedUsers.length > 0 && (
              <div className="form-group">
                <label className="form-label">오늘 점심 멤버</label>
                <div style={{
                  padding: '20px',
                  border: '2px solid #68b3c7',
                  borderRadius: '20px',
                  backgroundColor: '#f0f9fb'
                }}>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                    {selectedUsers.map(user => (
                      <div 
                        key={user.id} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '5px 10px',
                          backgroundColor: '#68b3c7',
                          color: '#ffffff',
                          borderRadius: '20px',
                          fontSize: '14px'
                        }}
                      >
                        <span>{user.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserSelection(user);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            marginLeft: '8px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '0 5px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 점약잡기 버튼 */}
        {selectedUsers.length > 0 && (
          <div className="form-footer">
            <button onClick={handleReserve} className="submit-button">
              이 멤버로 점약잡기
            </button>
          </div>
        )}
      </div>

      {/* 점약 확인 다이얼로그 */}
      {showDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#3a2a15',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              연락은 Knox 메신저로 :-)
            </h3>

            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3a2a15' }}>
                같점 되는 날짜: {(() => {
                  // 선택된 사용자들의 공통 가능한 날짜 계산
                  if (selectedUsers.length === 0) return today + '요일';
                  
                  const commonDays = selectedUsers[0].availableDays.filter(day => 
                    selectedUsers.every(user => user.availableDays.includes(day)) &&
                    dayOrder.indexOf(day) >= todayIndex
                  );
                  
                  if (commonDays.length === 0) return '공통 가능일 없음';
                  return commonDays.join(', ') + '요일';
                })()}
              </p>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3a2a15' }}>
                멤버: {selectedUsers.map(user => user.name).join(', ')}
              </p>
            </div>

            <button
              onClick={handleCloseDialog}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#68b3c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}