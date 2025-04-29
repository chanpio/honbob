import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, set, push, get, onValue } from 'firebase/database';

export default function LunchAvailabilityForm() {
  const [name, setName] = useState('');
  const [availableToday, setAvailableToday] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    'Mon': false,
    'Tue': false,
    'Wed': false,
    'Thu': false,
    'Fri': false
  });
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false); // 편집 모드인지 여부
  const [editingUserId, setEditingUserId] = useState(null); // 편집 중인 사용자 ID
  const [editingUserKey, setEditingUserKey] = useState(null); // 편집 중인 사용자의 Firebase 키
  const [animatingHappy, setAnimatingHappy] = useState(false); // 행복한 밥그릇 애니메이션 상태
  const [animatingSad, setAnimatingSad] = useState(false); // 슬픈 밥그릇 애니메이션 상태
  
  const navigate = useNavigate();

  // 현재 한국 시간 기준 요일 계산
  const getKoreanDay = () => {
    const now = new Date();
    // 한국 시간으로 변환 (UTC+9)
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const day = koreaTime.getUTCDay();
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayMap[day];
  };

  // 매주 토요일 00:00에 DB 리셋 및 편집 모드 체크
  useEffect(() => {
    const checkAndResetDB = () => {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      
      // 토요일 00:00인지 확인
      if (koreaTime.getUTCDay() === 6 && koreaTime.getUTCHours() === 0 && koreaTime.getUTCMinutes() === 0) {
        // Firebase DB 초기화
        set(ref(database, 'honbabUsers'), null);
        // 로컬 스토리지도 초기화
        localStorage.removeItem('honbabUserId');
        localStorage.removeItem('editingUserId');
        localStorage.removeItem('editingUserAvailableDays');
        localStorage.removeItem('editingUserAvailableToday');
        localStorage.removeItem('editingUserName');
      }
    };

    // 페이지 로드 시 체크
    checkAndResetDB();
    
    // 편집 모드 체크 (UserAvailabilityView에서 넘어온 경우)
    const editingUserId = localStorage.getItem('editingUserId');
    if (editingUserId) {
      setIsEditing(true);
      setEditingUserId(editingUserId);
      
      // 이름 설정
      const editingUserName = localStorage.getItem('editingUserName');
      if (editingUserName) {
        setName(editingUserName);
      }
      
      // 요일 정보 설정
      const savedAvailableDays = localStorage.getItem('editingUserAvailableDays');
      if (savedAvailableDays) {
        try {
          const parsedAvailableDays = JSON.parse(savedAvailableDays);
          if (Array.isArray(parsedAvailableDays)) {
            const newAvailability = { ...weeklyAvailability };
            parsedAvailableDays.forEach(day => {
              newAvailability[day] = true;
            });
            setWeeklyAvailability(newAvailability);
          }
        } catch (error) {
          console.error('요일 정보 파싱 오류:', error);
        }
      }
      
      // 오늘 가능 여부 설정
      const editingUserAvailableToday = localStorage.getItem('editingUserAvailableToday');
      if (editingUserAvailableToday) {
        setAvailableToday(editingUserAvailableToday === 'true');
      }
      
      // Firebase에서 해당 사용자의 키 찾기
      const findUserKey = async () => {
        const usersRef = ref(database, 'honbabUsers');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.entries(data).forEach(([key, user]) => {
            if (user.id.toString() === editingUserId) {
              setEditingUserKey(key);
            }
          });
        }
      };
      findUserKey();
    } else {
      // 일반 모드 (새 데이터 입력)
      // 이미 저장된 사용자 ID가 있는지 확인하고 이름 불러오기
      const savedUserId = localStorage.getItem('honbabUserId');
      if (savedUserId) {
        const usersRef = ref(database, 'honbabUsers');
        get(usersRef).then((snapshot) => {
          if (snapshot.exists()) {
            const users = snapshot.val();
            Object.values(users).forEach(user => {
              if (user.id.toString() === savedUserId) {
                setName(user.name);
                
                // 저장된 요일 정보가 있다면 설정
                if (user.availableDays && Array.isArray(user.availableDays)) {
                  const newAvailability = { ...weeklyAvailability };
                  user.availableDays.forEach(day => {
                    newAvailability[day] = true;
                  });
                  setWeeklyAvailability(newAvailability);
                }
                
                // 오늘 가능 여부 설정
                if (user.availableToday !== undefined && user.availableToday !== null) {
                  setAvailableToday(user.availableToday);
                }
              }
            });
          }
        });
      }
    }
    
    // 매분마다 체크
    const interval = setInterval(checkAndResetDB, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const today = getKoreanDay();
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const dayDisplay = {
    'Mon': '월',
    'Tue': '화',
    'Wed': '수',
    'Thu': '목',
    'Fri': '금'
  };
  const todayIndex = dayOrder.indexOf(today);
  const isWeekend = today === 'Sat' || today === 'Sun';

  const toggleDay = (day) => {
    // 주말인 경우: 모든 요일 선택 가능 (다음 주 월-금)
    // 평일인 경우: 오늘 이전의 날짜는 선택 불가
    if (!isWeekend && dayOrder.indexOf(day) < todayIndex) {
      return;
    }
    
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  // 점심 약속 없음/있음 선택 시 요일 자동 업데이트 및 애니메이션 실행
  const setAvailableTodayAndUpdate = (isAvailable) => {
    setAvailableToday(isAvailable);
    
    // 애니메이션 상태 설정
    if (isAvailable) {
      setAnimatingHappy(true);
      setTimeout(() => setAnimatingHappy(false), 1000);
    } else {
      setAnimatingSad(true);
      setTimeout(() => setAnimatingSad(false), 1000);
    }
    
    if (isAvailable) {
      // 점심 약속 없음 선택 시 오늘 요일 자동으로 체크 (주말 제외)
      if (!isWeekend && dayOrder.includes(today)) {
        setWeeklyAvailability(prev => ({
          ...prev,
          [today]: true
        }));
      }
    } else {
      // 점심 약속 있음 선택 시 오늘만 체크 해제하고 다른 요일은 유지
      if (!isWeekend && dayOrder.includes(today)) {
        setWeeklyAvailability(prev => ({
          ...prev,
          [today]: false
        }));
      }
    }
  };

  // 해당 요일이 오늘보다 이전인지 확인하는 함수
  const isPastDay = (day) => {
    // 주말인 경우 모든 요일 선택 가능
    if (isWeekend) {
      return false;
    }
    return dayOrder.indexOf(day) < todayIndex;
  };
  
  // 폼 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 숨은 기능: "파괴왕 피오" 입력 시 모든 데이터 삭제
    if (name === "파괴왕 피오") {
      // Firebase DB 초기화
      set(ref(database, 'honbabUsers'), null);
      // 로컬 스토리지도 초기화
      localStorage.removeItem('honbabUserId');
      localStorage.removeItem('editingUserId');
      localStorage.removeItem('editingUserAvailableDays');
      localStorage.removeItem('editingUserAvailableToday');
      localStorage.removeItem('editingUserName');
      
      setErrorMessage('💥 모든 데이터가 삭제되었습니다! 💥');
      setShowErrorDialog(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return;
    }
    
    // 이름 검증
    if (!name) {
      setErrorMessage('이름을 입력해주세요!');
      setShowErrorDialog(true);
      return;
    }
    
    // 평일인 경우만 오늘 점심 가능 여부 체크
    if (!isWeekend && availableToday === null) {
      setErrorMessage('오늘 점심 가능 여부를 선택해주세요!');
      setShowErrorDialog(true);
      return;
    }
    
    // 평일이고 오늘 점심 불가능하며 다른 요일도 모두 선택되지 않은 경우
    if (!isWeekend && 
        availableToday === false && 
        !Object.values(weeklyAvailability).some(val => val === true)) {
      // 점심 약속 있음을 선택하고 다른 요일도 모두 불가능한 경우, 감사 메시지 표시
      setErrorMessage('다음에 함께해요!');
      setShowErrorDialog(true);
      return;
    }
    
    // 사용자 정보 생성
    let userId;
    
    if (isEditing) {
      // 편집 모드: 기존 ID 사용
      userId = editingUserId;
    } else {
      // 신규 모드: 기존 ID가 있으면 사용, 없으면 새로 생성
      const savedUserId = localStorage.getItem('honbabUserId');
      userId = savedUserId || Date.now().toString();
    }
    
    const userData = {
      id: userId,
      name,
      availableToday: isWeekend ? null : availableToday, // 주말엔 오늘 점심 데이터를 null로
      availableDays: Object.keys(weeklyAvailability).filter(day => weeklyAvailability[day])
    };
    
    // Firebase에 사용자 데이터 저장
    if (isEditing && editingUserKey) {
      // 편집 모드: 기존 데이터 업데이트
      set(ref(database, `honbabUsers/${editingUserKey}`), userData)
        .then(() => {
          // 편집 관련 로컬 스토리지 정보 삭제
          localStorage.removeItem('editingUserId');
          localStorage.removeItem('editingUserAvailableDays');
          localStorage.removeItem('editingUserAvailableToday');
          localStorage.removeItem('editingUserName');
          
          // 사용자 ID는 유지
          localStorage.setItem('honbabUserId', userId);
          
          // 사용자 목록 페이지로 이동
          navigate('/users');
        })
        .catch(error => {
          console.error('데이터 업데이트 오류:', error);
          setErrorMessage('데이터 저장 중 오류가 발생했습니다.');
          setShowErrorDialog(true);
        });
    } else {
      // 신규 모드 또는 키를 찾지 못한 경우
      const usersRef = ref(database, 'honbabUsers');
      
      get(usersRef).then((snapshot) => {
        const existingUsers = snapshot.val() || {};
        
        // 이미 같은 ID의 사용자가 있는지 확인
        let userKey = null;
        Object.entries(existingUsers).forEach(([key, user]) => {
          if (user.id.toString() === userId) {
            userKey = key;
          }
        });
        
        if (userKey) {
          // 기존 사용자 업데이트
          set(ref(database, `honbabUsers/${userKey}`), userData);
        } else {
          // 새 사용자 추가
          push(ref(database, 'honbabUsers'), userData);
        }
        
        // 사용자 ID를 로컬 스토리지에 저장
        localStorage.setItem('honbabUserId', userId);
        
        // 다음 페이지로 이동
        navigate('/users');
      });
    }
  };

  // 행복한 밥그릇 SVG 수정 부분
const HappyRiceBowl = () => {
  // 애니메이션 상태 관리
  const [eyesClosed, setEyesClosed] = useState(false);

  // 애니메이션 효과
 useEffect(() => {
    if (animatingHappy) {
      // 눈 깜빡임 애니메이션
      const blinkInterval = setInterval(() => {
        setEyesClosed(prev => !prev);
      }, 200);
      
      // 3번 깜빡이고 멈춤
      setTimeout(() => {
        clearInterval(blinkInterval);
        setEyesClosed(false);
      }, 1200);
      
      return () => clearInterval(blinkInterval);
    }
  }, [animatingHappy]);
    
 // 애니메이션 스타일
  const animStyle = animatingHappy 
    ? {
        animation: 'shake 0.5s ease infinite',
        transformOrigin: 'center bottom'
      } 
    : {};
      
    // 눈 애니메이션
  const leftEye = eyesClosed 
    ? <path d="M30 50 C35 47, 40 47, 45 50" fill="none" stroke="#3a2a15" strokeWidth="2" />
    : <ellipse cx="35" cy="50" rx="5" ry="7" fill="#3a2a15" />;
    
  const rightEye = eyesClosed 
    ? <path d="M55 50 C60 47, 65 47, 70 50" fill="none" stroke="#3a2a15" strokeWidth="2" />
    : <ellipse cx="65" cy="50" rx="5" ry="7" fill="#3a2a15" />;
    
  return (
    <>
      <style>
        {`
          @keyframes shake {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            50% { transform: rotate(0deg); }
            75% { transform: rotate(5deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <g transform="translate(10, 10)">
          {/* 그림자 */}
          <ellipse cx="50" cy="105" rx="20" ry="5" fill="#f3e3c2" opacity="0.6" />
          
          {/* 밥그릇 - 흰색으로 변경, 아랫부분 둥글게 */}
          <g style={animStyle}>
            <path d="M20 40 C20 20, 80 20, 80 40 L78 75 C70 90, 30 90, 22 75 Z" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="50" cy="40" rx="30" ry="10" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="50" cy="40" rx="25" ry="6" fill="#f5f5f5" stroke="none" />
            
            {/* 웃는 얼굴 */}
            {leftEye}
            {rightEye}
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
        </g>
      </svg>
    </>
  );
};

// 슬픈 밥그릇 SVG 수정 부분
const SadRiceBowl = () => {
  // 애니메이션 상태 관리
  const [eyesClosed, setEyesClosed] = useState(false);
  
  // 애니메이션 효과
  useEffect(() => {
    if (animatingSad) {
      // 눈 깜빡임 애니메이션
      const blinkInterval = setInterval(() => {
        setEyesClosed(prev => !prev);
      }, 200);
      
      // 3번 깜빡이고 멈춤
      setTimeout(() => {
        clearInterval(blinkInterval);
        setEyesClosed(false);
      }, 1200);
      
      return () => clearInterval(blinkInterval);
    }
  }, [animatingSad]);
  
  // 애니메이션 스타일
  const animStyle = animatingSad 
    ? {
        animation: 'shakeHead 0.5s ease infinite',
        transformOrigin: 'center bottom'
      } 
    : {};
    
  // 눈 애니메이션
  const leftEye = eyesClosed 
    ? <path d="M30 50 C35 47, 40 47, 45 50" fill="none" stroke="#3a2a15" strokeWidth="2" />
    : <ellipse cx="35" cy="50" rx="5" ry="7" fill="#3a2a15" />;
    
  const rightEye = eyesClosed 
    ? <path d="M55 50 C60 47, 65 47, 70 50" fill="none" stroke="#3a2a15" strokeWidth="2" />
    : <ellipse cx="65" cy="50" rx="5" ry="7" fill="#3a2a15" />;
  
  return (
    <>
      <style>
        {`
          @keyframes shakeHead {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-3deg) translateX(-2px); }
            75% { transform: rotate(3deg) translateX(2px); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <g transform="translate(10, 10)">
          {/* 그림자 */}
          <ellipse cx="50" cy="105" rx="20" ry="5" fill="#f3e3c2" opacity="0.6" />
          
          {/* 밥그릇 - 흰색으로 변경, 아랫부분 둥글게 */}
          <g style={animStyle}>
            <path d="M20 40 C20 20, 80 20, 80 40 L78 75 C70 90, 30 90, 22 75 Z" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="50" cy="40" rx="30" ry="10" fill="#ffffff" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="50" cy="40" rx="25" ry="6" fill="#f5f5f5" stroke="none" />
            
            {/* 밥 */}
            <path d="M30 30 C40 20, 60 20, 70 30" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="50" cy="30" rx="20" ry="10" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
            
            {/* 밥에 들어간 홈 */}
            <path d="M45 30 C45 28, 46 28, 46 30" stroke="#f9ebd0" strokeWidth="1" opacity="0.7" />
            <path d="M50 28 C51 26, 52 26, 53 28" stroke="#f9ebd0" strokeWidth="1" opacity="0.7" />
            <path d="M38 28 C39 26, 40 26, 41 28" stroke="#f9ebd0" strokeWidth="1" opacity="0.7" />
            <path d="M60 28 C61 26, 62 26, 63 28" stroke="#f9ebd0" strokeWidth="1" opacity="0.7" />
            
            {/* 슬픈 얼굴 */}
            {leftEye}
            {rightEye}
            <path d="M30 70 C40 60, 60 60, 70 70" fill="none" stroke="#3a2a15" strokeWidth="3" />
            <path d="M30 35 C35 38, 40 38, 45 35" fill="none" stroke="#3a2a15" strokeWidth="2" />
            <path d="M55 35 C60 38, 65 38, 70 35" fill="none" stroke="#3a2a15" strokeWidth="2" />
            
            {/* 팔 */}
            <path d="M15 50 C0 45, 5 25, 15 35" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
            <path d="M85 50 C100 30, 105 40, 95 55" fill="#f9ebd0" stroke="#3a2a15" strokeWidth="2" />
            
            {/* 손 */}
            <ellipse cx="15" cy="50" rx="6" ry="5" fill="#68b3c7" stroke="#3a2a15" strokeWidth="2" />
            <ellipse cx="95" cy="55" rx="7" ry="6" fill="#68b3c7" stroke="#3a2a15" strokeWidth="2" transform="rotate(-10, 95, 55)" />
            
            {/* 아쉬움 표시 */}
            <path d="M95 45 L95 65" fill="none" stroke="#3a2a15" strokeWidth="2" />
          </g>
        </g>
      </svg>
    </>
  );
};

  return (
  <div className="content-wrapper">
    {/* 앱 이름 */}
    <div className="app-title-container text-center">
      <h1 className="app-title">혼밥노노</h1>
      <div className="divider"></div>
    </div>
    
    {/* 메인 컨텐츠 */}
    <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', flex: 1}}>
      <div>
        {/* 1. 이름 입력 */}
        <div className="form-group">
          <label className="form-label">이름을 알려주세요</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력"
            className="form-input"
          />
        </div>

        {/* 2. 오늘 점심 가능 여부 - 주말에는 표시하지 않음 */}
        {!isWeekend && (
          <div className="form-group">
            <label className="form-label">오늘 점심 가능하세요?</label>
            
            <div className="button-container">
              {/* 점심 약속 없음 버튼 (행복한 밥그릇) */}
              <div 
                className={`button-option ${availableToday === true ? 'selected' : ''}`}
                onClick={() => setAvailableTodayAndUpdate(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="button-option-icon">
                  <HappyRiceBowl />
                  {availableToday === true && (
                    <div className="selection-indicator green">✓</div>
                  )}
                </div>
                <span className="button-option-label">점심 약속 없음</span>
              </div>
              
              {/* 점심 약속 있음 버튼 (슬픈 밥그릇) */}
              <div 
                className={`button-option ${availableToday === false ? 'selected' : ''}`}
                onClick={() => setAvailableTodayAndUpdate(false)}
                style={{ cursor: 'pointer' }}
              >
                <div className="button-option-icon">
                  <SadRiceBowl />
                  {availableToday === false && (
                    <div className="selection-indicator red">✓</div>
                  )}
                </div>
                <span className="button-option-label">점심 약속 있음</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. 이번 주 점심 가능 요일 */}
        <div className="form-group">
          <label className="form-label">
            {isWeekend ? '다음 주 점심 가능한 요일' : '이번 주 점심 가능한 요일'}
          </label>
          
          <div className="day-selector">
            {Object.keys(weeklyAvailability).map((day) => {
              const isPast = isPastDay(day);
              
              return (
                <div key={day} className="day-button-container">
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    disabled={isPast}
                    className={`day-button ${weeklyAvailability[day] ? 'selected' : ''}`}
                  >
                    {dayDisplay[day]}
                    {day === today && <div className="today-indicator"></div>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 완료 버튼 */}
      <div className="form-footer">
        <button type="submit" className="submit-button">
          {isEditing ? '수정 완료' : '완료'}
        </button>
        
        {/* 이미 입력한 경우 버튼 */}
        <button 
          type="button" 
          onClick={() => {
            // 편집 중이었다면 관련 정보 삭제
            if (isEditing) {
              localStorage.removeItem('editingUserId');
              localStorage.removeItem('editingUserAvailableDays');
              localStorage.removeItem('editingUserAvailableToday');
              localStorage.removeItem('editingUserName');
            }
            navigate('/users');
          }}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#999',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'block',
            margin: '20px auto 0'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#f5f5f5';
            e.target.style.color = '#666';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#999';
          }}
        >
          {isEditing ? '수정 취소' : '내 상태는 이미 입력했어'}
        </button>
      </div>
    </form>

    {/* 에러 다이얼로그 */}
    {showErrorDialog && (
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
            {errorMessage === '다음에 함께해요!' ? errorMessage : '확인 필요'}
          </h3>

          {errorMessage !== '다음에 함께해요!' && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#3a2a15' }}>
                {errorMessage}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowErrorDialog(false)}
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
            확인
          </button>
        </div>
      </div>
       )}
  </div>
);
}