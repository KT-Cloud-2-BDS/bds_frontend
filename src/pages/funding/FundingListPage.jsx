import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient.js';

const STATUS_LABELS = {
    SCHEDULED: '예정 펀딩',
    ACTIVE: '진행 중 펀딩',
    CLOSED: '종료된 펀딩',
};

export default function FundingListPage() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'INSTANT';
    const status = searchParams.get('status') || 'ACTIVE';

    const [fundings, setFundings] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observerRef = useRef();

    // type/status 변경 시 + 데이터 fetch를 하나의 useEffect로 통합
    const prevTypeRef = useRef(type);
    const prevStatusRef = useRef(status);

    useEffect(() => {
        let currentPage = page;

        // type/status 변경 감지 시 리셋
        if (prevTypeRef.current !== type || prevStatusRef.current !== status) {
            setFundings([]);
            setHasMore(true);
            setPage(0);
            currentPage = 0;
            prevTypeRef.current = type;
            prevStatusRef.current = status;
        }

        if (loading || !hasMore) return;

        const fetchFundings = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/api/fundings', {
                    params: { type, status, page: currentPage, size: 9 },
                });
                const data = res.data;
                setFundings((prev) => (currentPage === 0 ? data.content : [...prev, ...data.content]));
                setHasMore(!data.last);
            } catch (err) {
                console.error('목록 조회 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFundings();
    }, [page, type, status]);

    const lastElementRef = useCallback(
        (node) => {
            if (loading) return;
            if (observerRef.current) observerRef.current.disconnect();
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prev) => prev + 1);
                }
            });
            if (node) observerRef.current.observe(node);
        },
        [loading, hasMore]
    );

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
                <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← 홈으로</Link>
                <h1 className="text-2xl font-bold mt-2">
                    {type === 'INSTANT' ? '즉시 펀딩' : '예약 펀딩'} &gt; {STATUS_LABELS[status]}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fundings.map((funding, index) => (
                    <div key={funding.id} ref={index === fundings.length - 1 ? lastElementRef : null}>
                        <Link
                            to={`/fundings/${funding.id}`}
                            className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                            <h3 className="font-bold text-base mb-2 line-clamp-2">{funding.title}</h3>
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {funding.goalAmount > 0
                        ? Math.min(Math.round((funding.currentAmount / funding.goalAmount) * 100), 100)
                        : 0}% 달성
                  </span>
                                    <span>{funding.participationCnt}명</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-teal-400"
                                        style={{
                                            width: `${Math.min(Math.round((funding.currentAmount / funding.goalAmount) * 100), 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-sm">
                                <span className="font-bold text-teal-600">{funding.currentAmount?.toLocaleString()}원</span>
                                <span className="text-gray-400"> / {funding.goalAmount?.toLocaleString()}원</span>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {loading && <div className="text-center py-8 text-gray-400">로딩 중...</div>}
            {!hasMore && fundings.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">모든 펀딩을 불러왔습니다.</div>
            )}
            {!loading && fundings.length === 0 && (
                <div className="text-center py-16 text-gray-400">해당 펀딩이 없습니다.</div>
            )}
        </div>
    );
}