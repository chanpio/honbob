import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LunchAvailabilityForm() {
  const [name, setName] = useState('');
  const [availableToday, setAvailableToday] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    '월': false,
    '화': false,
    '수': false,
    '목': false,
    '금': false
  });
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  // 오늘이 목요일이라고 가정
  const today = '목';
  const dayOrder = ['월', '화', '수', '목', '금'];
  const todayIndex = dayOrder.indexOf(today);

  const toggleDay = (day) => {
    // 오늘 이전의 날짜는 선택 불가
    if (dayOrder.indexOf(day) < todayIndex) {
      return;
    }
    
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  // 점심 약속 없음/있음 선택 시 요일 자동 업데이트
  const setAvailableTodayAndUpdate = (isAvailable) => {
    setAvailableToday(isAvailable);
    
    if (isAvailable) {
      // 점심 약속 없음 선택 시 오늘 요일 자동으로 체크
      setWeeklyAvailability(prev => ({
        ...prev,
        [today]: true
      }));
    } else {
      // 점심 약속 있음 선택 시 모든 요일 선택 해제
      setWeeklyAvailability({
        '월': false,
        '화': false,
        '수': false,
        '목': false,
        '금': false
      });
    }
  };

  // 해당 요일이 오늘보다 이전인지 확인하는 함수
  const isPastDay = (day) => {
    return dayOrder.indexOf(day) < todayIndex;
  };
  
  // 폼 제출 처리
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 점심 약속 있음을 선택한 경우는 이름 검증 생략
    if (availableToday === false) {
      // 점심 약속 있음을 선택한 경우, 감사 메시지와 함께 첫 페이지로 이동
      setErrorMessage('다음에 함께해요!');
      setShowErrorDialog(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return;
    }
    
    // 점심 약속 없음을 선택한 경우에만 이름 검증
    if (!name) {
      setErrorMessage('이름을 입력해주세요!');
      setShowErrorDialog(true);
      return;
    }
    
    if (availableToday === null) {
      setErrorMessage('오늘 점심 가능 여부를 선택해주세요!');
      setShowErrorDialog(true);
      return;
    }
    
    // 사용자 정보 저장 (로컬 스토리지에 저장하는 방식으로 구현)
    const userData = {
      id: Date.now(),
      name,
      availableToday,
      availableDays: Object.keys(weeklyAvailability).filter(day => weeklyAvailability[day])
    };
    
    // 현재 저장된 사용자 목록 가져오기
    const existingUsers = JSON.parse(localStorage.getItem('honbabUsers') || '[]');
    
    // 새 사용자 추가
    existingUsers.push(userData);
    
    // 업데이트된 사용자 목록 저장
    localStorage.setItem('honbabUsers', JSON.stringify(existingUsers));
    
    // 점심 약속 없음인 경우 다음 페이지로 이동
    navigate('/users');
  };

  // 밥그릇 SVG 구현
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
        
        {/* 말풍선 */}
        <g transform="translate(40, 10)">
          <rect x="-20" y="-15" width="60" height="20" rx="10" ry="10" fill="white" stroke="#3a2a15" strokeWidth="1" />
          <path d="M0 5 L-5 15 L5 5" fill="white" stroke="#3a2a15" strokeWidth="1" />
          <text x="10" y="-2" fontSize="8" textAnchor="middle" fill="#3a2a15" fontWeight="bold">같이 먹어요!</text>
        </g>
      </g>
    </svg>
  );

  const SadRiceBowl = () => (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <g transform="translate(10, 10)">
        {/* 그림자 */}
        <ellipse cx="50" cy="105" rx="20" ry="5" fill="#f3e3c2" opacity="0.6" />
        
        {/* 밥그릇 - 흰색으로 변경, 아랫부분 둥글게 */}
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
        <ellipse cx="35" cy="50" rx="5" ry="7" fill="#3a2a15" />
        <ellipse cx="65" cy="50" rx="5" ry="7" fill="#3a2a15" />
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
        
        {/* 말풍선 */}
        <g transform="translate(40, 10)">
          <rect x="-20" y="-15" width="60" height="20" rx="10" ry="10" fill="white" stroke="#3a2a15" strokeWidth="1" />
          <path d="M0 5 L-5 15 L5 5" fill="white" stroke="#3a2a15" strokeWidth="1" />
          <text x="10" y="-2" fontSize="8" textAnchor="middle" fill="#3a2a15" fontWeight="bold">약속 있어요!</text>
        </g>
      </g>
    </svg>
  );

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

        {/* 2. 오늘 점심 가능 여부 */}
        <div className="form-group">
          <label className="form-label">오늘 점심 가능하세요?</label>
          
          <div className="button-container">
            {/* 점심 약속 없음 버튼 (행복한 밥그릇) */}
            <div 
              className={`button-option ${availableToday === true ? 'selected' : ''}`}
              onClick={() => setAvailableTodayAndUpdate(true)}
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

        {/* 3. 이번 주 점심 가능 요일 */}
        <div className="form-group">
          <label className="form-label">이번 주 점심 가능한 요일</label>
          
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
                    {day}
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
          완료
        </button>
        
        {/* 이미 입력한 경우 버튼 */}
        <button 
          type="button" 
          onClick={() => navigate('/users')}
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
          내 상태는 이미 입력했어
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