import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';

const TABS = [
  { key: 'INSTANT', label: '즉시 펀딩' },
  { key: 'RESERVED', label: '예약 펀딩' },
];

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('type') || 'INSTANT';

  const [scheduled, setScheduled] = useState([]);
  const [active, setActive] = useState([]);
  const [closed, setClosed] = useState([]);
  const [loading, setLoading] = useState(false);

  const [scheduledTotal, setScheduledTotal] = useState(0);
  const [activeTotal, setActiveTotal] = useState(0);
  const [closedTotal, setClosedTotal] = useState(0);

  useEffect(() => {
    fetchAll();
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setSearchParams({ type: tabKey });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, cRes] = await Promise.all([
        apiClient.get('/api/fundings', { params: { type: activeTab, status: 'SCHEDULED', page: 0, size: 9 } }),
        apiClient.get('/api/fundings', { params: { type: activeTab, status: 'ACTIVE', page: 0, size: 9 } }),
        apiClient.get('/api/fundings', { params: { type: activeTab, status: 'CLOSED', page: 0, size: 9 } }),
      ]);

      setScheduled(sRes.data.content);
      setScheduledTotal(sRes.data.totalElements);

      setActive(aRes.data.content);
      setActiveTotal(aRes.data.totalElements);

      setClosed(cRes.data.content);
      setClosedTotal(cRes.data.totalElements);
    } catch (err) {
      console.error('펀딩 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4 text-center py-12 text-gray-400">로딩 중...</div>;
  }

  return (
      <div className="max-w-4xl mx-auto p-4">
        {/* 탭 */}
        <div className="flex border-b mb-6">
          {TABS.map((tab) => (
              <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-6 py-3 font-bold text-sm cursor-pointer ${
                      activeTab === tab.key
                          ? 'border-b-2 border-teal-500 text-teal-600'
                          : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {tab.label}
              </button>
          ))}
        </div>

        <div className="space-y-10">
          <FundingSection
              title="🗓️ 예정 펀딩"
              subtitle="곧 시작될 펀딩"
              fundings={scheduled}
              total={scheduledTotal}
              badgeType="scheduled"
              moreLink={`/fundings/list?type=${activeTab}&status=SCHEDULED`}
          />

          <FundingSection
              title="🔥 진행 중"
              subtitle="곧 마감될 펀딩"
              fundings={active}
              total={activeTotal}
              badgeType="active"
              moreLink={`/fundings/list?type=${activeTab}&status=ACTIVE`}
          />

          <FundingSection
              title="✅ 종료된 펀딩"
              subtitle="최근 종료된 펀딩"
              fundings={closed}
              total={closedTotal}
              badgeType="closed"
              moreLink={`/fundings/list?type=${activeTab}&status=CLOSED`}
          />
        </div>
      </div>
  );
}

function FundingSection({ title, subtitle, fundings, total, badgeType, moreLink }) {
  if (fundings.length === 0) return null;

  return (
      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          {total > 9 && (
              <Link
                  to={moreLink}
                  className="text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                전체보기 ({total}) →
              </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fundings.map((funding) => (
              <FundingCard key={funding.id} funding={funding} badgeType={badgeType} />
          ))}
        </div>
      </section>
  );
}

function FundingCard({ funding, badgeType }) {
  const progressPercent = funding.goalAmount > 0
      ? Math.min(Math.round((funding.currentAmount / funding.goalAmount) * 100), 100)
      : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getBadge = () => {
    switch (badgeType) {
      case 'scheduled':
        return { text: '예정', color: 'bg-blue-100 text-blue-700' };
      case 'active':
        return { text: '진행중', color: 'bg-green-100 text-green-700' };
      case 'closed':
        return funding.isSuccess
            ? { text: '성공', color: 'bg-green-100 text-green-700' }
            : { text: '실패', color: 'bg-red-100 text-red-700' };
      default:
        return null;
    }
  };

  const badge = getBadge();

  return (
      <Link
          to={`/fundings/${funding.id}`}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
      >
        {badge && (
            <div className="mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                        {badge.text}
                    </span>
            </div>
        )}

        <h3 className="font-bold text-base mb-2 line-clamp-2">{funding.title}</h3>

        {badgeType !== 'scheduled' && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{progressPercent}% 달성</span>
                <span>{funding.participationCnt}명 참여</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full ${progressPercent >= 100 ? 'bg-teal-500' : 'bg-teal-400'}`}
                    style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
        )}

        <div className="text-sm text-gray-600">
                <span className="font-bold text-teal-600">
                    {funding.currentAmount?.toLocaleString()}원
                </span>
          <span className="text-gray-400"> / {funding.goalAmount?.toLocaleString()}원</span>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          {formatDate(funding.startAt)} ~ {formatDate(funding.holdTo)}
        </div>
      </Link>
  );
}