import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LunchAppointmentFinal() {
  // 최종 확정된 멤버 상태
  const [finalMembers, setFinalMembers] = useState([]);
  
  const navigate = useNavigate();
  
  // 현재 날짜 (금요일로 가정)
  const today = '목';
  const date = '2025년 4월 24일';
  
  // 컴포넌트가 마운트될 때 로컬 스토리지에서 최종 멤버 데이터 가져오기
  useEffect(() => {
    const storedMembers = JSON.parse(localStorage.getItem('finalMembers') || '[]');
    setFinalMembers(storedMembers);
    
    // 최종 멤버가 없으면 사용자 목록 페이지로 리다이렉트
    if (storedMembers.length === 0) {
      navigate('/users');
    }
  }, [navigate]);
  
  // 완료 버튼 처리
  const handleComplete = () => {
    // 모든 데이터 초기화
    localStorage.removeItem('finalMembers');
    
    // 첫 페이지로 이동
    navigate('/');
  };

  return (
    <div className="card">
      {/* 앱 이름 */}
      <div className="text-center">
        <h1 className="app-title">혼밥노노</h1>
        <div className="divider"></div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div>
        {/* 날짜 */}
        <div className="date-display">
          <div className="date-tag">
            <span>{date} ({today})</span>
          </div>
        </div>
        
        {/* 섹션 제목 */}
        <h2 className="section-title">오늘 점약 멤버</h2>
        
        {/* 최종 확정 멤버 */}
        <div className="final-members-container">
          <div className="final-members-list">
            {finalMembers.map(member => (
              <div 
                key={member.id}
                className="final-member-item"
              >
                {/* 사용자 아바타 */}
                <div className="member-avatar">
                  {member.name.charAt(0)}
                </div>
                
                {/* 사용자 이름 */}
                <div className="member-name">
                  {member.name}
                </div>
                
                {/* 확정 체크 아이콘 */}
                <div className="member-check">✓</div>
              </div>
            ))}
          </div>
          
          {/* 안내 메시지 */}
          <div className="info-message">
            <p>연락은 Knox 메신져로 :-)</p>
          </div>
        </div>
        
        {/* 완료 버튼 */}
        <button 
          onClick={handleComplete}
          className="submit-button"
        >
          완료
        </button>
      </div>
    </div>
  );
}