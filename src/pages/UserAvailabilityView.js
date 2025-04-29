import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, onValue, set, get, child } from 'firebase/database';

export default function UserAvailabilityView() {
  const navigate = useNavigate();
  const [myName, setMyName] = useState('');
  const [myUserId, setMyUserId] = useState(''); // 사용자 ID 저장 위한 상태 추가
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [deletedUser, setDeletedUser] = useState(null);
  const [deletedUserKey, setDeletedUserKey] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null); // 현재 열린 메뉴를 추적

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

  // Firebase에서 사용자 데이터 로드
  useEffect(() => {
    // Firebase에서 현재 사용자 정보 가져오기
    const fetchCurrentUser = async () => {
      try {
        // 현재 로그인한 사용자 ID를 사용하거나 또는 다른 방법으로 현재 사용자 식별
        const userId = localStorage.getItem('honbabUserId');
        
        if (userId) {
          setMyUserId(userId);
          
          // Firebase에서 해당 사용자 정보 조회
          const dbRef = ref(database);
          const snapshot = await get(child(dbRef, 'honbabUsers'));
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            // 모든 사용자 데이터에서 현재 사용자 찾기
            Object.entries(data).forEach(([key, user]) => {
              if (user.id.toString() === userId) { // 명시적으로 문자열 변환
                setMyName(user.name);
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      }
    };

    fetchCurrentUser();

    const loadUsers = () => {
      const usersRef = ref(database, 'honbabUsers');
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Firebase 데이터를 배열로 변환하되, 키도 함께 저장
          const convertedUsers = Object.entries(data).map(([key, user]) => ({
            id: user.id,
            name: user.name,
            firebaseKey: key, // Firebase 키 저장
            availableDays: user.availableDays ? user.availableDays.map(day => {
              const dayMap = { 'Mon': '월', 'Tue': '화', 'Wed': '수', 'Thu': '목', 'Fri': '금' };
              return dayMap[day] || day;
            }) : [],
            availableToday: user.availableToday, // 오늘 가능 여부도 함께 저장
            originalAvailableDays: user.availableDays // 원본 요일 데이터도 저장 (편집 시 사용)
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
        localStorage.removeItem('honbabUserId'); // 로컬 스토리지도 함께 초기화
        setUsers([]);
      }
    };

    // 클릭 이벤트 리스너 추가 (메뉴 밖 클릭 시 메뉴 닫기)
    const handleClickOutside = (event) => {
      if (activeMenu && !event.target.closest('.more-menu') && !event.target.closest('.more-icon')) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);

    // 페이지 로드 시 체크
    checkAndResetDB();
    
    // 매분마다 체크
    const interval = setInterval(checkAndResetDB, 60000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

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

  // 사용자 데이터 삭제 함수
  const deleteUserData = async (user) => {
    if (!user || !user.firebaseKey) return;
    
    try {
      // 삭제 전에 사용자 데이터 백업
      setDeletedUser(user);
      setDeletedUserKey(user.firebaseKey);
      
      // Firebase에서 항목 삭제
      await set(ref(database, `honbabUsers/${user.firebaseKey}`), null);
      
      // 내 데이터를 삭제한 경우 로컬 스토리지도 초기화
      if (user.id.toString() === myUserId) {
        localStorage.removeItem('honbabUserId');
      }
      
      // 활성 메뉴 닫기
      setActiveMenu(null);
      
      // 토스트 메시지 표시
      setShowToast(true);
      
      // 5초 후 토스트 숨기기
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (error) {
      console.error('삭제 중 오류 발생:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 사용자 데이터 편집 함수
  const editUserData = (user) => {
    // 로컬 스토리지에 편집 중인 사용자 정보 저장
    localStorage.setItem('editingUserId', user.id.toString());
    
    // 사용자 원본 데이터를 LunchAvailabilityForm에서 사용할 수 있게 저장
    if (user.originalAvailableDays) {
      localStorage.setItem('editingUserAvailableDays', JSON.stringify(user.originalAvailableDays));
    }
    
    localStorage.setItem('editingUserAvailableToday', user.availableToday);
    localStorage.setItem('editingUserName', user.name);
    
    // 활성 메뉴 닫기
    setActiveMenu(null);
    
    // 편집 페이지로 이동
    navigate('/');
  };

  // 삭제된 데이터 복구 함수
  const restoreUserData = async () => {
    if (!deletedUser || !deletedUserKey) return;
    
    try {
      // Firebase에 원래 데이터 다시 저장
      const restoredUser = {
        id: deletedUser.id,
        name: deletedUser.name,
        availableDays: deletedUser.availableDays.map(day => {
          const dayMapReverse = { '월': 'Mon', '화': 'Tue', '수': 'Wed', '목': 'Thu', '금': 'Fri' };
          return dayMapReverse[day] || day;
        }),
        availableToday: deletedUser.availableToday // 오늘 가능 여부도 복구
      };
      
      await set(ref(database, `honbabUsers/${deletedUserKey}`), restoredUser);
      
      // 내 데이터였다면 로컬 스토리지도 복원
      if (deletedUser.id.toString() === myUserId) {
        localStorage.setItem('honbabUserId', deletedUser.id.toString());
      }
      
      // 토스트 메시지 숨기기
      setShowToast(false);
    } catch (error) {
      console.error('복구 중 오류 발생:', error);
      alert('복구 중 오류가 발생했습니다.');
    }
  };

  // 더보기 메뉴 토글 함수
  const toggleMoreMenu = (userId, e) => {
    e.stopPropagation(); // 버블링 방지
    setActiveMenu(activeMenu === userId ? null : userId);
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

  // 더보기 아이콘 (Material Design vertical dots)
  const MoreIcon = ({ onClick }) => (
    <div 
      className="more-icon" 
      onClick={onClick} 
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '24px',
        height: '24px',
        padding: '4px',
        cursor: 'pointer'
      }}
    >
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d9c7a5' }}></div>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d9c7a5' }}></div>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d9c7a5' }}></div>
    </div>
  );

  // 토스트 메시지 컴포넌트
  const Toast = () => (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#333',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: 1000,
      maxWidth: '90%',
      width: '350px'
    }}>
      <span>항목이 삭제되었습니다</span>
      <button 
        onClick={restoreUserData}
        style={{
          backgroundColor: 'transparent',
          color: 'white',
          border: '1px solid white',
          borderRadius: '4px',
          padding: '5px 10px',
          marginLeft: '10px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        복구하기
      </button>
    </div>
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
                {users.map(user => {
                  const isMyData = user.id.toString() === myUserId; // 명시적으로 문자열 변환
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  
                  return (
                        <div 
                          key={user.id} 
                          className={`list-item ${isSelected ? 'selected' : ''}`} 
                          onClick={() => toggleUserSelection(user)}
                          style={{
                            display: 'flex', 
                            padding: '12px 16px',
                            border: '1px solid #f3e3c2',
                            borderRadius: '12px',
                            backgroundColor: isSelected ? '#e8f5e9' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                      {/* 왼쪽: 아이콘과 이름, 날짜 */}
                      <div style={{
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {/* 밥그릇 아이콘 */}
                        <div style={{
                          width: '50px', 
                          height: '50px', 
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <HappyRiceBowl />
                          {isSelected && (
                            <div className="selection-indicator green">✓</div>
                          )}
                          {/* '나' 태그 - 위치 변경 및 선택 시 숨김 처리 */}
                          {isMyData && !isSelected && (
                            <span style={{
                              position: 'absolute', 
                              top: '0px',
                              left: '-5px',  // 왼쪽 상단으로 위치 변경
                              backgroundColor: '#68b3c7',
                              color: 'white',
                              fontSize: '12px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              zIndex: 2
                            }}>
                              나
                            </span>
                          )}
                        </div>
                        
                        {/* 이름과 날짜 */}
                        <div style={{
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          {/* 이름 */}
                          <div style={{
                            display: 'flex', 
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontSize: '16px', 
                              fontWeight: 'bold'
                            }}>{user.name}</span>
                          </div>
                          
                          {/* 날짜 표시 */}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px'
                          }}>
                            {user.availableDays.filter(day => dayOrder.indexOf(day) >= todayIndex).map(day => (
                              <span 
                                key={day}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '14px',
                                  backgroundColor: '#f3e3c2',
                                  color: '#3a2a15'
                                }}
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* 오른쪽: 더보기 메뉴 아이콘 */}
                      <div style={{ 
                        position: 'relative', 
                        marginLeft: '10px' 
                      }}>
                        <div 
                          className="more-icon" 
                          onClick={(e) => toggleMoreMenu(user.id, e)} 
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '24px',
                            height: '24px',
                            padding: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#f3e3c2' }}></div>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#f3e3c2' }}></div>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#f3e3c2' }}></div>
                        </div>
                        
                        {/* 더보기 메뉴 */}
                        {activeMenu === user.id && (
                          <div 
                            className="more-menu"
                            style={{
                              position: 'absolute',
                              top: '30px',
                              right: '0',
                              backgroundColor: 'white',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                              borderRadius: '8px',
                              padding: '8px 0',
                              zIndex: 10,
                              width: '120px'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                editUserData(user);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                                textAlign: 'left',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#3a2a15'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              편집
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteUserData(user);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                                textAlign: 'left',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#ff6b6b'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
      
      {/* 토스트 메시지 */}
      {showToast && <Toast />}
    </div>
  );
}